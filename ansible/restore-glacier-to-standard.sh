#!/bin/bash
# Script para mover imagens restauradas do Glacier para S3 Standard permanentemente
# Executar após 3-5 horas quando a restauração completar

BUCKET="revalida-documents-891ff933"
PROFILE="bruno-admin-revalida-aws"

echo "Verificando imagens no Glacier..."
GLACIER_FILES=$(aws s3api list-objects-v2 --bucket $BUCKET --prefix "images/" --query "Contents[?StorageClass=='GLACIER'].Key" --output text --profile $PROFILE)

if [ -z "$GLACIER_FILES" ]; then
  echo "Nenhuma imagem no Glacier. Tudo já está no S3 Standard!"
  exit 0
fi

echo "Copiando imagens para S3 Standard..."
for key in $GLACIER_FILES; do
  echo "Copiando: $key"
  aws s3 cp "s3://$BUCKET/$key" "s3://$BUCKET/$key" \
    --storage-class STANDARD \
    --metadata-directive COPY \
    --profile $PROFILE 2>&1
done

echo "Concluído! Todas as imagens agora estão no S3 Standard."
