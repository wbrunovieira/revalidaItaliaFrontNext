# GuardDuty - Proteção contra malware e ameaças no S3
# Esta é a solução mais simples da AWS para segurança

# Habilitar GuardDuty na conta
resource "aws_guardduty_detector" "main" {
  enable = true
  
  # Frequência de análise (FIFTEEN_MINUTES, ONE_HOUR, or SIX_HOURS)
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  # Habilitar proteção S3
  datasources {
    s3_logs {
      enable = true
    }
    
    # Proteção contra malware em S3 (novo recurso)
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name        = "revalida-guardduty"
    Environment = "production"
    Purpose     = "S3 malware protection"
  }
}

# Habilitar proteção específica para nosso bucket S3
resource "aws_guardduty_detector_feature" "s3_protection" {
  detector_id = aws_guardduty_detector.main.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# SNS Topic para alertas do GuardDuty
resource "aws_sns_topic" "guardduty_alerts" {
  name = "guardduty-s3-alerts"
  
  tags = {
    Name = "GuardDuty S3 Alerts"
  }
}

# Inscrição de email para receber alertas
resource "aws_sns_topic_subscription" "guardduty_email" {
  topic_arn = aws_sns_topic.guardduty_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email  # Adicionar email nas variáveis
}

# EventBridge Rule para capturar findings do GuardDuty
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-findings"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        4, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9,  # Medium
        7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9,  # High
        8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9   # Critical
      ]
    }
  })
}

# Target do EventBridge para SNS
resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.guardduty_alerts.arn
}

# Permissão para EventBridge publicar no SNS
resource "aws_sns_topic_policy" "guardduty_alerts" {
  arn = aws_sns_topic.guardduty_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.guardduty_alerts.arn
      }
    ]
  })
}

# S3 Bucket Logging para GuardDuty analisar
resource "aws_s3_bucket_logging" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# Bucket para logs (necessário para GuardDuty)
resource "aws_s3_bucket" "logs" {
  bucket = "${var.s3_bucket_name}-logs"
  
  tags = {
    Name        = "S3 Access Logs"
    Environment = "production"
  }
}

# Configuração de ownership para bucket de logs
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Configuração de ACL para bucket de logs
resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id
  acl    = "log-delivery-write"
  
  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

# Bloquear acesso público ao bucket de logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule para limpar logs antigos
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    filter {}  # Apply to all objects

    expiration {
      days = 30  # Deletar logs após 30 dias
    }
  }
}

# Output para verificar status
output "guardduty_detector_id" {
  value       = aws_guardduty_detector.main.id
  description = "GuardDuty Detector ID"
}


output "sns_topic_arn" {
  value       = aws_sns_topic.guardduty_alerts.arn
  description = "SNS Topic ARN for GuardDuty alerts"
}