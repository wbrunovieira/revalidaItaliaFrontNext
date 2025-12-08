# Cloudflare WAF Configuration
# Bloqueia IPs maliciosos e ataques comuns

# Lista de IPs bloqueados
resource "cloudflare_list" "blocked_ips" {
  account_id  = var.cloudflare_account_id
  name        = "blocked_malicious_ips"
  kind        = "ip"
  description = "IPs bloqueados por tentativas de ataque"

  # Scanner bots
  item {
    value {
      ip = "95.214.52.170"
    }
    comment = "Scanner bot - 152 requests"
  }

  item {
    value {
      ip = "45.61.157.12"
    }
    comment = "Suspicious POST requests"
  }

  # Path traversal attackers
  item {
    value {
      ip = "128.14.227.179"
    }
    comment = "Path traversal attack"
  }

  item {
    value {
      ip = "64.227.97.118"
    }
    comment = "Path traversal attack"
  }

  # Command injection attempt
  item {
    value {
      ip = "47.99.150.111"
    }
    comment = "Command injection attempt server"
  }

  # Python bots
  item {
    value {
      ip = "45.84.107.47"
    }
    comment = "Python requests bot"
  }

  item {
    value {
      ip = "171.25.193.38"
    }
    comment = "Python requests bot"
  }

  # Assetnote scanners
  item {
    value {
      ip = "202.120.234.163"
    }
    comment = "Assetnote scanner"
  }

  item {
    value {
      ip = "27.74.251.56"
    }
    comment = "Assetnote scanner"
  }

  item {
    value {
      ip = "198.98.56.220"
    }
    comment = "Assetnote scanner"
  }
}

# Regra WAF para bloquear IPs da lista
resource "cloudflare_ruleset" "waf_custom_rules" {
  zone_id     = var.cloudflare_zone_id
  name        = "Custom WAF Rules"
  description = "Custom security rules for portalrevalida.com"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Regra 1: Bloquear IPs da lista
  rules {
    action      = "block"
    expression  = "ip.src in $blocked_malicious_ips"
    description = "Block known malicious IPs"
    enabled     = true
  }

  # Regra 2: Bloquear ataques de path traversal
  rules {
    action      = "block"
    expression  = "http.request.uri.path contains \"..\" or http.request.uri.path contains \"%2e%2e\""
    description = "Block path traversal attempts"
    enabled     = true
  }

  # Regra 3: Bloquear tentativas de acesso PHP/WordPress
  rules {
    action      = "block"
    expression  = "http.request.uri.path contains \".php\" or http.request.uri.path contains \"wp-admin\" or http.request.uri.path contains \"wp-login\" or http.request.uri.path contains \"xmlrpc\""
    description = "Block PHP/WordPress attacks"
    enabled     = true
  }

  # Regra 4: Bloquear command injection patterns
  rules {
    action      = "block"
    expression  = "http.request.uri.query contains \"curl\" or http.request.uri.query contains \"wget\" or http.request.uri.query contains \"exec\" or http.request.uri.query contains \"eval\""
    description = "Block command injection attempts"
    enabled     = true
  }

  # Regra 5: Bloquear User-Agents suspeitos
  rules {
    action      = "block"
    expression  = "http.user_agent contains \"nikto\" or http.user_agent contains \"sqlmap\" or http.user_agent contains \"nmap\" or http.user_agent contains \"masscan\" or http.user_agent contains \"zgrab\" or http.user_agent contains \"Assetnote\""
    description = "Block known vulnerability scanners"
    enabled     = true
  }

  # Regra 6: Rate limit em requests POST suspeitos
  rules {
    action      = "challenge"
    expression  = "http.request.method eq \"POST\" and http.request.uri.path eq \"/\" and not http.user_agent contains \"Mozilla\""
    description = "Challenge suspicious POST to root"
    enabled     = true
  }

  # Regra 7: Bloquear requests sem User-Agent
  rules {
    action      = "block"
    expression  = "http.user_agent eq \"\" and http.request.method eq \"POST\""
    description = "Block POST requests without User-Agent"
    enabled     = true
  }

  # Regra 8: Bloquear tentativas de shell injection
  rules {
    action      = "block"
    expression  = "http.request.uri contains \"/bin/sh\" or http.request.uri contains \"/bin/bash\" or http.request.uri contains \"cgi-bin\""
    description = "Block shell injection attempts"
    enabled     = true
  }
}

# Configuração de Security Level
resource "cloudflare_zone_settings_override" "security_settings" {
  zone_id = var.cloudflare_zone_id

  settings {
    # Nível de segurança alto
    security_level = "high"

    # Habilitar verificação de browser
    browser_check = "on"

    # Challenge em requests de países suspeitos
    challenge_ttl = 1800

    # SSL/TLS
    ssl = "full"
    always_use_https = "on"
    min_tls_version = "1.2"

    # Proteções adicionais
    hotlink_protection = "on"
    email_obfuscation = "on"
    server_side_exclude = "on"

    # WAF
    waf = "on"
  }
}

# Rate Limiting Rule
resource "cloudflare_rate_limit" "login_rate_limit" {
  zone_id = var.cloudflare_zone_id

  threshold = 10
  period    = 60

  match {
    request {
      url_pattern = "${var.domain}/*/login*"
      schemes     = ["HTTP", "HTTPS"]
      methods     = ["POST"]
    }
  }

  action {
    mode    = "challenge"
    timeout = 3600
  }

  disabled    = false
  description = "Rate limit login attempts"
}

resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id = var.cloudflare_zone_id

  threshold = 100
  period    = 60

  match {
    request {
      url_pattern = "${var.domain}/*"
      schemes     = ["HTTP", "HTTPS"]
      methods     = ["POST", "PUT", "DELETE"]
    }
  }

  action {
    mode    = "challenge"
    timeout = 1800
  }

  disabled    = false
  description = "Rate limit API mutations"
}

# Output
output "blocked_ips_list_id" {
  value       = cloudflare_list.blocked_ips.id
  description = "ID da lista de IPs bloqueados"
}
