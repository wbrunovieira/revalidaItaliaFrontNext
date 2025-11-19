# 📊 Documentação de Logs - Sync Products (Produção)

## 🎯 Objetivo

Este documento descreve todos os logs implementados no componente `SyncProducts.tsx` para análise em produção do endpoint de sincronização de produtos Hotmart.

## 📍 Localização

**Arquivo**: `src/components/SyncProducts.tsx`
**Função**: `handleSync()`
**Endpoint**: `POST /api/v1/admin/billing/sync-products`

---

## 🔷 LOG 1: Request Iniciado

**Quando aparece**: Imediatamente antes de fazer a requisição

```
🚀 [SYNC PRODUCTS] REQUEST INICIADO
  ⏰ Timestamp: 2025-01-19T14:30:00.000Z
  🔧 Configuração: {
    isDryRun: true,
    selectedProvider: 'hotmart',
    queryString: 'dryRun=true&provider=hotmart'
  }
  🌐 URL Completa: https://api.example.com/api/v1/admin/billing/sync-products?dryRun=true&provider=hotmart
  🔑 Token presente: true
  🔑 Token prefix: eyJhbGciOiJIUzI1NiI...
```

**O que analisar**:
- ✅ isDryRun correto (true para preview, false para sync real)
- ✅ selectedProvider correto (hotmart/stripe/paypal/all)
- ✅ URL bem formada
- ✅ Token presente

---

## 🔷 LOG 2: Response Recebido

**Quando aparece**: Imediatamente após receber a resposta

```
📡 [SYNC PRODUCTS] RESPONSE RECEBIDO
  ⏱️ Tempo de resposta: 1234ms
  📊 Status: 200 OK
  ✅ OK: true
  🔗 Response URL: https://api.example.com/api/v1/admin/billing/sync-products?dryRun=true&provider=hotmart
  📋 Headers: {
    contentType: 'application/json',
    contentLength: '2456',
    date: 'Sun, 19 Jan 2025 14:30:01 GMT'
  }
```

**O que analisar**:
- ✅ Status 200 = sucesso
- ⚠️ Status 4xx = erro do cliente (auth, parâmetros)
- ⚠️ Status 5xx = erro do servidor
- ⏱️ Tempo de resposta (normal: 500-3000ms)

---

## 🔷 LOG 3: Erro na Resposta (se response.ok = false)

**Quando aparece**: Apenas se status não for 2xx

```
❌ [SYNC PRODUCTS] ERRO NA RESPOSTA
  Status: 401
  Status Text: Unauthorized
  Error Body (JSON): {
    "message": "Invalid token",
    "code": "AUTH_ERROR"
  }
```

**Possíveis status de erro**:
- 401: Token inválido ou expirado
- 403: Sem permissão (não é admin)
- 404: Endpoint não encontrado
- 422: Parâmetros inválidos
- 500: Erro interno do servidor
- 502/503: API temporariamente indisponível

---

## 🔷 LOG 4: Estrutura Completa da Resposta

**Quando aparece**: Após parse do JSON da resposta

```
📦 [SYNC PRODUCTS] DADOS DA RESPOSTA - ESTRUTURA COMPLETA
  🔍 Response Object Completo: {
    "dryRun": true,
    "provider": "hotmart",
    "summary": { ... },
    "results": [ ... ],
    "errors": [ ... ],
    "syncedAt": "2025-01-19T14:30:01.000Z"
  }
  📐 Tipo da resposta: object
  🗂️ Keys presentes: ['dryRun', 'provider', 'summary', 'results', 'errors', 'syncedAt']
```

**O que analisar**:
- ✅ Todas as keys esperadas presentes
- ⚠️ Keys faltando ou extras
- ✅ Tipo correto (object)

---

## 🔷 LOG 5: Análise do Summary

**Quando aparece**: Sempre que há resposta de sucesso

```
📊 [SYNC PRODUCTS] ANÁLISE DO SUMMARY
  🎯 Summary completo: { created: 5, updated: 12, deactivated: 2, unchanged: 30, errors: 1 }

  ┌─────────────┬────────┐
  │   (index)   │ Values │
  ├─────────────┼────────┤
  │   Criados   │   5    │
  │ Atualizados │   12   │
  │ Desativados │   2    │
  │ Inalterados │   30   │
  │   Erros     │   1    │
  └─────────────┴────────┘

  📈 Total de produtos processados: 49
  ⚠️ Taxa de erro: 2.04%
```

**O que analisar**:
- ✅ Números fazem sentido (created + updated + deactivated + unchanged = total)
- ⚠️ Taxa de erro alta (>10%)
- ⚠️ Muitos deactivated (possível problema)
- ℹ️ Muitos unchanged é normal em syncs frequentes

---

## 🔷 LOG 6: Análise dos Resultados

**Quando aparece**: Se há produtos no array results

