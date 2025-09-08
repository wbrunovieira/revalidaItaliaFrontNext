# Cloudflare Provider Configuration
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# DNS para o frontend principal
resource "cloudflare_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = "@"  # portalrevalida.com
  value   = aws_eip.frontend.public_ip
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Frontend Revalida Italia"
}

# DNS para www
resource "cloudflare_record" "frontend_www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = aws_eip.frontend.public_ip
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Frontend Revalida Italia WWW"
}

# Output do domínio configurado
output "frontend_domain" {
  value = "https://portalrevalida.com"
  description = "Frontend domain with HTTPS"
}

output "frontend_www_domain" {
  value = "https://www.portalrevalida.com"
  description = "Frontend WWW domain with HTTPS"
}