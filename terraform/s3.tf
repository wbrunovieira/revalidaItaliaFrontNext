# s3.tf - S3 bucket configuration for public assets

# Create S3 bucket for public files
resource "aws_s3_bucket" "public_assets" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "Revalida Italia Public Assets"
    Environment = "Production"
    Purpose     = "Public files and documents"
  }
}

# Disable block public access for the bucket
resource "aws_s3_bucket_public_access_block" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Enable versioning for backup safety
resource "aws_s3_bucket_versioning" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure CORS for frontend access
resource "aws_s3_bucket_cors_configuration" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = [
      "http://localhost:3000",
      "http://localhost:3001",
      var.next_public_url,
      "http://${aws_eip.frontend.public_ip}:3000",
      "https://${aws_eip.frontend.public_ip}:3000"
    ]
    expose_headers  = ["ETag", "Content-Type", "Content-Length"]
    max_age_seconds = 3000
  }
}

# Bucket policy for public read access
resource "aws_s3_bucket_policy" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id
  
  depends_on = [aws_s3_bucket_public_access_block.public_assets]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.public_assets.arn}/*"
      },
      {
        Sid    = "AllowEC2InstanceUpload"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.frontend_combined.arn
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.public_assets.arn}/*"
      },
      {
        Sid    = "AllowEC2InstanceList"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.frontend_combined.arn
        }
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.public_assets.arn
      }
    ]
  })
}

# Note: IAM roles and policies for S3 access are defined in iam.tf

# Create folders structure in S3
resource "aws_s3_object" "public_folder" {
  bucket = aws_s3_bucket.public_assets.id
  key    = "public/"
  source = "/dev/null"
}

resource "aws_s3_object" "images_folder" {
  bucket = aws_s3_bucket.public_assets.id
  key    = "public/images/"
  source = "/dev/null"
}

resource "aws_s3_object" "documents_folder" {
  bucket = aws_s3_bucket.public_assets.id
  key    = "public/documents/"
  source = "/dev/null"
}

resource "aws_s3_object" "videos_folder" {
  bucket = aws_s3_bucket.public_assets.id
  key    = "public/videos/"
  source = "/dev/null"
}

resource "aws_s3_object" "audios_folder" {
  bucket = aws_s3_bucket.public_assets.id
  key    = "audios/"
  source = "/dev/null"
}

# Output the bucket URL
output "s3_bucket_url" {
  value       = "https://${aws_s3_bucket.public_assets.bucket_regional_domain_name}"
  description = "The URL of the S3 bucket for public assets"
}

output "s3_bucket_name_output" {
  value       = aws_s3_bucket.public_assets.id
  description = "The name of the S3 bucket"
}