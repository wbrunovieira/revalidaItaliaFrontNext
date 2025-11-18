// /src/lib/document-upload.ts

/**
 * Tipos de arquivo suportados e suas configurações
 */

export type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

export interface FileValidationError {
  type: 'size' | 'type' | 'protection';
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: FileValidationError;
}

/**
 * MIME types aceitos para proteção NONE
 */
export const NONE_PROTECTION_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/zip'
] as const;

/**
 * MIME types aceitos para proteção WATERMARK e FULL
 */
export const PROTECTED_MIME_TYPES = ['application/pdf'] as const;

/**
 * Extensões de arquivo aceitas para proteção NONE
 */
export const NONE_PROTECTION_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.rtf',
  '.zip'
] as const;

/**
 * Extensões de arquivo aceitas para proteção WATERMARK e FULL
 */
export const PROTECTED_EXTENSIONS = ['.pdf'] as const;

/**
 * Tamanho máximo de arquivo em bytes (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Retorna os tipos MIME aceitos baseado no nível de proteção
 */
export function getAcceptedMimeTypes(protectionLevel: ProtectionLevel): string[] {
  if (protectionLevel === 'NONE') {
    return [...NONE_PROTECTION_MIME_TYPES];
  }
  return [...PROTECTED_MIME_TYPES];
}

/**
 * Retorna as extensões aceitas baseado no nível de proteção
 */
export function getAcceptedExtensions(protectionLevel: ProtectionLevel): string[] {
  if (protectionLevel === 'NONE') {
    return [...NONE_PROTECTION_EXTENSIONS];
  }
  return [...PROTECTED_EXTENSIONS];
}

/**
 * Retorna o atributo accept para input file baseado no nível de proteção
 */
export function getFileInputAccept(protectionLevel: ProtectionLevel | ''): string {
  // Se não houver proteção selecionada, aceitar todos os formatos suportados
  if (!protectionLevel) {
    return [...NONE_PROTECTION_EXTENSIONS].join(',');
  }
  return getAcceptedExtensions(protectionLevel).join(',');
}

/**
 * Mapeia MIME type para nome legível do formato
 */
export function getMimeTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word (.doc)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
    'application/vnd.ms-excel': 'Excel (.xls)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
    'application/vnd.ms-powerpoint': 'PowerPoint (.ppt)',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
    'text/plain': 'Texto (.txt)',
    'text/csv': 'CSV',
    'application/rtf': 'RTF',
    'application/zip': 'ZIP'
  };

  return labels[mimeType] || mimeType;
}

/**
 * Retorna descrição dos formatos aceitos baseado no nível de proteção
 */
export function getAcceptedFormatsDescription(protectionLevel: ProtectionLevel | ''): string {
  if (protectionLevel === 'NONE' || !protectionLevel) {
    return 'PDF, Word, Excel, PowerPoint, Texto, RTF, ZIP';
  }
  return 'PDF';
}

/**
 * Valida arquivo baseado no nível de proteção
 */
export function validateFile(
  file: File,
  protectionLevel: ProtectionLevel
): FileValidationResult {
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        type: 'size',
        message: `Arquivo muito grande. Tamanho máximo: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Tamanho do arquivo: ${Math.round(file.size / 1024 / 1024)}MB`
      }
    };
  }

  // Validar tipo MIME baseado em proteção
  const acceptedMimeTypes = getAcceptedMimeTypes(protectionLevel);
  const isValidMimeType = acceptedMimeTypes.some(mimeType => mimeType === file.type);

  if (!isValidMimeType) {
    if (protectionLevel === 'NONE') {
      return {
        isValid: false,
        error: {
          type: 'type',
          message: `Tipo de arquivo não suportado para proteção NONE. Aceitos: ${getAcceptedFormatsDescription(protectionLevel)}. Recebido: ${getMimeTypeLabel(file.type)}`
        }
      };
    } else {
      return {
        isValid: false,
        error: {
          type: 'protection',
          message: `Documentos com proteção ${protectionLevel} devem ser PDF. O processamento de marca d'água requer formato PDF. Recebido: ${getMimeTypeLabel(file.type)}`
        }
      };
    }
  }

  return { isValid: true };
}

/**
 * Formata tamanho de arquivo em formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Retorna ícone apropriado baseado no MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('text')) return '📃';
  if (mimeType.includes('zip')) return '📦';
  return '📁';
}