```
📝 [SYNC PRODUCTS] ANÁLISE DOS RESULTADOS
  📋 Total de resultados: 50
  🔍 Array de resultados presente: true
  🔍 É um array: true

  📊 Resultados agrupados por ação:
    ➤ CREATED (5)
      1. { productId: '123', internalCode: 'PROD001', name: 'Curso Revalida', changesCount: 0, changes: undefined }
      2. { productId: '124', internalCode: 'PROD002', name: 'Mentoria', changesCount: 0, changes: undefined }
      ...

    ➤ UPDATED (12)
      1. { productId: '125', internalCode: 'PROD003', name: 'Workshop', changesCount: 2, changes: ['name', 'price'] }
      ...

    ➤ UNCHANGED (30)
      ...

  🔬 PRIMEIROS 3 RESULTADOS (detalhado)
    Resultado 1: { productId: '123', internalCode: 'PROD001', name: 'Curso Revalida', action: 'created' }
    Resultado 2: { productId: '124', internalCode: 'PROD002', name: 'Mentoria', action: 'created' }
    Resultado 3: { productId: '125', internalCode: 'PROD003', name: 'Workshop', action: 'updated', changes: ['name', 'price'] }

  ⚠️ Total de 50 resultados. Mostrando apenas primeiros 3 detalhados acima.
```

**O que analisar**:
- ✅ Array é válido
- ✅ Agrupamento por action mostra distribuição
- ✅ Changes array mostra o que foi alterado em cada produto
- ⚠️ productId ou internalCode faltando
- ⚠️ action com valor inesperado

---

## 🔷 LOG 7: Análise de Erros

**Quando aparece**: Se há erros no array errors

```
⚠️ [SYNC PRODUCTS] ANÁLISE DE ERROS
  🔢 Total de erros: 2
  🔍 Array de erros presente: true
  🔍 É um array: true

  ┌───────┬────────────┬────────────────────────────────────┐
  │ Index │ ExternalID │ Error                              │
  ├───────┼────────────┼────────────────────────────────────┤
  │   1   │  HT-12345  │ Product not found in Hotmart       │
  │   2   │  HT-67890  │ Invalid price format               │
  └───────┴────────────┴────────────────────────────────────┘

  🔬 ERROS DETALHADOS
    Erro 1: { externalId: 'HT-12345', error: 'Product not found in Hotmart' }
    Erro 2: { externalId: 'HT-67890', error: 'Invalid price format' }
```

**O que analisar**:
- ⚠️ "Product not found" = produto deletado no Hotmart
- ⚠️ "Invalid price format" = dados inconsistentes
- ⚠️ "Connection timeout" = problema de rede com Hotmart
- ⚠️ "Unauthorized" = credenciais Hotmart inválidas

---

## 🔷 LOG 8: Campos Adicionais e Metadata

**Quando aparece**: Sempre

```
🔍 [SYNC PRODUCTS] CAMPOS ADICIONAIS E METADATA
  🏷️ Provider: hotmart
  🎭 DryRun mode: true
  ⏰ SyncedAt: 2025-01-19T14:30:01.000Z
  📅 SyncedAt (parsed): 19/01/2025, 11:30:01

  ⚠️ Campos extras encontrados (não mapeados na interface): ['processingTime', 'apiVersion']
    📌 processingTime: 1234
    📌 apiVersion: 2.0
```

**O que analisar**:
- ✅ Provider correto
- ✅ DryRun correto
- ✅ SyncedAt válido
- ℹ️ Campos extras = API retornou dados não esperados (não é erro, apenas info)

---

## 🔷 LOG 9: Validação de Dados

**Quando aparece**: Sempre

```
✔️ [SYNC PRODUCTS] VALIDAÇÃO DE DADOS
  ┌─────────────────────────────────────┬────────┐
  │             (index)                 │ Values │
  ├─────────────────────────────────────┼────────┤
  │ Summary existe                      │  true  │
  │ Summary tem todas as propriedades   │  true  │
  │ Results é array                     │  true  │
  │ Errors é array                      │  true  │
  │ Provider informado                  │  true  │
  │ DryRun informado                    │  true  │
  │ SyncedAt informado                  │  true  │
  │ Summary totais batem                │  true  │
  └─────────────────────────────────────┴────────┘

  ✅ Todas as validações passaram!
```

**Se houver falhas**:
```
❌ Validações falharam: ['Summary totais batem', 'Results é array']
```

**O que analisar**:
- ❌ "Summary totais batem" = soma não bate com length do results
- ❌ "Results é array" = results não é array ou está null
- ❌ "Summary existe" = summary não veio na resposta

---

## 🔷 LOG 10: Resumo Final

**Quando aparece**: Após validações

