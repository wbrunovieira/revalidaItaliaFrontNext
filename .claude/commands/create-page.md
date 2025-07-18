---
description: Cria página Next.js com i18n e padrões do projeto
allowed-tools: FileEditor, Bash(mkdir:*)
argument-hint: [caminho/da/pagina] [server|client]
---

# Criar Página Next.js

Crie uma página em `src/app/[locale]/**$ARGUMENTS**.tsx`
seguindo os padrões:

## Analise os exemplos:

- Server Page: @src/app/[locale]/courses/[slug]/page.tsx
- Client Page: @src/app/[locale]/admin/page.tsx
- Simple Page: @src/app/[locale]/login/page.tsx
- Not Found: @src/app/[locale]/courses/[slug]/not-found.tsx

## Padrões a seguir:

### Server Component (padrão):

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function [Nome]Page({
  params,
}: {
  params: Promise<{ locale: string; [param]?: string }>;
}) {
  const { locale, [param] } = await params;
  const t = await getTranslations({ locale, namespace: '[Namespace]' });

  // Verificar auth se necessário
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Fetch dados se necessário

  return (
    <div>
      {/* Conteúdo */}
    </div>
  );
}
Client Component:
typescript'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function [Nome]Page() {
  const t = useTranslations('[Namespace]');
  const [state, setState] = useState();

  return (
    <div>
      {/* Conteúdo */}
    </div>
  );
}
Estrutura de diretórios:

Páginas autenticadas geralmente usam <NavSidebar>
Páginas públicas têm layout próprio
Sempre criar not-found.tsx para rotas dinâmicas

i18n:

Server: getTranslations({ locale, namespace: 'Nome' })
Client: useTranslations('Nome')
Adicione traduções em /messages/[locale].json

Validações:

Auth: verificar token nos cookies
Params: validar e usar notFound() se inválido
Dados: tratar erros de fetch

Checklist:

 Definir se é Server ou Client Component
 Adicionar tipagem de params com Promise
 Implementar i18n corretamente
 Adicionar validações necessárias
 Criar not-found.tsx se rota dinâmica
 Atualizar traduções em messages/

Pergunte:

Qual o caminho completo da página?
Server ou Client Component?
Precisa autenticação?
Tem parâmetros dinâmicos?
Qual namespace de tradução?
```
