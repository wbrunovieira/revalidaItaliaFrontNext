# terraform/instance.tf
resource "aws_instance" "frontend" {

  ami           = var.frontend_ami
  instance_type = var.frontend_instance_type
  key_name      = data.aws_key_pair.revalida.key_name

  iam_instance_profile        = aws_iam_instance_profile.frontend_combined_profile.name
  vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
  associate_public_ip_address = true

  user_data = <<-EOF
  #!/bin/bash
  set -e

      # 1) Força timezone UTC
  timedatectl set-timezone UTC
  # Atualiza pacotes e instala o SSM Agent
  apt-get update -y
  apt-get install -y awscli amazon-ssm-agent
  systemctl enable --now amazon-ssm-agent

apt-get clean
EOF



  tags = {
    Name = "frontend"
  }
}

resource "aws_eip" "frontend" {
  instance = aws_instance.frontend.id
  domain   = "vpc"

  tags = {
    Name = "frontend-eip"
  }
}
