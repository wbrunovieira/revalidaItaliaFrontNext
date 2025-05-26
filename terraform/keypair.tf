resource "aws_key_pair" "revalida" {
  key_name   = "revalida-key"
  public_key = file("${var.private_key_path}.pub")
}
