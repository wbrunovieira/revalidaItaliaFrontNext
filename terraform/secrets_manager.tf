# AWS Secrets Manager Configuration
# Gerenciamento seguro de credenciais e chaves

# Secret para Cloudflare API Token
resource "aws_secretsmanager_secret" "cloudflare_api_token" {
  name                    = "revalida-cloudflare-api-token"
  description            = "Cloudflare API Token for DNS management"
  recovery_window_in_days = 7  # Período de recuperação antes de deletar permanentemente

  tags = {
    Name        = "Cloudflare API Token"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Valor do secret Cloudflare
resource "aws_secretsmanager_secret_version" "cloudflare_api_token" {
  secret_id     = aws_secretsmanager_secret.cloudflare_api_token.id
  secret_string = jsonencode({
    api_token = var.cloudflare_api_token
    zone_id   = var.cloudflare_zone_id
  })
}

# Secret para Alert Email
resource "aws_secretsmanager_secret" "alert_email" {
  name                    = "revalida-alert-email"
  description            = "Email for security and monitoring alerts"
  recovery_window_in_days = 7

  tags = {
    Name        = "Alert Email Configuration"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Valor do secret Alert Email
resource "aws_secretsmanager_secret_version" "alert_email" {
  secret_id     = aws_secretsmanager_secret.alert_email.id
  secret_string = jsonencode({
    email     = var.alert_email
    sns_topic = aws_sns_topic.guardduty_alerts.arn
  })
}

# Secret para Database Credentials (para uso futuro)
resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "revalida-database-credentials"
  description            = "Database connection credentials"
  recovery_window_in_days = 7

  tags = {
    Name        = "Database Credentials"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Rotação para Database Credentials será configurada quando tivermos Lambda
# resource "aws_secretsmanager_secret_rotation" "database_credentials" {
#   secret_id           = aws_secretsmanager_secret.database_credentials.id
#   rotation_lambda_arn = "arn:aws:lambda:..."
#   rotation_rules {
#     automatically_after_days = 30
#   }
# }

# Valor do secret Database (placeholder - atualizar com valores reais)
resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id     = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    engine   = "postgres"
    host     = "to-be-configured"
    port     = 5432
    database = "revalida"
    username = "admin"
    password = "to-be-configured"  # Será atualizado quando o banco for criado
  })

  lifecycle {
    ignore_changes = [secret_string]  # Ignorar mudanças após configuração inicial
  }
}

# Secret para API Keys da aplicação
resource "aws_secretsmanager_secret" "app_api_keys" {
  name                    = "revalida-app-api-keys"
  description            = "Application API keys and secrets"
  recovery_window_in_days = 7

  tags = {
    Name        = "Application API Keys"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Valor do secret API Keys
resource "aws_secretsmanager_secret_version" "app_api_keys" {
  secret_id     = aws_secretsmanager_secret.app_api_keys.id
  secret_string = jsonencode({
    next_public_api_url = var.NEXT_PUBLIC_API_URL
    panda_api_key       = ""  # Adicionar quando disponível
    jwt_secret          = random_password.jwt_secret.result
    session_secret      = random_password.session_secret.result
  })
}

# Gerar JWT Secret aleatório
resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

# Gerar Session Secret aleatório
resource "random_password" "session_secret" {
  length  = 32
  special = true
}

# IAM Policy para EC2 acessar Secrets
resource "aws_iam_policy" "secrets_manager_read" {
  name        = "revalida-secrets-manager-read"
  description = "Allow reading secrets from AWS Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecrets"
        ]
        Resource = [
          aws_secretsmanager_secret.cloudflare_api_token.arn,
          aws_secretsmanager_secret.alert_email.arn,
          aws_secretsmanager_secret.database_credentials.arn,
          aws_secretsmanager_secret.app_api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Frontend role
resource "aws_iam_role_policy_attachment" "frontend_secrets_access" {
  role       = aws_iam_role.frontend_combined.name
  policy_arn = aws_iam_policy.secrets_manager_read.arn
}

# Secret para SSH Keys (opcional - mais seguro que arquivo local)
resource "aws_secretsmanager_secret" "ssh_keys" {
  name                    = "revalida-ssh-keys"
  description            = "SSH keys for EC2 access"
  recovery_window_in_days = 30  # Maior período para SSH keys

  tags = {
    Name        = "SSH Keys"
    Environment = "production"
    ManagedBy   = "Terraform"
    Sensitive   = "true"
  }
}

# Valor do secret SSH (será populado manualmente por segurança)
resource "aws_secretsmanager_secret_version" "ssh_keys" {
  secret_id     = aws_secretsmanager_secret.ssh_keys.id
  secret_string = jsonencode({
    public_key  = "to-be-configured"
    private_key = "to-be-configured"
    key_name    = var.key_name
  })

  lifecycle {
    ignore_changes = [secret_string]  # Não sobrescrever após configuração manual
  }
}

# Output dos ARNs dos secrets para referência
output "secrets_arns" {
  value = {
    cloudflare    = aws_secretsmanager_secret.cloudflare_api_token.arn
    alert_email   = aws_secretsmanager_secret.alert_email.arn
    database      = aws_secretsmanager_secret.database_credentials.arn
    app_api_keys  = aws_secretsmanager_secret.app_api_keys.arn
    ssh_keys      = aws_secretsmanager_secret.ssh_keys.arn
  }
  description = "ARNs of all secrets in Secrets Manager"
  sensitive   = true
}