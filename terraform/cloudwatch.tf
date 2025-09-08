# CloudWatch Configuration for EC2 Monitoring
# Monitora Frontend e Backend EC2s com alertas automáticos

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "frontend_logs" {
  name              = "/aws/ec2/frontend"
  retention_in_days = 7

  tags = {
    Name        = "Frontend Logs"
    Environment = "production"
  }
}

resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/aws/ec2/backend"
  retention_in_days = 7

  tags = {
    Name        = "Backend Logs"
    Environment = "production"
  }
}

# IAM Role para CloudWatch Agent
resource "aws_iam_role" "cloudwatch_agent" {
  name = "cloudwatch-agent-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Policy para CloudWatch Agent
resource "aws_iam_role_policy_attachment" "cloudwatch_agent_server" {
  role       = aws_iam_role.cloudwatch_agent.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Policy adicional para métricas customizadas
resource "aws_iam_role_policy" "cloudwatch_custom_metrics" {
  name = "cloudwatch-custom-metrics"
  role = aws_iam_role.cloudwatch_agent.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Agent Configuration - armazenada no Parameter Store
resource "aws_ssm_parameter" "cloudwatch_config" {
  name  = "/cloudwatch/config/ec2"
  type  = "String"
  value = jsonencode({
    agent = {
      metrics_collection_interval = 60
      run_as_user                 = "root"
    }
    logs = {
      logs_collected = {
        files = {
          collect_list = [
            {
              file_path        = "/home/ec2-user/revalida-italia-front/pm2.log"
              log_group_name   = "/aws/ec2/frontend"
              log_stream_name  = "{instance_id}/pm2"
              timezone         = "UTC"
            },
            {
              file_path        = "/home/ec2-user/revalida-italia-front/.next/server/app/**/*.log"
              log_group_name   = "/aws/ec2/frontend"
              log_stream_name  = "{instance_id}/nextjs"
              timezone         = "UTC"
            },
            {
              file_path        = "/var/log/nginx/access.log"
              log_group_name   = "/aws/ec2/frontend"
              log_stream_name  = "{instance_id}/nginx-access"
              timezone         = "UTC"
            },
            {
              file_path        = "/var/log/nginx/error.log"
              log_group_name   = "/aws/ec2/frontend"
              log_stream_name  = "{instance_id}/nginx-error"
              timezone         = "UTC"
            }
          ]
        }
      }
    }
    metrics = {
      namespace = "RevalidaItalia"
      metrics_collected = {
        cpu = {
          measurement = [
            {
              name  = "cpu_usage_idle"
              rename = "CPU_IDLE"
              unit   = "Percent"
            },
            {
              name  = "cpu_usage_iowait"
              rename = "CPU_IOWAIT"
              unit   = "Percent"
            },
            "cpu_time_guest"
          ]
          metrics_collection_interval = 60
          resources = ["*"]
          totalcpu = false
        }
        disk = {
          measurement = [
            {
              name   = "used_percent"
              rename = "DISK_USED_PERCENT"
              unit   = "Percent"
            },
            {
              name   = "free"
              rename = "DISK_FREE"
              unit   = "Bytes"
            }
          ]
          metrics_collection_interval = 60
          resources = ["*"]
          ignore_file_system_types = ["sysfs", "devtmpfs", "tmpfs"]
        }
        mem = {
          measurement = [
            {
              name   = "mem_used_percent"
              rename = "MEM_USED_PERCENT"
              unit   = "Percent"
            },
            {
              name   = "mem_available"
              rename = "MEM_AVAILABLE"
              unit   = "Bytes"
            }
          ]
          metrics_collection_interval = 60
        }
        netstat = {
          metrics_collection_interval = 60
        }
        processes = {
          measurement = [
            {
              name   = "running"
              rename = "PROCESSES_RUNNING"
              unit   = "Count"
            },
            {
              name   = "sleeping"
              rename = "PROCESSES_SLEEPING"
              unit   = "Count"
            }
          ]
          metrics_collection_interval = 60
        }
      }
    }
  })
}

# Dashboard está em cloudwatch_dashboard.tf

# Alertas CloudWatch

# Alerta de CPU Alta - Frontend
resource "aws_cloudwatch_metric_alarm" "frontend_high_cpu" {
  alarm_name          = "frontend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Frontend EC2 cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.frontend.id
  }

  tags = {
    Name = "Frontend High CPU Alert"
  }
}

# Alerta de CPU Alta - Backend
resource "aws_cloudwatch_metric_alarm" "backend_high_cpu" {
  alarm_name          = "backend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Backend EC2 cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    InstanceId = "i-0184ffbf8646e8801"  # Backend instance ID
  }

  tags = {
    Name = "Backend High CPU Alert"
  }
}

# Alerta de Memória Alta - Frontend
resource "aws_cloudwatch_metric_alarm" "frontend_high_memory" {
  alarm_name          = "frontend-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MEM_USED_PERCENT"
  namespace           = "RevalidaItalia"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "Alert when Frontend memory usage is too high"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  tags = {
    Name = "Frontend High Memory Alert"
  }
}

# Alerta de Memória Alta - Backend
resource "aws_cloudwatch_metric_alarm" "backend_high_memory" {
  alarm_name          = "backend-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MEM_USED_PERCENT"
  namespace           = "RevalidaItalia"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "Alert when Backend memory usage is too high"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  tags = {
    Name = "Backend High Memory Alert"
  }
}

# Alerta de Disco Cheio - Frontend
resource "aws_cloudwatch_metric_alarm" "frontend_disk_space" {
  alarm_name          = "frontend-low-disk-space"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DISK_USED_PERCENT"
  namespace           = "RevalidaItalia"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Alert when Frontend disk space is running low"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  tags = {
    Name = "Frontend Low Disk Space Alert"
  }
}

# Alerta de Disco Cheio - Backend
resource "aws_cloudwatch_metric_alarm" "backend_disk_space" {
  alarm_name          = "backend-low-disk-space"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DISK_USED_PERCENT"
  namespace           = "RevalidaItalia"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Alert when Backend disk space is running low"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  tags = {
    Name = "Backend Low Disk Space Alert"
  }
}

# Alerta de Instance Status Check - Frontend
resource "aws_cloudwatch_metric_alarm" "frontend_status_check" {
  alarm_name          = "frontend-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Alert when Frontend instance status check fails"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.frontend.id
  }

  tags = {
    Name = "Frontend Status Check Alert"
  }
}

# Alerta de Instance Status Check - Backend
resource "aws_cloudwatch_metric_alarm" "backend_status_check" {
  alarm_name          = "backend-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Alert when Backend instance status check fails"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    InstanceId = "i-0184ffbf8646e8801"  # Backend instance ID
  }

  tags = {
    Name = "Backend Status Check Alert"
  }
}

# SNS Topic para alertas CloudWatch
resource "aws_sns_topic" "cloudwatch_alerts" {
  name = "cloudwatch-ec2-alerts"
  
  tags = {
    Name = "CloudWatch EC2 Alerts"
  }
}

# Subscrição de email para alertas CloudWatch
resource "aws_sns_topic_subscription" "cloudwatch_email" {
  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Outputs
output "cloudwatch_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
  description = "URL to CloudWatch Dashboard"
}

output "cloudwatch_logs_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups"
  description = "URL to CloudWatch Logs"
}