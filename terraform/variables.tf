variable "frontend_instance_type" {
  default = "t3.micro"
}

variable "frontend_ami" {
  description = "Ubuntu 22.04 LTS HVM SSD"
  default     = "ami-04f167a56786e4b09"
}

variable "frontend_key_name" {
  default = "revalida-key"
}

variable "frontend_port" {
  default = 3000
}

variable "private_key_path" {
  description = "Absolute path to your private key"
  default     = "/Users/brunovieira/.ssh/revalida-key"
}
