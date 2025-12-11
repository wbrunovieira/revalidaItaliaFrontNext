# Plano: Ambiente 3D - Corpo Humano (Anatomia)

## Visão Geral

Implementar o primeiro ambiente 3D interativo para aulas de anatomia, substituindo o player de vídeo por uma experiência imersiva em Three.js.

---

## Fase 1: Setup da Infraestrutura

### 1.1 Criar estrutura de pastas

```
src/components/3d-environments/
├── registry.ts                      # Mapeamento slug → componente
├── Environment3DLoader.tsx          # Loader dinâmico com loading state
├── Environment3DContainer.tsx       # Container com controles (fullscreen, reset, etc)
├── common/
│   ├── LoadingSpinner3D.tsx         # Loading animado para ambientes 3D
│   ├── Controls3D.tsx               # Controles comuns (zoom, rotate, reset)
│   └── ErrorBoundary3D.tsx          # Error boundary específico para 3D
│
└── human-body/                    # Primeiro ambiente
    ├── index.tsx                    # Componente principal
    ├── Scene.tsx                    # Cena Three.js
    ├── models/                      # Arquivos .glb, .gltf
    │   └── .gitkeep
    ├── textures/                    # Texturas dos modelos
    │   └── .gitkeep
    └── hooks/
        └── useBodyModel.ts          # Hook para carregar/controlar modelo
```

### 1.2 Instalar dependências

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

**Pacotes:**
| Pacote | Propósito |
|--------|-----------|
| `three` | Biblioteca base Three.js |
| `@react-three/fiber` | React renderer para Three.js |
| `@react-three/drei` | Helpers e componentes prontos (OrbitControls, Loader, etc) |
| `@types/three` | Tipos TypeScript |

---

## Fase 2: Componentes Base

### 2.1 Registry (mapeamento de ambientes)

```tsx
// src/components/3d-environments/registry.ts

export const environment3DRegistry: Record<string, () => Promise<{ default: React.ComponentType<Environment3DProps> }>> = {
  'human-body': () => import('./human-body'),
  // Futuros ambientes:
  // 'anatomia-coracao': () => import('./anatomia-coracao'),
  // 'sistema-nervoso': () => import('./sistema-nervoso'),
};

export interface Environment3DProps {
  lessonId: string;
  locale: string;
  onComplete?: () => void;
}

export const isValidEnvironment = (slug: string): boolean => {
  return slug in environment3DRegistry;
};
```

### 2.2 Loader dinâmico

```tsx
// src/components/3d-environments/Environment3DLoader.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { environment3DRegistry, Environment3DProps } from './registry';
import LoadingSpinner3D from './common/LoadingSpinner3D';
import ErrorBoundary3D from './common/ErrorBoundary3D';

interface Props extends Environment3DProps {
  slug: string;
}

export function Environment3DLoader({ slug, ...props }: Props) {
  const loader = environment3DRegistry[slug];

  if (!loader) {
    return <Environment3DNotFound slug={slug} />;
  }

  const Environment3D = dynamic(loader, {
    ssr: false,
    loading: () => <LoadingSpinner3D />
  });

  return (
    <ErrorBoundary3D>
      <Suspense fallback={<LoadingSpinner3D />}>
        <Environment3D {...props} />
      </Suspense>
    </ErrorBoundary3D>
  );
}
```

### 2.3 Container com controles

```tsx
// src/components/3d-environments/Environment3DContainer.tsx

interface Props {
  children: React.ReactNode;
  title: string;
  onFullscreen?: () => void;
  onReset?: () => void;
}

export function Environment3DContainer({ children, title, onFullscreen, onReset }: Props) {
  return (
    <div className="relative w-full h-[70vh] bg-black rounded-lg overflow-hidden">
      {/* Header com título e controles */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold">{title}</h2>
          <div className="flex gap-2">
            <button onClick={onReset}>Reset</button>
            <button onClick={onFullscreen}>Fullscreen</button>
          </div>
        </div>
      </div>

      {/* Canvas 3D */}
      {children}

      {/* Instruções */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm">
        Arraste para rotacionar • Scroll para zoom • Clique para selecionar
      </div>
    </div>
  );
}
```

---

## Fase 3: Buscar Modelo 3D

### 3.1 Opções de fonte para modelos

