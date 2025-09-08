# CloudWatch Dashboard simplificado
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "revalida-italia-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x    = 0
        y    = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/EC2", "CPUUtilization" ],
            [ "AWS/EC2", "NetworkIn" ],
            [ "AWS/EC2", "NetworkOut" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 Metrics"
          period  = 300
        }
      },
      {
        type = "log"
        x    = 12
        y    = 0
        width = 12
        height = 6
        properties = {
          query  = "SOURCE '/aws/ec2/frontend' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Frontend Logs"
        }
      }
    ]
  })
}