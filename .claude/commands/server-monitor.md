# Server Monitor Command

Gera um relatório completo de monitoramento do servidor de produção, incluindo CloudWatch, CloudWatch RUM e Fail2ban.

## Configurações Necessárias

### AWS CLI
- **Profile**: `bruno-admin-revalida-aws`
- **Region**: `us-east-2`

### CloudWatch RUM
- **App Monitor Name**: `portalrevalida-frontend`
- **App Monitor ID**: `f46a2188-0ce6-434a-9b97-a8f352bc2d55`
- **Log Group**: `/aws/vendedlogs/RUMService_portalrevalida-frontendf46a2188`

### Servidor SSH
- **Host**: `18.118.97.189`
- **User**: `ubuntu`
- **Key**: `~/.ssh/revalida-frontend.pem`

---

## Instruções de Execução

### 1. Verificar Saúde do Servidor via SSH

Conecte ao servidor e colete métricas básicas:

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
echo '=== UPTIME ===' && uptime && echo '' &&
echo '=== MEMORIA ===' && free -h && echo '' &&
echo '=== DISCO ===' && df -h / && echo '' &&
echo '=== PM2 STATUS ===' && pm2 status && echo '' &&
echo '=== NGINX STATUS ===' && sudo systemctl status nginx --no-pager -l | head -10
"
```

**O que verificar:**
- Load average < 1.0 (para 1 CPU)
- Memória disponível > 500MB
- Disco < 85% usado
- PM2 status = "online"
- Nginx = "active (running)"

---

### 2. Verificar Fail2ban (Segurança)

O Fail2ban protege contra ataques de força bruta bloqueando IPs suspeitos.

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
echo '=== FAIL2BAN STATUS ===' &&
sudo fail2ban-client status && echo '' &&
echo '=== JAIL SSHD ===' &&
sudo fail2ban-client status sshd && echo '' &&
echo '=== IPs BANIDOS (últimas 24h) ===' &&
sudo grep 'Ban' /var/log/fail2ban.log 2>/dev/null | tail -20 || echo 'Nenhum ban recente'
"
```

**O que verificar:**
- Fail2ban status = "Server is running"
- Quantidade de IPs banidos (Currently banned)
- Total de bans históricos
- IPs específicos banidos (para análise de padrões)

**Comandos úteis adicionais:**
```bash
# Desbanir um IP específico
sudo fail2ban-client set sshd unbanip <IP>

# Ver configuração atual
sudo fail2ban-client get sshd maxretry
sudo fail2ban-client get sshd bantime
```

---

### 3. CloudWatch RUM - Monitoramento Frontend

O CloudWatch RUM coleta métricas reais dos usuários: page views, erros JS, performance, requisições HTTP.

#### 3.1 Verificar Status do App Monitor

```bash
aws rum get-app-monitor \
  --name "portalrevalida-frontend" \
  --region us-east-2 \
  --profile bruno-admin-revalida-aws
```

**O que verificar:**
- State = "CREATED" ou "ACTIVE"
- Domain = "portalrevalida.com"
- Telemetries inclui: performance, errors, http

#### 3.2 Verificar Log Streams (atividade recente)

```bash
aws logs describe-log-streams \
  --log-group-name "/aws/vendedlogs/RUMService_portalrevalida-frontendf46a2188" \
  --order-by LastEventTime \
  --descending \
  --limit 5 \
  --region us-east-2 \
  --profile bruno-admin-revalida-aws
```

**O que verificar:**
- Existem log streams recentes (última hora)
- `lastEventTimestamp` é recente

#### 3.3 Ver Eventos RUM (últimos eventos)

Pegue o nome do log stream mais recente do comando anterior e substitua:

```bash
aws logs get-log-events \
  --log-group-name "/aws/vendedlogs/RUMService_portalrevalida-frontendf46a2188" \
  --log-stream-name '<LOG_STREAM_NAME>' \
  --limit 10 \
  --region us-east-2 \
  --profile bruno-admin-revalida-aws
```

**Tipos de eventos capturados:**
- `com.amazon.rum.page_view_event` - Navegação entre páginas
- `com.amazon.rum.http_event` - Requisições HTTP (inclui status codes)
- `com.amazon.rum.performance_navigation_event` - Métricas de performance
- `com.amazon.rum.js_error_event` - Erros JavaScript

