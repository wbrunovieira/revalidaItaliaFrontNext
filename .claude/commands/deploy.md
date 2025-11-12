# Deploy Command

Execute o deploy da aplicação frontend no servidor de produção usando Ansible.

## Instruções

1. **Verifique se há mudanças não commitadas:**
   - Rode `git status`
   - Se houver mudanças, pergunte ao usuário se deve commitar primeiro

2. **Execute o quick deploy:**
   - Comando: `ansible-playbook -i ansible/inventory_frontend.yml ansible/quick-deploy.yml`
   - Timeout: 300000ms (5 minutos)
   - **IMPORTANTE: Mantenha o usuário informado durante TODO o processo**
   - Mostre cada task que está sendo executada em tempo real
   - Este comando irá:
     - Fazer git pull no servidor (branch main)
     - Instalar dependências (npm install)
     - Compilar aplicação (npm run build)
     - Sincronizar assets públicos para S3
     - Reiniciar aplicação com PM2

3. **Verificar resultado:**
   - O playbook mostrará o status do PM2 ao final
   - Confirme que a aplicação está "online"
   - URL da aplicação: http://portalrevalida.com

4. **Em caso de erro:**
   - Mostre a mensagem de erro completa
   - Sugira verificar logs no servidor se necessário

## Notas Importantes

- O inventário está em `ansible/inventory_frontend.yml`
- A chave SSH está em `~/.ssh/revalida-key`
- O servidor é: 3.18.51.87 (ubuntu@)
- Diretório da aplicação no servidor: `/home/ubuntu/frontend`
- A aplicação roda com PM2 na porta 3000

## Exemplo de Uso

Quando o usuário executar `/deploy`, você deve:

```
Vou fazer o deploy da aplicação para produção.

🔍 Verificando git status...
[Resultado do git status]

🚀 Iniciando deploy com Ansible...

[Enquanto o Ansible executa, informe cada TASK:]
📋 TASK [Gathering Facts] - Coletando informações do servidor...
✅ ok: [frontend]

📋 TASK [🔄 INICIANDO - Atualização do código frontend]
✅ ok: [frontend]

📋 TASK [📥 GIT PULL - Atualizando código do repositório]
⏳ Executando git pull...
✅ changed: [frontend]
   Antes: abc123
   Depois: def456

📋 TASK [📦 NPM - Instalando dependências]
⏳ Instalando dependências...
✅ changed: [frontend]

📋 TASK [🔨 BUILD - Compilando aplicação Next.js]
⏳ Compilando aplicação... (pode levar alguns minutos)
✅ changed: [frontend]

📋 TASK [☁️ S3 SYNC - Sincronizando assets públicos]
⏳ Enviando assets para S3...
✅ changed: [frontend]

📋 TASK [🔄 PM2 - Reiniciando aplicação]
⏳ Reiniciando PM2...
✅ changed: [frontend]

📋 TASK [⏳ AGUARDANDO - Esperando aplicação iniciar]
⏳ Aguardando 15 segundos...

📋 TASK [📊 PM2 - Verificando status da aplicação]
✅ changed: [frontend]

[Mostrar resultado do PM2 status]

✅ Deploy concluído com sucesso!
Aplicação rodando em: http://portalrevalida.com
```

**SEMPRE informe qual task está executando e se completou com sucesso (ok/changed) ou falhou.**
