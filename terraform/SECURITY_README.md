# 🔒 Configuração de Segurança S3 - Revalida Italia

## 📋 O que foi implementado

### 1. **Amazon GuardDuty**
- ✅ Detecção automática de ameaças e malware
- ✅ Monitoramento 24/7 do bucket S3
- ✅ Alertas em tempo real via email

### 2. **Lambda File Validator**
- ✅ Validação de extensão de arquivo
- ✅ Verificação de tamanho máximo (10MB)
- ✅ Detecção de padrões suspeitos em nomes
- ✅ Validação de assinatura de arquivo (magic numbers)
- ✅ Quarentena automática de arquivos suspeitos

### 3. **Proteções S3**
- ✅ Versionamento habilitado
- ✅ Object Lock (proteção contra deleção por 7 dias)
- ✅ Criptografia AES-256 obrigatória
- ✅ Conexões HTTPS obrigatórias
- ✅ Logs de acesso

## 🚀 Como Aplicar

```bash
# 1. Configurar email para alertas
# Edite terraform/terraform.tfvars e adicione:
alert_email = "seu-email@dominio.com"

# 2. Aplicar as configurações
cd terraform
terraform init
terraform apply -auto-approve
```

## 📧 Configurar Alertas

Após aplicar o Terraform:
1. Você receberá um email da AWS para confirmar a inscrição nos alertas
2. Clique no link de confirmação no email
3. Pronto! Você receberá alertas de segurança

## 🔍 O que é monitorado

### Arquivos Permitidos
- ✅ PDF, DOC, DOCX
- ✅ JPG, JPEG, PNG
- ✅ Máximo 10MB por arquivo

### Ameaças Detectadas
- 🚫 Arquivos executáveis (.exe, .bat, .cmd, etc)
- 🚫 Scripts (.js, .vbs, .jar)
- 🚫 Arquivos com dupla extensão (documento.pdf.exe)
- 🚫 Arquivos muito grandes
- 🚫 Assinaturas de arquivo falsas

## 📊 Custos Estimados

| Serviço | Custo Mensal Estimado |
|---------|----------------------|
| GuardDuty | ~$5-15 |
| Lambda (1000 uploads) | ~$1 |
| S3 Logs | ~$2 |
| SNS Alertas | ~$0.50 |
| **Total** | **~$10-20/mês** |

## 🔧 Manutenção

### Verificar Status do GuardDuty
```bash
terraform output guardduty_status
```

### Ver logs da Lambda
```bash
aws logs tail /aws/lambda/s3-file-validator --follow
```

### Listar arquivos suspeitos
```bash
aws s3api list-objects-v2 \
  --bucket revalida-documents-891ff933 \
  --query "Contents[?contains(Key, 'suspicious')]"
```

## 🚨 Em caso de incidente

1. **Arquivo suspeito detectado:**
   - Email de alerta será enviado automaticamente
   - Arquivo é marcado com tag "Suspicious"
   - Arquivo será deletado automaticamente em 24h

2. **Para investigar:**
   ```bash
   # Ver detalhes do arquivo
   aws s3api get-object-tagging \
     --bucket revalida-documents-891ff933 \
     --key caminho/do/arquivo.pdf
   ```

3. **Para quarentenar manualmente:**
   ```bash
   # Mover para pasta de quarentena
   aws s3 mv s3://bucket/arquivo s3://bucket/quarantine/arquivo
   ```

## 📈 Métricas e Dashboard

Para criar um dashboard no CloudWatch:
1. Acesse AWS Console > CloudWatch > Dashboards
2. Crie um novo dashboard "S3-Security"
3. Adicione widgets para:
   - GuardDuty findings
   - Lambda invocations
   - S3 bucket metrics

## 🔄 Atualizações Futuras Recomendadas

1. **Curto Prazo (1-3 meses)**
   - [ ] Adicionar scan com ClamAV
   - [ ] Implementar rate limiting por usuário
   - [ ] Dashboard customizado

2. **Médio Prazo (3-6 meses)**
   - [ ] Machine Learning para detecção de anomalias
   - [ ] Integração com SIEM
   - [ ] Backup automático para outro bucket

3. **Longo Prazo (6+ meses)**
   - [ ] Solução enterprise (Trend Micro/Sophos)
   - [ ] Compliance automation (LGPD/GDPR)
   - [ ] DLP (Data Loss Prevention)

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Email de segurança configurado: `alert_email`
- AWS Support: Abrir ticket mencionando GuardDuty
- Logs: CloudWatch Logs > /aws/lambda/s3-file-validator

---

**Última atualização:** $(date)
**Responsável:** DevOps Team - Revalida Italia