**O que analisar nos eventos:**
- Erros HTTP (status 4xx, 5xx)
- Erros JavaScript
- Páginas mais lentas (duration alto)
- Geolocalização dos usuários

#### 3.4 Buscar Erros Específicos

Para filtrar apenas erros HTTP 500:

```bash
aws logs filter-log-events \
  --log-group-name "/aws/vendedlogs/RUMService_portalrevalida-frontendf46a2188" \
  --filter-pattern '"status\":500' \
  --start-time $(date -v-1H +%s)000 \
  --region us-east-2 \
  --profile bruno-admin-revalida-aws
```

Para filtrar erros JavaScript:

```bash
aws logs filter-log-events \
  --log-group-name "/aws/vendedlogs/RUMService_portalrevalida-frontendf46a2188" \
  --filter-pattern 'js_error_event' \
  --start-time $(date -v-1H +%s)000 \
  --region us-east-2 \
  --profile bruno-admin-revalida-aws
```

---

### 4. Logs da Aplicação (PM2/Next.js)

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
echo '=== LOGS PM2 (últimas 50 linhas) ===' &&
pm2 logs frontend --lines 50 --nostream
"
```

Para filtrar apenas erros:

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
pm2 logs frontend --lines 100 --nostream 2>&1 | grep -i 'error\|failed\|exception' | tail -20
"
```

---

### 5. Logs do Nginx

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
echo '=== ERROS NGINX (últimas 20 linhas) ===' &&
sudo tail -20 /var/log/nginx/error.log && echo '' &&
echo '=== ACESSOS RECENTES (últimas 10 linhas) ===' &&
sudo tail -10 /var/log/nginx/access.log
"
```

Para ver requisições com erro (4xx, 5xx):

```bash
ssh -i ~/.ssh/revalida-frontend.pem ubuntu@18.118.97.189 "
sudo cat /var/log/nginx/access.log | awk '\$9 >= 400' | tail -20
"
```

---

## Formato do Relatório

Ao executar `/server-monitor`, gere um relatório no seguinte formato:

```
# Relatório de Monitoramento do Servidor
Data: [DATA_ATUAL]

## 1. Saúde do Servidor

| Métrica | Valor | Status |
|---------|-------|--------|
| Uptime | X days | OK/WARN |
| Load Average | X.XX | OK/WARN |
| Memória Livre | X GB | OK/WARN |
| Disco Usado | XX% | OK/WARN |
| PM2 | online | OK/WARN |
| Nginx | active | OK/WARN |

## 2. Segurança (Fail2ban)

| Jail | Status | IPs Banidos | Bans Total |
|------|--------|-------------|------------|
| sshd | ativo  | X           | Y          |

IPs banidos recentemente:
- [IP] - [DATA/HORA]

## 3. CloudWatch RUM

| Métrica | Última Hora |
|---------|-------------|
| Page Views | X |
| Erros HTTP | X |
| Erros JS | X |

Páginas mais acessadas:
1. /pt/courses - X views
2. /pt/login - X views

Erros detectados:
- [TIPO] - [URL] - [STATUS]

## 4. Recomendações

- [Lista de ações recomendadas baseadas nos dados]
```

---

## Troubleshooting

### AWS CLI não funciona
Verifique se o profile está configurado:
```bash
aws configure list --profile bruno-admin-revalida-aws
```

### SSH não conecta
Verifique a chave e permissões:
```bash
chmod 600 ~/.ssh/revalida-frontend.pem
ssh -i ~/.ssh/revalida-frontend.pem -v ubuntu@18.118.97.189
```

### RUM não mostra dados
1. Verifique se o site está acessível: `curl -I https://portalrevalida.com`
2. Acesse o site no browser para gerar eventos
3. Aguarde 1-2 minutos para dados aparecerem

### Fail2ban não está rodando
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## Links Úteis

- **AWS Console RUM**: https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#rum:dashboard/portalrevalida-frontend
- **CloudWatch Logs**: https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Fvendedlogs$252FRUMService_portalrevalida-frontendf46a2188
