#!/bin/bash
# Script para restaurar backups do AWS Backup

set -e

echo "========================================="
echo "AWS Backup Restore Script"
echo "========================================="

# Configurações
AWS_REGION=${AWS_REGION:-us-east-2}
VAULT_NAME="revalida-backup-vault"

# Função para listar recovery points
list_recovery_points() {
    echo "Listando recovery points disponíveis..."
    aws backup list-recovery-points-by-backup-vault \
        --backup-vault-name $VAULT_NAME \
        --region $AWS_REGION \
        --query 'RecoveryPoints[*].[RecoveryPointArn, CreationDate, ResourceType]' \
        --output table
}

# Função para restaurar EC2
restore_ec2() {
    local RECOVERY_POINT_ARN=$1
    local INSTANCE_NAME=$2
    
    echo "Iniciando restore de EC2..."
    
    RESTORE_JOB=$(aws backup start-restore-job \
        --region $AWS_REGION \
        --recovery-point-arn "$RECOVERY_POINT_ARN" \
        --iam-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/revalida-backup-role" \
        --metadata "InstanceType=t3.small,SubnetId=subnet-default,SecurityGroupIds=sg-default" \
        --query 'RestoreJobId' \
        --output text)
    
    echo "Restore job iniciado: $RESTORE_JOB"
    echo "Monitorando progresso..."
    
    while true; do
        STATUS=$(aws backup describe-restore-job \
            --restore-job-id $RESTORE_JOB \
            --region $AWS_REGION \
            --query 'Status' \
            --output text)
        
        echo "Status: $STATUS"
        
        if [[ "$STATUS" == "COMPLETED" ]]; then
            echo "Restore concluído com sucesso!"
            break
        elif [[ "$STATUS" == "FAILED" ]] || [[ "$STATUS" == "ABORTED" ]]; then
            echo "Restore falhou!"
            exit 1
        fi
        
        sleep 10
    done
}

# Função para restaurar S3
restore_s3() {
    local RECOVERY_POINT_ARN=$1
    local BUCKET_NAME=$2
    
    echo "Iniciando restore de S3..."
    
    RESTORE_JOB=$(aws backup start-restore-job \
        --region $AWS_REGION \
        --recovery-point-arn "$RECOVERY_POINT_ARN" \
        --iam-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/revalida-backup-role" \
        --metadata "BucketName=${BUCKET_NAME}-restored" \
        --query 'RestoreJobId' \
        --output text)
    
    echo "Restore job iniciado: $RESTORE_JOB"
}

# Menu principal
echo ""
echo "Opções:"
echo "1. Listar recovery points"
echo "2. Restaurar EC2"
echo "3. Restaurar S3"
echo "4. Sair"
echo ""
read -p "Escolha uma opção: " OPTION

case $OPTION in
    1)
        list_recovery_points
        ;;
    2)
        list_recovery_points
        echo ""
        read -p "Cole o ARN do recovery point: " RECOVERY_ARN
        read -p "Nome para a nova instância: " INSTANCE_NAME
        restore_ec2 "$RECOVERY_ARN" "$INSTANCE_NAME"
        ;;
    3)
        list_recovery_points
        echo ""
        read -p "Cole o ARN do recovery point: " RECOVERY_ARN
        read -p "Nome do bucket: " BUCKET_NAME
        restore_s3 "$RECOVERY_ARN" "$BUCKET_NAME"
        ;;
    4)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "Script concluído!"