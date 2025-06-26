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

variable "NEXT_PUBLIC_API_URL" {

  type    = string
  default = "http://3.17.237.231:3333"
}

variable "storage_type" {
  description = "Tipo de storage p/ Next.js"
  default     = "local"
}


variable "s3_region" {
  description = "Região do bucket S3"
  type        = string
  default     = "us-east-2"
}

variable "s3_bucket_name" {
  description = "Nome do bucket S3"
  type        = string
  default     = "revalida-documents-891ff933"
}

variable "s3_base_url" {
  description = "URL base para acesso público aos objetos S3"
  type        = string
  default     = "https://revalida-documents-891ff933.s3.amazonaws.com"
}

variable "panda_api_key" {
  description = "Chave de API do PandaConvert ou serviço similar"
  type        = string
  default     = "" # preencha aqui, ou defina via -var na linha de comando
}

variable "max_file_size" {
  description = "Tamanho máximo de upload de arquivo (em bytes)"
  type        = number
  default     = 10485760 # por exemplo 10 MB
}

variable "allowed_file_types" {
  description = "Lista de extensões de arquivo permitidas para upload"
  type        = list(string)
  default     = ["pdf", "doc", "docx", "jpg", "png"]
}

variable "next_public_url" {
  description = "URL pública do frontend Next.js"
  type        = string
  default     = "http://ec2-3-18-51-87.us-east-2.compute.amazonaws.com:3000"
}
