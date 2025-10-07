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

### Modern Divider Component
Reusable divider component with multiple variants:

```typescript
import { ModernDivider, SimpleDivider } from '@/components/ui/modern-divider';

// Center glow variant (default)
<ModernDivider variant="center" />

// Start glow variant (left-aligned)
<ModernDivider variant="start" glowColor="secondary" />

// End glow variant (right-aligned)
<ModernDivider variant="end" glowColor="primary" />

// Fade variant (subtle gradient)
<ModernDivider variant="fade" thickness="medium" />

// Pulse variant (animated)
<ModernDivider variant="pulse" glowColor="accent" />

// Simple divider (no effects)
<SimpleDivider spacing="sm" />
```

Props:
- `variant`: 'center' | 'start' | 'end' | 'fade' | 'pulse'
- `glowColor`: 'primary' | 'secondary' | 'accent'
- `thickness`: 'thin' | 'medium' | 'thick'
- `spacing`: 'sm' | 'md' | 'lg'

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

### Translation Management & Dictionary Structure

#### File Structure
Translation files are located in `messages/[locale].json`:
- `messages/pt.json` - Portuguese (Brazil)
- `messages/it.json` - Italian
- `messages/es.json` - Spanish

#### Critical Translation Rules
1. **Always analyze structure BEFORE adding translations**
   - Use Task tool to map existing translation structure
   - Identify exact location within JSON hierarchy
   - Verify Admin object boundaries and nested structure

2. **ALWAYS add new translations at the BEGINNING of Admin object**
   ```json
   "Admin": {
     "title": "...",
     "description": "...",
     "comingSoon": "...",
     
     // ADD NEW COMPONENTS HERE - Always at the beginning!
     "newComponent": {
       "title": "...",
       "description": "..."
     },
     
     "existingComponent1": { ... },
     "existingComponent2": { ... }
   }
   ```

3. **Never search for Admin object end - always add at beginning**
   - Find Admin object start (usually around line 213)
   - Add new translation after `"comingSoon": "..."`
   - Always add comma after closing bracket
   - This avoids hunting through hundreds of lines

4. **For Tab Structure Updates**
   - Update assessments object outside Admin for new tabs
   - Format: `"assessments": { "create": "...", "list": "...", "newTab": "..." }`

5. **Translation Template for List Components**
   ```json
   "componentName": {
     "title": "Component Title",
     "description": "Component description",
     "loading": "Loading...",
     "noItems": "No items found",
     "showing": "Showing {count} of {total} items",
     "columns": {
       "field1": "Field 1",
       "field2": "Field 2",
       "actions": "Actions"
     },
     "actions": {
       "view": "View",
       "edit": "Edit", 
       "delete": "Delete"
     },
     "pagination": {
       "pageOf": "Page {current} of {total}",
       "perPage": "Per page:",
       "first": "First",
       "previous": "Previous",
       "next": "Next",
       "last": "Last"
     },
     "error": {
       "fetchTitle": "Error loading items",
       "fetchDescription": "Could not load items"
     }
   },
   ```

#### API Response Mapping
- Always check API response structure before creating interfaces
- Common gotchas:
  - `title` vs `text` fields
  - `description` vs `options` arrays
  - Nested objects vs flat arrays

#### Translation Workflow
1. Map existing structure with Task tool
2. Add translations at **beginning** of Admin object
3. Update all three locale files (pt, it, es)
4. Test translation keys work in components
5. Commit with descriptive message

### Development Best Practices & Common Pitfalls

#### Admin Panel Development
1. **Always check existing tab structure before adding new tabs**
   - Admin tabs are in `src/app/[locale]/admin/page.tsx`
   - Look for `grid-cols-X` to update column count
   - Add new TabsTrigger and TabsContent in correct order

2. **Component Creation Workflow**
   - Create component in `src/components/`
   - Import in admin page
   - Add translations (start with Admin object beginning)
   - Test with actual API data structure
   - Commit with descriptive message

3. **API Integration Patterns**
   - Always verify API response structure first
   - Use `useCallback` for API functions to prevent re-renders
   - Include proper error handling with toast notifications
   - Implement loading states for better UX

#### Common TypeScript Interface Patterns
```typescript
// For API responses with pagination
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// For list components with actions
interface ListItem {
  id: string;
  text: string; // or title - check API first!
  createdAt: string;
  updatedAt: string;
}
```

#### Debugging Translation Issues
1. **Check next-intl error messages carefully**
   - `INSUFFICIENT_PATH` = trying to use object as string
   - `MISSING_MESSAGE` = translation key doesn't exist
   - Always verify exact key path in JSON

2. **Common translation mistakes**
   - Using `Admin.tabs.assessments` when assessments is an object
   - Forgetting to add translations to all 3 locale files
   - Placing translations in wrong hierarchy level

#### Performance Considerations
1. **Use `useCallback` for expensive operations**
   - API calls, complex calculations
   - Functions passed to child components
   - Event handlers in loops

2. **Implement proper pagination**
   - Server-side pagination for large datasets
   - Include loading states during pagination
   - Reset page when filters change

