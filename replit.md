# Bowling League Score Tracker

## Overview

A full-stack web application for tracking bowling league scores, teams, and standings with handicap support. The app enables league administrators to manage multiple bowling leagues, enter game scores, calculate handicaps, and view team/individual standings. Built as a data-intensive utility focused on clear score display and efficient data entry workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with HMR support

The frontend follows a page-based architecture with reusable components. Key pages include Dashboard, League Detail, Teams, Standings, and Score Entry. Components are organized by feature with shared UI components in `client/src/components/ui/`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Validation**: Zod schemas shared between client and server via `@shared` path alias

The server uses a storage abstraction layer (`server/storage.ts`) that defines interfaces for all data operations. This allows swapping storage implementations without changing route handlers.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - contains Zod schemas and TypeScript types
- **Migrations**: Drizzle Kit with output to `./migrations`

Core entities:
- **League**: Configuration for handicap rules, points system, team size, games per session
- **Team**: Belongs to a league, contains bowlers
- **Bowler**: Belongs to a team and league, has starting average
- **Game**: Tracks matchups between teams for each week
- **Score**: Individual bowler scores per game

### Key Design Decisions

**Shared Schema Pattern**: Zod schemas in `shared/schema.ts` are used for both client-side form validation and server-side request validation. This ensures type safety across the full stack.

**Storage Abstraction**: The `IStorage` interface in `server/storage.ts` abstracts data access, currently using in-memory storage with the structure ready for database integration.

**Handicap Calculation**: League settings support configurable handicap basis (180-250), percentage (0-100%), and max handicap cap. Handicaps are calculated as `(basis - average) × percentage`.

**Points System**: Configurable points for wins/ties/losses with optional bonus points for series wins.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session storage (available but not currently used)

### UI/Component Libraries
- **Radix UI**: Headless accessible component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component system using Radix + Tailwind
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component

### Form & Validation
- **Zod**: Schema validation for forms and API requests
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod integration for React Hook Form

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent class merging

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development