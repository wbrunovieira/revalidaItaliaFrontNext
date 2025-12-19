# terraform/instance.tf
resource "aws_instance" "frontend" {

  ami           = var.frontend_ami
  instance_type = var.frontend_instance_type
  key_name      = data.aws_key_pair.revalida.key_name

  iam_instance_profile        = aws_iam_instance_profile.frontend_combined_profile.name
  vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
  associate_public_ip_address = true

  # Root volume configuration - 20GB for production with 500 students
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "frontend-root-volume"
    }
  }

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

  # 2) Configurar swap de 2GB para estabilidade
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
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