### Important Patterns
1. **Client Components**: Mark with `"use client"` when using hooks or browser APIs
2. **Server Components**: Default for better performance
3. **Error Handling**: Always handle API errors with try-catch
4. **Loading States**: Use loading UI components for async operations
5. **Type Safety**: Define TypeScript types for all API responses and props

---

## Project Management & Issue Creation

### WB Project Manager Integration

This project uses **WB Project Manager** (running on `http://localhost:3000`) for task tracking and issue management.

#### API Configuration
- **Base URL**: `http://localhost:3000/api`
- **Authentication**: Bearer token in Authorization header
- **Token**: `7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6`

#### Project IDs
- **Workspace ID**: `cmge96f200001wa7ouziczg0w`
- **Project ID (Frontend/Backend)**: `cmgfjhyh50005waqglsynsz1d`
- **Milestone ID (Current Sprint)**: `cmggc1uqk0001wakb3no9xhb7`
- **Assignee ID (Bruno Vieira)**: `cmge96f1y0000wa7olxm69prv`

#### Status IDs
- **Todo**: `cmge9i3pv0007walqv7is970v`

#### Label IDs
- **Frontend**: `cmgf21xvb0003watfaqi1ynw7`
- **Backend**: `cmgf23zl50009watfyq73olpr`

### Creating Issues via API

#### Single Issue Creation

```bash
curl -X POST "http://localhost:3000/api/issues" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d '{
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "title": "Issue Title Here",
    "description": "Detailed description with implementation steps, files affected, and acceptance criteria",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "projectId": "cmgfjhyh50005waqglsynsz1d",
    "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
    "assigneeId": "cmge96f1y0000wa7olxm69prv",
    "priority": "HIGH",
    "type": "FEATURE",
    "labelIds": ["cmgf21xvb0003watfaqi1ynw7"]
  }'
```

#### Issue Types
- `FEATURE` - New functionality
- `BUG` - Bug fix
- `REFACTOR` - Code refactoring
- `TEST` - Test implementation
- `DOCUMENTATION` - Documentation updates
- `CHORE` - Maintenance tasks

#### Priority Levels
- `LOW` - Nice to have, no urgency
- `MEDIUM` - Important but not urgent
- `HIGH` - Critical, needs attention soon
- `URGENT` - Blocking, needs immediate attention

### Bulk Issue Creation Workflow

When creating multiple related issues for a feature:

1. **Create JSON file** with all issues:

```json
{
  "workspaceId": "cmge96f200001wa7ouziczg0w",
  "issues": [
    {
      "title": "Frontend: Create component X",
      "description": "Detailed description...",
      "statusId": "cmge9i3pv0007walqv7is970v",
      "projectId": "cmgfjhyh50005waqglsynsz1d",
      "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
      "assigneeId": "cmge96f1y0000wa7olxm69prv",
      "priority": "HIGH",
      "type": "FEATURE",
      "labelIds": ["cmgf21xvb0003watfaqi1ynw7"]
    }
  ]
}
```

2. **Create issues individually** (bulk endpoint may have validation issues):

```bash
# Loop through and create each issue
curl -s -X POST "http://localhost:3000/api/issues" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d '{"workspaceId":"...","title":"...","description":"...","statusId":"...","projectId":"...","milestoneId":"...","assigneeId":"...","priority":"HIGH","type":"FEATURE","labelIds":["cmgf21xvb0003watfaqi1ynw7"]}' \
  | jq -r '.identifier + " - " + .title'
```

### Issue Description Best Practices

When writing issue descriptions:

1. **Start with action verb**: "Criar", "Implementar", "Refatorar", "Adicionar"
2. **Specify file paths**: "Arquivo: src/components/X.tsx"
3. **List technical requirements**:
   - Props/interfaces needed
   - Dependencies to use
   - API endpoints to call
4. **Include acceptance criteria**:
   - What should work
   - Edge cases to handle
   - Expected behavior
5. **Reference related files**: Line numbers when refactoring

#### Example Issue Description Template

```
Criar componente JoinButton.tsx em src/components/LiveSession/ para entrada segura em sessões ao vivo.

Props:
- sessionId: string
- sessionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED'
- disabled?: boolean

Implementação:
1. Usar hook useLiveSessionJoin para geração de token
2. Mostrar loading state durante geração (Loader2 icon)
3. Auto-join após receber token
4. Mostrar ExpirationTimer quando token gerado
5. Disabled quando sessionStatus === 'ENDED'

Dependências:
- Hook: useLiveSessionJoin
- Componentes: Button, Badge, Loader2 (lucide-react)
- i18n: useTranslations('LiveSessions')

Acceptance Criteria:
- Botão clicável apenas quando sessão SCHEDULED ou LIVE
- Loading state visível durante requisição
- Timer aparece após gerar token
- Redireciona para Zoom após validação

Arquivo: src/components/LiveSession/JoinButton.tsx
```

### Checking Created Issues

After creating issues, verify in the WB Project Manager UI:
- Navigate to `http://localhost:3000`
- Check project: "Features Zoom link unico, pdf protegidos, login unico e flashcard em lotes"
- Filter by label: Frontend or Backend
- Verify all issues appear with correct details

---