# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.2 frontend application for Revalida Italia, an educational platform helping Italian medical professionals validate their credentials in Brazil. The app uses TypeScript, Tailwind CSS, and Shadcn/UI components with full internationalization support (Italian, Portuguese, Spanish).

## Essential Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint to check code quality
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Components**: Shadcn/UI (New York style) in `src/components/ui/`
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl with locale-prefixed routes

### Key Directories
- `src/app/[locale]/` - All routes are internationalized
- `src/components/` - React components (ui/ contains Shadcn components)
- `messages/` - Translation JSON files for each locale
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and helpers

### Routing Structure
All routes must be prefixed with locale (`/it/`, `/pt/`, `/es/`):
- `/[locale]/login` - Authentication
- `/[locale]/courses` - Course listing
- `/[locale]/tracks` - Learning tracks
- `/[locale]/profile` - User profile management
- `/[locale]/admin` - Admin panel

### API Integration
- Backend API URL from `NEXT_PUBLIC_API_URL` env variable
- Authentication tokens stored in cookies (name: `token`)
- All API calls go through functions in component files or custom hooks

### Styling Guidelines
- Use Tailwind CSS classes
- Custom colors defined in globals.css (primary: `#0C3559`, secondary: `#3887A6`)
- Follow existing component patterns in `src/components/ui/`
- Responsive design with mobile-first approach

### Form Handling Pattern
```typescript
// Use React Hook Form with Zod schemas
const schema = z.object({
  field: z.string().min(1)
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema)
});
```

### Internationalization
- Always use translation keys: `const t = useTranslations('PageName')`
- Translation files in `messages/[locale].json`
- Add new translations to all three locale files

### Component Creation
When creating new components:
1. Check existing UI components in `src/components/ui/`
2. Follow the established pattern (client/server components)
3. Use TypeScript interfaces for props
4. Include proper error handling for API calls

### Environment Variables
Required for development:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `PANDA_API_KEY` - Video platform integration (if working with video features)

### Testing Approach
Currently no test framework is configured. When implementing tests, check with the team for preferred testing strategy.

### State Management
- No global state management library
- Use React hooks and context where needed
- Authentication state managed via cookies

### Important Patterns
1. **Client Components**: Mark with `"use client"` when using hooks or browser APIs
2. **Server Components**: Default for better performance
3. **Error Handling**: Always handle API errors with try-catch
4. **Loading States**: Use loading UI components for async operations
5. **Type Safety**: Define TypeScript types for all API responses and props