```
🎯 [SYNC PRODUCTS] RESUMO FINAL
  ✅ Sync concluído com sucesso
  ⏱️ Tempo total: 1234ms
  🎭 Modo: PREVIEW (Dry Run)
  🔧 Provider: hotmart
  📊 Estatísticas: {
    totalProcessados: 50,
    criados: 5,
    atualizados: 12,
    desativados: 2,
    inalterados: 30,
    erros: 1
  }
```

---

## 🔷 LOG 11: Erro Capturado (Catch Block)

**Quando aparece**: Se ocorrer exceção

```
🚨 [SYNC PRODUCTS] ERRO CAPTURADO NO CATCH
  ⏱️ Tempo até o erro: 523ms
  ⏰ Timestamp do erro: 2025-01-19T14:30:00.523Z

  📋 Tipo do erro: object
  🔍 É instância de Error: true
  🔍 Constructor name: TypeError

  ❌ Error.name: TypeError
  ❌ Error.message: Failed to fetch
  ❌ Error.stack: TypeError: Failed to fetch
      at handleSync (SyncProducts.tsx:102)
      at onClick (SyncProducts.tsx:214)
      ...

  🔍 CONTEXTO DO ERRO
    ⚙️ isDryRun: true
    ⚙️ selectedProvider: hotmart
    ⚙️ Token presente: true
    ⚙️ API URL: https://api.example.com

  💡 DIAGNÓSTICO AUTOMÁTICO
    ⚠️ Possível problema de rede ou CORS
```

**Diagnósticos possíveis**:
- ⚠️ Token não está presente
- ⚠️ NEXT_PUBLIC_API_URL não está definida
- ⚠️ Possível problema de rede ou CORS
- ⚠️ Erro retornado pela API (response não OK)
- ⚠️ Erro ao fazer parse do JSON

---

## 🔷 LOG 12: Finally Block

**Quando aparece**: Sempre, ao final

```
🏁 [SYNC PRODUCTS] Finalizando operação de sync
🔄 isSyncing setado para: false
```

---

## 📋 Checklist de Análise

Ao analisar logs em produção, verifique:

### ✅ Sucesso Normal
- [ ] LOG 1 mostra configuração correta
- [ ] LOG 2 mostra status 200 e tempo razoável (<3s)
- [ ] LOG 4 mostra estrutura completa
- [ ] LOG 5 mostra summary válido
- [ ] LOG 9 todas validações passaram
- [ ] LOG 10 mostra resumo correto

### ⚠️ Sucesso com Alertas
- [ ] LOG 5 mostra taxa de erro alta
- [ ] LOG 7 mostra erros específicos
- [ ] LOG 8 mostra campos extras

### ❌ Falha
- [ ] LOG 3 aparece (erro na resposta)
- [ ] LOG 11 aparece (exceção capturada)
- [ ] Verificar diagnóstico automático

---

## 🎯 Cenários Comuns e Como Identificar

### Cenário 1: Tudo OK
✅ Logs 1, 2, 4, 5, 6, 9, 10, 12
⚠️ LOG 7 mostra 0 erros
✅ Validações todas passaram

### Cenário 2: Alguns produtos com erro
✅ Logs 1, 2, 4, 5, 6, 7, 9, 10, 12
⚠️ LOG 7 mostra lista de erros
✅ Maioria das validações passaram

### Cenário 3: API retornou erro 500
❌ Logs 1, 2, 3, 11, 12
❌ LOG 3 mostra status 500
❌ LOG 11 mostra erro capturado

### Cenário 4: Problema de rede/CORS
❌ Logs 1, 11, 12
❌ LOG 11 mostra "Failed to fetch"
⚠️ Diagnóstico: "Possível problema de rede ou CORS"

### Cenário 5: Token inválido
❌ Logs 1, 2, 3, 11, 12
❌ LOG 3 mostra status 401
⚠️ Diagnóstico: "Erro retornado pela API"

---

## 🔧 Como Usar em Produção

1. **Abra o Console do Browser** (F12 → Console)
2. **Navegue até**: Admin → Transactions → Tab "Produtos" → Tab "Sincronizar"
3. **Configure**: Selecione provider (hotmart) e marque "Dry Run"
4. **Clique em**: "Visualizar Sincronização"
5. **Analise os logs** seguindo a ordem (1 → 12)
6. **Copie os logs relevantes** e cole no ticket/issue

### Dica Pro
Use os **grupos colapsáveis** do console:
- Clique nas setas para expandir/colapsar grupos
- Copie grupos inteiros clicando com botão direito → "Save as..."

---

## 📞 Reportando Issues

Ao reportar um problema, inclua:

1. **LOG 1** - Configuração do request
2. **LOG 2 ou LOG 3** - Response ou erro
3. **LOG 5** - Summary (se houver)
4. **LOG 7** - Erros (se houver)
5. **LOG 9** - Validações (destacar falhas)
6. **LOG 11** - Catch block (se houver)

---

**Última atualização**: 19/01/2025
**Versão**: 1.0
**Branch**: bug/hotmart-sync
