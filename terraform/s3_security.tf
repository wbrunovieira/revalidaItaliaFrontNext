# Configurações adicionais de segurança para S3
# Validação básica de arquivos sem necessidade de antivírus complexo

# Criar o ZIP do Lambda automaticamente
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/index.js"
  output_path = "${path.module}/file_validator.zip"
}

# Lambda para validação básica de arquivos
resource "aws_lambda_function" "file_validator" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "s3-file-validator"
  role            = aws_iam_role.lambda_validator.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      ALLOWED_EXTENSIONS = "pdf,doc,docx,jpg,jpeg,png"
      MAX_FILE_SIZE      = "10485760"  # 10MB
      SNS_TOPIC_ARN     = aws_sns_topic.guardduty_alerts.arn
    }
  }

  tags = {
    Name = "S3 File Validator"
  }
}

# IAM Role para Lambda
resource "aws_iam_role" "lambda_validator" {
  name = "s3-file-validator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Policy para Lambda acessar S3 e SNS
resource "aws_iam_role_policy" "lambda_validator_policy" {
  name = "s3-file-validator-policy"
  role = aws_iam_role.lambda_validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.public_assets.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.guardduty_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Trigger Lambda quando arquivo é uploaded
resource "aws_s3_bucket_notification" "file_upload" {
  bucket = aws_s3_bucket.public_assets.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.file_validator.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "public/documents/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Permissão para S3 invocar Lambda
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.file_validator.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.public_assets.arn
}

# CloudWatch Log Group para Lambda
resource "aws_cloudwatch_log_group" "lambda_validator" {
  name              = "/aws/lambda/s3-file-validator"
  retention_in_days = 7
}

# Configurações de segurança adicionais para o bucket
resource "aws_s3_bucket_lifecycle_configuration" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  rule {
    id     = "delete-suspicious-files"
    status = "Enabled"

    # Deletar arquivos marcados como suspeitos após 1 dia
    expiration {
      days = 1
    }

    filter {
      tag {
        key   = "Status"
        value = "Suspicious"
      }
    }
  }

  rule {
    id     = "archive-old-files"
    status = "Enabled"

    # Mover arquivos antigos para Glacier após 90 dias
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}


# Habilitar criptografia padrão no bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Output
output "lambda_function_name" {
  value       = aws_lambda_function.file_validator.function_name
  description = "Name of the file validator Lambda function"
}