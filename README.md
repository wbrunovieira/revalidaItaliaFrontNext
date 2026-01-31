# Revalida Italia Frontend

A modern, full-featured educational platform built with Next.js 15, enabling Italian medical professionals to validate their credentials in Brazil through interactive courses, 3D anatomical environments, and comprehensive assessment tools.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19.0.1-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-0.182-black?style=flat-square&logo=three.js)

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Internationalization](#internationalization)
- [3D Environments](#3d-environments)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)

## Overview

Revalida Italia is a comprehensive Learning Management System (LMS) designed specifically for medical education. The platform provides:

- **Structured Learning Paths**: Tracks → Courses → Modules → Lessons
- **Interactive 3D Environments**: Anatomical models for hands-on learning
- **Assessment System**: Quizzes, oral exams, and progress tracking
- **Flashcard System**: Spaced repetition for medical terminology
- **Live Sessions**: Real-time classes with Zoom integration
- **Multi-language Support**: Italian, Portuguese, and Spanish

## Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.2 | React framework with App Router |
| React | 19.0.1 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |

### 3D Graphics
| Technology | Version | Purpose |
|------------|---------|---------|
| Three.js | 0.182.0 | 3D rendering engine |
| React Three Fiber | 9.4.2 | React renderer for Three.js |
| React Three Drei | 10.7.7 | Useful helpers for R3F |
| Draco3D | 1.5.7 | 3D model compression |

### State & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 5.84.1 | Server state management |
| Zustand | 5.0.7 | Client state management |
| React Hook Form | 7.58.1 | Form handling |
| Zod | 3.25.67 | Schema validation |

### UI Components
| Technology | Version | Purpose |
|------------|---------|---------|
| Shadcn/UI | - | Component library (New York style) |
| Framer Motion | 12.23.12 | Animations |
| Lucide React | 0.511.0 | Icon library |
| Lottie React | 2.4.1 | Animated illustrations |

### Integrations
| Technology | Purpose |
|------------|---------|
| next-intl | Internationalization |
| Panda Video | Video streaming |
| AWS S3 | File storage |
| AWS CloudWatch RUM | Real User Monitoring |

## Project Structure

```
src/
├── app/
│   └── [locale]/              # Internationalized routes
│       ├── admin/             # Admin panel (role-protected)
│       ├── courses/           # Course hierarchy
│       ├── assessments/       # Standalone assessments
│       ├── flashcards/        # Flashcard study
│       ├── live-sessions/     # Live classes
│       ├── 3d-human-body/     # 3D anatomy environment
│       ├── 3d-skeleton/       # 3D skeleton environment
│       └── profile/           # User profile
│
├── components/
│   ├── ui/                    # Shadcn/UI base components
│   ├── 3d-environments/       # 3D viewer components
│   │   ├── human-body/        # Anatomy model
│   │   ├── skeleton/          # Skeleton model
│   │   └── common/            # Shared 3D utilities
│   └── [feature]/             # Feature-specific components
│
├── hooks/
│   ├── queries/               # TanStack Query hooks
│   └── [custom-hooks]         # Utility hooks
│
├── stores/                    # Zustand stores
├── services/                  # External service integrations
├── lib/                       # Utility functions
├── i18n/                      # i18n configuration
├── types/                     # TypeScript definitions
└── providers/                 # React context providers

public/
├── models/                    # 3D GLB models
│   ├── human-body/
│   └── skeleton/
├── audios/                    # Audio files
└── images/                    # Static assets

messages/
├── pt.json                    # Portuguese translations
├── it.json                    # Italian translations
└── es.json                    # Spanish translations
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend API running (see Environment Variables)

### Installation

```bash
# Clone the repository
git clone https://github.com/wbrunovieira/revalidaItaliaFrontNext.git
cd revalidaItaliaFrontNext

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3333

# Panda Video (Video Streaming)
NEXT_PUBLIC_PANDA_VIDEO_LIBRARY_ID=your_library_id
NEXT_PUBLIC_PANDA_VIDEO_PULLZONE=your_pullzone
PANDA_VIDEO_API_KEY=your_api_key
PANDA_VIDEO_API_BASE_URL=https://api-v2.pandavideo.com.br

# AWS S3 (File Storage)
S3_BUCKET=your_bucket_name
NEXT_PUBLIC_S3_URL=https://your-bucket.s3.region.amazonaws.com

# AWS CloudWatch RUM (Optional)
NEXT_PUBLIC_RUM_APPLICATION_ID=your_app_id
NEXT_PUBLIC_RUM_IDENTITY_POOL_ID=your_pool_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

### Routing

The application uses Next.js App Router with locale prefixing:

```
/[locale]/                     → Dashboard
/[locale]/courses              → Course listing
/[locale]/courses/[slug]       → Course details
/[locale]/courses/[slug]/modules/[moduleSlug]/lessons/[lessonId]
/[locale]/admin                → Admin panel (protected)
/[locale]/3d-human-body        → 3D Anatomy viewer
/[locale]/3d-skeleton          → 3D Skeleton viewer
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      page.tsx                           │
│                  (Server Component)                     │
│                    ~100 lines                           │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 *Content.tsx                            │
│                (Client Component)                       │
│                  ~200-300 lines                         │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   components/    hooks/        utils/
```

### Data Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Backend │◄────│ TanStack     │◄────│  Components │
│   API    │     │   Query      │     │             │
└──────────┘     └──────────────┘     └─────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │  Zustand │ (Auth, UI state)
                 └──────────┘
```

## Key Features

### Learning Management
- **Tracks**: Curated learning paths
- **Courses**: Structured content with modules
- **Lessons**: Video, audio, 3D environments, documents
- **Progress Tracking**: Completion status and analytics

### Assessment System
- **Quiz Mode**: Multiple choice questions
- **Oral Exams**: Audio recording with tutor review
- **Immediate Feedback**: Real-time scoring
- **Retry Logic**: Configurable attempt limits

### Flashcards
- **Spaced Repetition**: Optimized review scheduling
- **Bulk Import**: CSV/Excel upload
- **Progress Tracking**: Mastery levels
- **Study Modes**: Learn, Review, Test

### Live Sessions
- **Zoom Integration**: Seamless video conferencing
- **Recording**: Session playback
- **Personal Sessions**: 1:1 with tutors
- **Scheduling**: Calendar integration

### Admin Panel
- **User Management**: CRUD operations, role assignment
- **Content Management**: Courses, lessons, assessments
- **Analytics**: Usage statistics, progress reports
- **Document Validation**: Student credential review

## Internationalization

The platform supports three languages with full translation coverage:

| Locale | Language | Status |
|--------|----------|--------|
| `it` | Italian | ✅ Complete |
| `pt` | Portuguese | ✅ Complete |
| `es` | Spanish | ✅ Complete |

### Usage

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('Namespace');
  return <h1>{t('title')}</h1>;
}
```

### Adding Translations

1. Add keys to all three files in `messages/`
2. Follow existing namespace structure
3. Use ICU message format for pluralization

## 3D Environments

Interactive anatomical models for medical education:

### Human Body (`/3d-human-body`)
- Complete internal anatomy
- System-based visualization
- Interactive hotspots with audio

### Skeleton (`/3d-skeleton`)
- Full skeletal system
- Bone identification
- Regional groupings

### Learning Modes

| Mode | Description |
|------|-------------|
| **Consultation** | Explore freely, click for information |
| **Challenge** | Identify parts from prompts |
| **Scrivi** | Write anatomical terms |

### Technical Implementation

```typescript
// Dynamic loading with preload
import { usePreload3D } from '@/components/3d-environments/hooks';

const { onMouseEnter } = usePreload3D('human-body');

<Link href="/3d-human-body" onMouseEnter={onMouseEnter}>
  Start 3D Lesson
</Link>
```

## Authentication

### Token Management
- JWT-based authentication
- Stored in cookies (primary), localStorage (fallback)
- Auto-refresh before expiration

### User Roles

| Role | Access Level |
|------|--------------|
| `admin` | Full system access |
| `tutor` | Course management, student review |
| `student` | Course enrollment, learning |
| `document_analyst` | Document validation |

### Protected Routes

```typescript
// Middleware handles auth checks
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

## API Integration

### Base Configuration

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function fetchWithAuth(endpoint: string) {
  const token = getToken();
  return fetch(`${apiUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### Query Hooks

```typescript
// Example: useCourse hook
import { useQuery } from '@tanstack/react-query';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

## Styling

### Design Tokens

```css
/* Primary Palette */
--primary: #0C3559;
--primary-dark: #0F2940;
--secondary: #3887A6;
--accent: #79BED9;

/* Semantic Colors */
--color-success: #48BB78;
--color-warning: #ECC94B;
--color-error: #F56565;
```

### Typography

- **Sans**: Plus Jakarta Sans (headings, UI)
- **Serif**: Spectral (body text, articles)

### Component Styling

```typescript
// Using class-variance-authority
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary text-white'
    }
  }
});
```

## Development Guidelines

### File Size Limits

| File Type | Max Lines | Strategy |
|-----------|-----------|----------|
| `page.tsx` | ~100 | Minimal, delegate to Content |
| `*Content.tsx` | ~300 | Main component logic |
| Components | ~200 | Extract sub-components |

### Code Organization

```
feature/
├── page.tsx              # Server component (~100 lines)
├── FeatureContent.tsx    # Client component (~300 lines)
├── components/           # Sub-components
├── hooks/                # Feature-specific hooks
├── utils/                # Helper functions
└── data/                 # Constants, configs
```

### Commit Convention

```bash
feat: add user authentication
fix: resolve null pointer in payment
refactor: simplify database logic
docs: update API documentation
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Infrastructure

- **Hosting**: AWS EC2
- **CDN**: Cloudflare
- **Static Assets**: AWS S3
- **Monitoring**: CloudWatch RUM

### Ansible Deployment

```bash
# Quick deploy (git pull + build + restart)
ansible-playbook -i ansible/inventory_frontend.yml ansible/quick-deploy.yml

# Full deploy with asset sync
ansible-playbook -i ansible/inventory_frontend.yml ansible/playbook.frontend.yml
```

### Cache Headers

| Asset Type | Cache Duration |
|------------|----------------|
| 3D Models (.glb) | 1 year, immutable |
| Audio files | 1 month |
| Static assets | 7 days |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the development guidelines
4. Commit with conventional commits
5. Push and create a Pull Request

## License

Proprietary - All rights reserved.

---

**Revalida Italia** - Empowering Medical Professionals Through Technology
