# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The main application is in the `vocabquest/` directory. All commands should be run from there:

```bash
cd vocabquest
```

### Core Commands
- **Development server**: `pnpm dev` or `npm run dev`
- **Build**: `pnpm build` or `npm run build`  
- **Production build**: `pnpm run build:prod` or `npm run build:prod`
- **Linting**: `pnpm lint` or `npm run lint`
- **Preview**: `pnpm preview` or `npm run preview`

Note: All npm scripts automatically run `pnpm install` before execution.

## Architecture Overview

VocabQuest is a React + TypeScript + Vite vocabulary learning application with Supabase backend.

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **Styling**: TailwindCSS with Radix UI components
- **State Management**: 
  - Zustand for vocabulary/learning state (`src/stores/vocabularyStore.ts`)
  - React Context for authentication (`src/contexts/AuthContext.tsx`)
- **Backend**: Supabase (database, auth, edge functions)
- **Routing**: React Router DOM
- **Data Fetching**: TanStack Query for server state

### Key Architecture Patterns

**Authentication Flow**:
- Supabase auth with custom AuthContext providing user, profile, gamification data
- Protected routes wrap components requiring authentication
- Profile data fetched via Supabase Edge Functions (`user-profile`)

**Learning System**:
- Vocabulary store manages word lists, learning sessions, and progress tracking  
- Spaced repetition algorithm implemented via Supabase Edge Function (`spaced-repetition`)
- Multiple learning modes: flashcards, quiz, spelling, review
- Gamification with points, levels, streaks, badges, and challenges

**Data Models**:
- Core types defined in `src/types/index.ts`
- Primary entities: User, VocabularyList, VocabularyWord, UserProgress, UserGamification
- Learning sessions track study activity and performance metrics

### Directory Structure
```
vocabquest/src/
├── components/          # Shared UI components (minimal - uses Radix UI)
├── contexts/           # React contexts (AuthContext)
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and Supabase client
├── pages/             # Route components (Dashboard, Quiz, Flashcards, etc.)
├── stores/            # Zustand stores (vocabularyStore)
└── types/             # TypeScript type definitions
```

### Key Integration Points

**Supabase Edge Functions**:
- `user-profile`: GET/POST user profile data with gamification stats
- `spaced-repetition`: Updates learning progress with algorithm calculations

**Learning Flow**:
1. Select vocabulary list → loads words via `vocabularyStore.setCurrentList()`
2. Start learning session → `startLearningSession()` prepares word set based on mode
3. Progress tracking → `updateProgress()` calls spaced-repetition function
4. Session completion → updates user stats and gamification data

## Important Notes

- The app uses path aliases (`@/` maps to `src/`)
- All scripts include automatic dependency installation
- Uses ESLint for linting with TypeScript-aware rules
- Supabase client configured in `src/lib/supabase.ts`
- Toast notifications via react-hot-toast for user feedback