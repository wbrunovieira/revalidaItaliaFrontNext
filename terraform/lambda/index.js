// Lambda Function para validação básica de arquivos
// Esta é uma proteção simples sem antivírus complexo

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sns = new AWS.SNS();

const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,jpg,jpeg,png').split(',');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Padrões suspeitos em nomes de arquivos
const SUSPICIOUS_PATTERNS = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.zip$/i,
    /\.rar$/i,
    /\.(pdf|doc|docx)\.exe$/i,  // Double extension attack
    /<script/i,
    /javascript:/i,
    /on\w+=/i,  // onclick, onload, etc
];

// Magic numbers (file signatures) para validação
const FILE_SIGNATURES = {
    'pdf': [0x25, 0x50, 0x44, 0x46],  // %PDF
    'jpg': [0xFF, 0xD8, 0xFF],
    'png': [0x89, 0x50, 0x4E, 0x47],
    'doc': [0xD0, 0xCF, 0x11, 0xE0],
    'docx': [0x50, 0x4B, 0x03, 0x04]  // ZIP format (docx is a zip)
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const size = record.s3.object.size;
        
        try {
            // 1. Validar tamanho do arquivo
            if (size > MAX_FILE_SIZE) {
                await handleSuspiciousFile(bucket, key, `File too large: ${size} bytes`);
                continue;
            }
            
            // 2. Validar extensão
            const extension = key.split('.').pop().toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                await handleSuspiciousFile(bucket, key, `Invalid extension: ${extension}`);
                continue;
            }
            
            // 3. Verificar padrões suspeitos no nome
            for (const pattern of SUSPICIOUS_PATTERNS) {
                if (pattern.test(key)) {
                    await handleSuspiciousFile(bucket, key, `Suspicious filename pattern: ${pattern}`);
                    continue;
                }
            }
            
            // 4. Baixar primeiros bytes para verificar magic number
            const headObject = await s3.getObject({
                Bucket: bucket,
                Key: key,
                Range: 'bytes=0-10'  // Apenas primeiros 10 bytes
            }).promise();
            
            const fileHeader = headObject.Body;
            if (!validateFileSignature(extension, fileHeader)) {
                await handleSuspiciousFile(bucket, key, `File signature mismatch for ${extension}`);
                continue;
            }
            
            // 5. Marcar arquivo como verificado
            await s3.putObjectTagging({
                Bucket: bucket,
                Key: key,
                Tagging: {
                    TagSet: [
                        { Key: 'Status', Value: 'Verified' },
                        { Key: 'VerifiedAt', Value: new Date().toISOString() }
                    ]
                }
            }).promise();
            
            console.log(`File verified successfully: ${key}`);
            
        } catch (error) {
            console.error(`Error processing file ${key}:`, error);
            await sendAlert(`Error processing file ${key}: ${error.message}`);
        }
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify('File validation completed')
    };
};

function validateFileSignature(extension, fileHeader) {
    const signature = FILE_SIGNATURES[extension];
    if (!signature) {
        return true; // Se não temos assinatura para validar, assumir OK
    }
    
    for (let i = 0; i < signature.length; i++) {
        if (fileHeader[i] !== signature[i]) {
            return false;
        }
    }
    
    return true;
}

async function handleSuspiciousFile(bucket, key, reason) {
    console.error(`Suspicious file detected: ${key} - Reason: ${reason}`);
    
    // 1. Marcar arquivo como suspeito
    await s3.putObjectTagging({
        Bucket: bucket,
        Key: key,
        Tagging: {
            TagSet: [
                { Key: 'Status', Value: 'Suspicious' },
                { Key: 'Reason', Value: reason },
                { Key: 'DetectedAt', Value: new Date().toISOString() }
            ]
        }
    }).promise();
    
    // 2. Enviar alerta
    await sendAlert(`Suspicious file detected: ${key}\nReason: ${reason}\nBucket: ${bucket}`);
    
    // 3. Opcionalmente, mover para quarentena ou deletar
    // await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
}

async function sendAlert(message) {
    if (!SNS_TOPIC_ARN) {
        console.log('SNS Topic not configured, skipping alert');
        return;
    }
    
    try {
        await sns.publish({
            TopicArn: SNS_TOPIC_ARN,
            Subject: 'S3 Security Alert - Revalida Italia',
            Message: message
        }).promise();
    } catch (error) {
        console.error('Failed to send SNS alert:', error);
    }
}