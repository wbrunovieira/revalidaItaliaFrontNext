# variables.tf
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile"
  default     = "bruno-admin-revalida-aws"
}

variable "key_name" {
  description = "Name for the EC2 key pair in AWS"
  default     = "revalida-key"
}

variable "public_key_path" {
  description = "Absolute path to your public key (no tilde)"
  default     = "/Users/brunovieira/.ssh/revalida-key.pub"
}

variable "frontend_instance_type" {
  default = "t3.small"
}

variable "frontend_ami" {
  description = "Ubuntu 22.04 LTS HVM SSD"
  default     = "ami-04f167a56786e4b09"
}



variable "frontend_port" {
  default = 3000
}

variable "private_key_path" {
  description = "Absolute path to your private key"
  default     = "/Users/brunovieira/.ssh/revalida-key"
}

variable "NEXT_PUBLIC_URL" {

  type    = string
  default = "3.17.237.231:3333"
}
