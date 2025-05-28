resource "aws_iam_role" "ssm" {
  name = "ssm-for-frontend"

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