| Fonte | Tipo | Licença |
|-------|------|---------|
| [Sketchfab](https://sketchfab.com) | Modelos prontos | Varia (CC, compra) |
| [TurboSquid](https://turbosquid.com) | Modelos profissionais | Comercial |
| [CGTrader](https://cgtrader.com) | Modelos médicos | Comercial |
| [BioDigital](https://biodigital.com) | Anatomia especializada | API/Licença |
| [Zygote Body](https://zygotebody.com) | Corpo humano completo | Comercial |

### 3.2 Requisitos do modelo

- **Formato**: `.glb` ou `.gltf` (preferência por `.glb` - binário, menor)
- **Polycount**: < 500k polígonos para performance web
- **Textures**: Incluídas no arquivo ou PBR separadas
- **Rigging**: Opcional, mas útil para animações
- **Partes separadas**: Ideal ter órgãos/sistemas como meshes separados para interatividade

### 3.3 Checklist do modelo

- [ ] Modelo baixado/adquirido
- [ ] Formato convertido para .glb (usar Blender se necessário)
- [ ] Otimizado para web (Draco compression)
- [ ] Testado no Three.js Editor (https://threejs.org/editor/)
- [ ] Colocado em `src/components/3d-environments/human-body/models/`

---

## Fase 4: Primeiro Ambiente - Corpo Humano

### 4.1 Estrutura do componente

```tsx
// src/components/3d-environments/human-body/index.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { Environment3DContainer } from '../Environment3DContainer';
import { Environment3DProps } from '../registry';

export default function HumanBodyEnvironment({ lessonId, locale }: Environment3DProps) {
  return (
    <Environment3DContainer title="Anatomy - Human Body">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#0a0a0a' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

        <BodyModel />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
        />
        <Environment preset="studio" />
      </Canvas>
    </Environment3DContainer>
  );
}

function BodyModel() {
  const { scene } = useGLTF('/models/human-body/body.glb');
  return <primitive object={scene} scale={1} />;
}

// Preload do modelo
useGLTF.preload('/models/human-body/body.glb');
```

### 4.2 Features interativas (futuro)

- [ ] Hover em órgãos mostra tooltip com nome
- [ ] Click em órgão abre painel lateral com informações
- [ ] Botões para isolar sistemas (cardiovascular, nervoso, etc)
- [ ] Slider de transparência para ver camadas internas
- [ ] Anotações/hotspots clicáveis
- [ ] Modo quiz (identificar órgãos)

---

## Fase 5: Adaptação da Página de Aula

### 5.1 Atualizar interface Lesson

```tsx
// Adicionar aos tipos existentes
interface Lesson {
  id: string;
  // ... campos existentes

  // NOVOS CAMPOS
  type: 'STANDARD' | 'ENVIRONMENT_3D';
  environment3dSlug?: string;  // só quando type = ENVIRONMENT_3D
}
```

### 5.2 Modificar LessonPageContent.tsx

```tsx
// Novo layout para aulas 3D
{lesson.type === 'ENVIRONMENT_3D' && lesson.environment3dSlug ? (
  // Layout ENVIRONMENT_3D - tela cheia horizontal
  <div className="flex flex-col">
    {/* Ambiente 3D - ocupa toda largura */}
    <div className="w-full">
      <Environment3DLoader
        slug={lesson.environment3dSlug}
        lessonId={lessonId}
        locale={locale}
      />
    </div>

    {/* Info resumida abaixo do 3D */}
    <div className="bg-primary-dark border-t border-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Info da aula */}
          <div className="flex items-center gap-4">
            <span className="bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
              Aula {idx + 1}
            </span>
            <h1 className="text-lg font-semibold text-white">{lt.title}</h1>
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-2">
            {prev && (
              <Link href={`...`} className="text-sm text-gray-400 hover:text-white">
                ← Anterior
              </Link>
            )}
            {next && (
              <Link href={`...`} className="text-sm text-gray-400 hover:text-white">
                Próxima →
              </Link>
            )}
          </div>

          {/* Botão concluir */}
          <LessonCompletionButton lessonId={lessonId} compact />
        </div>
      </div>
    </div>

    {/* Comentários */}
    <LessonComments ... />
  </div>
) : (
  // Layout STANDARD existente (com vídeo + sidebar)
  ...
)}
```

### 5.3 Novo layout visual

```
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumb (Curso > Módulo > Aula)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    AMBIENTE 3D (100% largura)                   │
│                    altura: 70vh                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Aula 2] Anatomy - Human Body       ← Anterior | Próxima →  ✓  │
├─────────────────────────────────────────────────────────────────┤
│                       Comentários                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 6: Checklist de Implementação

### Setup Inicial
- [ ] Criar branch `feature/3d-enviroment-1-body`
- [ ] Criar estrutura de pastas
- [ ] Instalar dependências (three, @react-three/fiber, @react-three/drei)
- [ ] Criar componentes base (registry, loader, container)

### Modelo 3D
- [ ] Pesquisar/adquirir modelo de corpo humano
- [ ] Otimizar modelo para web
- [ ] Testar carregamento no Three.js
- [ ] Adicionar ao projeto em `public/models/`

### Componente do Ambiente
- [ ] Criar `human-body/index.tsx`
- [ ] Implementar carregamento do modelo
- [ ] Adicionar controles (orbit, zoom)
- [ ] Adicionar iluminação adequada
- [ ] Testar em diferentes dispositivos

### Integração na Página
- [ ] Atualizar tipos da Lesson
- [ ] Modificar LessonPageContent para detectar `type: ENVIRONMENT_3D`
- [ ] Criar layout específico para aulas 3D
- [ ] Implementar info resumida abaixo do 3D
- [ ] Testar navegação entre aulas

### Traduções
- [ ] Adicionar traduções para controles 3D (pt, it, es)
- [ ] Adicionar instruções de uso

### Testes e Deploy
- [ ] Testar performance (FPS, carregamento)
- [ ] Testar responsividade
- [ ] Testar em dispositivos móveis (touch controls)
- [ ] Build de produção
- [ ] Deploy para staging

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar dependências Three.js |
| `src/components/3d-environments/*` | Criar novos |
| `src/components/LessonPageContent.tsx` | Adicionar condição para 3D |
| `src/hooks/queries/useLesson.ts` | Atualizar interface Lesson |
| `messages/*.json` | Adicionar traduções |
| `public/models/` | Adicionar modelos 3D |

---

## Estimativa de Arquivos Novos

```
src/components/3d-environments/
├── registry.ts
├── Environment3DLoader.tsx
├── Environment3DContainer.tsx
├── common/
│   ├── LoadingSpinner3D.tsx
│   ├── Controls3D.tsx
│   └── ErrorBoundary3D.tsx
└── human-body/
    ├── index.tsx
    ├── Scene.tsx
    └── hooks/useBodyModel.ts

Total: ~10 arquivos novos
```

---

## Próximos Passos

1. **Aprovar este plano**
2. **Instalar dependências**
3. **Criar estrutura de pastas**
4. **Buscar/adquirir modelo 3D**
5. **Implementar componente base**
6. **Integrar na página de aula**
7. **Testar e iterar**
