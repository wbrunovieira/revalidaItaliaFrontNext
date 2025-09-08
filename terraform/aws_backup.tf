# AWS Backup Configuration
# Backup automático para EC2, EBS volumes e S3

# Backup Vault - Cofre seguro para armazenar backups
resource "aws_backup_vault" "main" {
  name        = "revalida-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name        = "Revalida Backup Vault"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# KMS Key para criptografar backups
resource "aws_kms_key" "backup" {
  description             = "KMS key for AWS Backup encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "Revalida Backup KMS Key"
    Environment = "production"
  }
}

# Alias para a KMS Key
resource "aws_kms_alias" "backup" {
  name          = "alias/revalida-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup Plan - Plano de backup com múltiplas regras
resource "aws_backup_plan" "main" {
  name = "revalida-backup-plan"

  # Regra de backup diário
  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 * * ? *)"  # Todos os dias às 3 AM UTC
    start_window      = 60  # 60 minutos para iniciar
    completion_window = 120  # 120 minutos para completar

    lifecycle {
      delete_after = 7  # Manter backups diários por 7 dias
    }

    recovery_point_tags = {
      Type      = "Daily"
      Automated = "true"
    }
  }

  # Regra de backup semanal
  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 4 ? * 1 *)"  # Toda segunda-feira às 4 AM UTC
    start_window      = 60
    completion_window = 180

    lifecycle {
      delete_after = 30  # Manter backups semanais por 30 dias
    }

    recovery_point_tags = {
      Type      = "Weekly"
      Automated = "true"
    }
  }

  # Regra de backup mensal
  rule {
    rule_name         = "monthly_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 1 * ? *)"  # Primeiro dia do mês às 5 AM UTC
    start_window      = 60
    completion_window = 360

    lifecycle {
      delete_after       = 365  # Manter backups mensais por 1 ano
      cold_storage_after = 30   # Mover para cold storage após 30 dias
    }

    recovery_point_tags = {
      Type      = "Monthly"
      Automated = "true"
    }
  }

  tags = {
    Name        = "Revalida Backup Plan"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# IAM Role para AWS Backup
resource "aws_iam_role" "backup" {
  name = "revalida-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "Revalida Backup Role"
    Environment = "production"
  }
}

# Attach AWS managed policy para Backup
resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Attach AWS managed policy para Restore
resource "aws_iam_role_policy_attachment" "restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup Selection - Recursos para fazer backup
resource "aws_backup_selection" "main" {
  name         = "revalida-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  # Backup de EC2 instances por tag
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "true"
  }

  # Recursos específicos para backup
  resources = [
    aws_instance.frontend.arn,
    # Adicionar ARN do backend quando disponível
    # "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/i-0184ffbf8646e8801"
  ]
}

# Tag EC2 Frontend para backup
resource "aws_ec2_tag" "frontend_backup" {
  resource_id = aws_instance.frontend.id
  key         = "Backup"
  value       = "true"
}

# Backup do S3 (configuração adicional)
resource "aws_backup_selection" "s3" {
  name         = "revalida-s3-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_s3_bucket.public_assets.arn,
    aws_s3_bucket.logs.arn
  ]
}

# Policy adicional para S3 backup
resource "aws_iam_role_policy" "backup_s3" {
  name = "backup-s3-policy"
  role = aws_iam_role.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.public_assets.arn,
          "${aws_s3_bucket.public_assets.arn}/*",
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

# Data source para account ID
data "aws_caller_identity" "current" {}

# CloudWatch Log Group para AWS Backup
resource "aws_cloudwatch_log_group" "backup" {
  name              = "/aws/backup/revalida"
  retention_in_days = 30

  tags = {
    Name        = "Revalida Backup Logs"
    Environment = "production"
  }
}

# SNS Topic para notificações de backup
resource "aws_sns_topic" "backup_notifications" {
  name = "revalida-backup-notifications"

  tags = {
    Name        = "Backup Notifications"
    Environment = "production"
  }
}

# Subscription email para notificações de backup
resource "aws_sns_topic_subscription" "backup_email" {
  topic_arn = aws_sns_topic.backup_notifications.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Backup Vault Notifications
resource "aws_backup_vault_notifications" "main" {
  backup_vault_name   = aws_backup_vault.main.name
  sns_topic_arn       = aws_sns_topic.backup_notifications.arn
  
  # Eventos para notificar
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_STARTED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED"
  ]
}

# CloudWatch Alarms para Backup
resource "aws_cloudwatch_metric_alarm" "backup_failed" {
  alarm_name          = "revalida-backup-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfBackupJobsFailed"
  namespace           = "AWS/Backup"
  period              = "86400"  # 24 horas
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when backup jobs fail"
  alarm_actions       = [aws_sns_topic.backup_notifications.arn]

  dimensions = {
    BackupVaultName = aws_backup_vault.main.name
  }

  tags = {
    Name = "Backup Failed Alert"
  }
}

# Output das configurações de backup
output "backup_configuration" {
  value = {
    vault_name  = aws_backup_vault.main.name
    vault_arn   = aws_backup_vault.main.arn
    plan_id     = aws_backup_plan.main.id
    plan_arn    = aws_backup_plan.main.arn
    kms_key_id  = aws_kms_key.backup.id
  }
  description = "AWS Backup configuration details"
}