# Chrome DevTools Debug

Conecta ao Chrome com debug remoto para capturar logs do console, tirar screenshots e debugar em tempo real.

## Pré-requisitos

1. **Chrome DevTools MCP instalado:**
   ```bash
   claude mcp add chrome-devtools --scope user -- npx chrome-devtools-mcp@latest
   ```

2. **Puppeteer-core instalado em /tmp:**
   ```bash
   cd /tmp && npm init -y && npm install puppeteer-core
   ```

## Instruções

### 1. Verificar se Chrome está rodando com debug

```bash
curl -s http://127.0.0.1:9222/json/version
```

Se não estiver, iniciar Chrome com debug remoto:

```bash
# Opção 1: Janela separada (não afeta abas existentes)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/chrome-debug-profile" &

# Opção 2: Usar perfil principal (precisa fechar Chrome primeiro)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &
```

Aguardar 3 segundos e verificar conexão:
```bash
sleep 3 && curl -s http://127.0.0.1:9222/json/version
```

### 2. Listar abas abertas

```bash
curl -s http://127.0.0.1:9222/json/list
```

### 3. Capturar logs e screenshot

Criar script em /tmp/chrome-logs.mjs:

```javascript
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = await browser.pages();
const page = pages[0];

console.log('=== PAGE INFO ===');
console.log('URL:', page.url());
console.log('Title:', await page.title());

console.log('\n=== CAPTURING CONSOLE LOGS ===');

const logs = [];
page.on('console', msg => {
  const type = msg.type().toUpperCase();
  const text = msg.text();
  logs.push({ type, text });
  console.log('[' + type + ']', text);
});

page.on('pageerror', err => {
  console.log('[PAGE ERROR]', err.message);
});

// Reload para capturar logs frescos
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });

// Aguardar logs assíncronos
await new Promise(r => setTimeout(r, 2000));

console.log('\n=== TOTAL LOGS:', logs.length, '===');

// Screenshot
await page.screenshot({ path: '/tmp/chrome-screenshot.png', fullPage: true });
console.log('Screenshot: /tmp/chrome-screenshot.png');

await browser.disconnect();
process.exit(0);
```

Executar:
```bash
cd /tmp && node chrome-logs.mjs
```

### 4. Ver screenshot

```bash
# Use Read tool para ver a imagem
Read /tmp/chrome-screenshot.png
```

### 5. Navegar para uma URL específica

```javascript
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = await browser.pages();
const page = pages[0];

// Navegar
await page.goto('http://localhost:3000/pt/admin', { waitUntil: 'networkidle2' });

// Capturar logs por 5 segundos
page.on('console', msg => console.log('[' + msg.type().toUpperCase() + ']', msg.text()));
await new Promise(r => setTimeout(r, 5000));

await browser.disconnect();
```

### 6. Monitorar Network Requests

```javascript
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = await browser.pages();
const page = pages[0];

// Interceptar requests
page.on('request', req => {
  if (req.url().includes('/api/')) {
    console.log('REQUEST:', req.method(), req.url());
  }
});

page.on('response', res => {
  if (res.url().includes('/api/')) {
    console.log('RESPONSE:', res.status(), res.url());
  }
});

await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 5000));

await browser.disconnect();
```

## Troubleshooting

### Chrome não conecta
- Verificar se porta 9222 está livre: `lsof -i :9222`
- Matar processo existente: `kill $(lsof -t -i :9222)`

### Puppeteer não encontrado
```bash
cd /tmp && npm install puppeteer-core
```

### Timeout na navegação
- Aumentar timeout: `{ timeout: 60000 }`
- Usar `waitUntil: 'domcontentloaded'` ao invés de `networkidle2`

## Arquivos

- Script de logs: `/tmp/chrome-logs.mjs`
- Screenshot: `/tmp/chrome-screenshot.png`
- Debug profile: `$HOME/chrome-debug-profile`
