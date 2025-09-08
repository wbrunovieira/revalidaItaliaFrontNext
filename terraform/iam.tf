resource "aws_iam_role" "ssm" {
  name = "ssm-for-frontend"

  assume_role_policy = data.aws_iam_policy_document.ssm_assume.json
}

# Combined role for SSM and S3 access
resource "aws_iam_role" "frontend_combined" {
  name = "frontend-ssm-s3-role"

  assume_role_policy = data.aws_iam_policy_document.ssm_assume.json
}

resource "aws_ssm_parameter" "next_public_api_url" {
  name  = "/revalida/NEXT_PUBLIC_API_URL"
  type  = "String"
  value = var.NEXT_PUBLIC_API_URL
}

data "aws_iam_policy_document" "ssm_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ssm_parameter" "next_public_api_url" {
  name            = aws_ssm_parameter.next_public_api_url.name
  with_decryption = false
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "ssm-for-frontend-profile"
  role = aws_iam_role.ssm.name
}

resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach SSM policy to combined role
resource "aws_iam_role_policy_attachment" "combined_ssm_attach" {
  role       = aws_iam_role.frontend_combined.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach CloudWatch Agent policy to combined role
resource "aws_iam_role_policy_attachment" "combined_cloudwatch_attach" {
  role       = aws_iam_role.frontend_combined.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach S3 policy to combined role
resource "aws_iam_role_policy" "combined_s3_policy" {
  name = "frontend-s3-access-policy"
  role = aws_iam_role.frontend_combined.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket_name}/*"
      }
    ]
  })
}

# Combined instance profile
resource "aws_iam_instance_profile" "frontend_combined_profile" {
  name = "frontend-combined-profile"
  role = aws_iam_role.frontend_combined.name
}
