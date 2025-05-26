resource "aws_instance" "frontend" {
  ami                    = var.frontend_ami
  instance_type          = var.frontend_instance_type
  key_name               = var.frontend_key_name
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.frontend_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ssm_profile.name

  tags = {
    Name = "frontend"
  }
}
