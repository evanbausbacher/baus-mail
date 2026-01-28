# BausMail - Implementation Plan

## Project Overview
BausMail is a web-based email client for managing multiple Resend-powered domains with a distinctive monochromatic design aesthetic. It provides a Gmail-like interface for viewing, sending, replying to, and organizing emails across multiple domains.

## Technology Stack (CONFIRMED)
- **Framework**: Next.js 14+ with App Router
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS (monochromatic design, zero border-radius)
- **Email Polling**: Auto-polling every 30 seconds + manual refresh
- **Deployment**: Local development → Vercel production

## Current State
- Empty project directory with Python venv (will be removed)
- Documentation files:
  - `docs/resend-llm.md` - Complete Resend API reference
  - `docs/design-style.md` - Monochromatic technical dashboard design system
  - `docs/domain-key-mapping.md` - Example domain/key storage format

## Key Requirements
- Multi-domain management (add/switch between domains with API keys)
- Email viewing (inbox, sent, with threading)
- Email actions: send, reply, forward, delete, star, mark read/unread, spam, bulk actions
- View all emails for any @domain address
- SQLite storage for domains and cached emails
- Professional, open-source-ready architecture
- **Monochromatic design style** (black/white/gray + single accent, **zero border-radius everywhere**)

## Resend API Capabilities
- `GET /emails/receiving` - List received emails (pagination: limit max 100)
- `GET /emails/receiving/:id` - Get specific received email with full content
- `GET /emails` - List sent emails (pagination supported)
- `GET /emails/:id` - Get specific sent email
- `POST /emails` - Send email (from, to, subject, html/text, cc, bcc, reply_to, attachments)
- `GET /emails/:email_id/attachments/:id` - Get email attachments
- Email threading via `message_id`, `in_reply_to`, and `references` headers

## Architecture Overview

### Directory Structure
```
baus-mail/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Main email client UI
│   │   ├── globals.css                   # Tailwind + global styles
│   │   └── api/
│   │       ├── domains/
│   │       │   ├── route.ts              # GET, POST domains
│   │       │   └── [id]/route.ts         # GET, PUT, DELETE domain
│   │       ├── emails/
│   │       │   ├── received/
│   │       │   │   ├── route.ts          # GET received (from cache)
│   │       │   │   ├── sync/route.ts     # POST sync from Resend
│   │       │   │   └── [id]/route.ts     # GET specific email
│   │       │   ├── sent/
│   │       │   │   ├── route.ts          # GET sent (from cache)
│   │       │   │   ├── sync/route.ts     # POST sync from Resend
│   │       │   │   └── [id]/route.ts     # GET specific email
│   │       │   ├── send/route.ts         # POST send email
│   │       │   └── actions/route.ts      # POST email actions
│   │       └── search/route.ts           # POST search
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   ├── DomainSwitcher.tsx        # Domain dropdown
│   │   │   ├── MainLayout.tsx            # Split-panel layout
│   │   │   └── TopBar.tsx                # Top bar with actions
│   │   ├── email/
│   │   │   ├── EmailList.tsx             # Email list view
│   │   │   ├── EmailListItem.tsx         # Individual email row
│   │   │   ├── EmailDetail.tsx           # Email detail viewer
│   │   │   ├── EmailThread.tsx           # Threaded conversation
│   │   │   ├── EmailActions.tsx          # Action buttons
│   │   │   └── AttachmentsList.tsx       # Attachment display
│   │   ├── compose/
│   │   │   ├── ComposeModal.tsx          # Compose modal
│   │   │   ├── ComposeForm.tsx           # Email form
│   │   │   ├── ReplyForm.tsx             # Reply form
│   │   │   └── ForwardForm.tsx           # Forward form
│   │   ├── ui/
│   │   │   ├── Button.tsx                # Sharp rectangular button
│   │   │   ├── Input.tsx                 # Zero border-radius input
│   │   │   ├── Card.tsx                  # Sharp white card
│   │   │   ├── Badge.tsx                 # Rectangular badge
│   │   │   ├── Checkbox.tsx              # Square checkbox
│   │   │   ├── Select.tsx                # Dropdown select
│   │   │   ├── Modal.tsx                 # Modal dialog
│   │   │   ├── SearchBar.tsx             # Search input
│   │   │   └── LoadingSpinner.tsx        # Loading indicator
│   │   └── providers/
│   │       ├── EmailProvider.tsx         # Email state context
│   │       ├── DomainProvider.tsx        # Domain state context
│   │       └── PollingProvider.tsx       # Auto-polling logic
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                  # Database connection
│   │   │   ├── schema.ts                 # Drizzle schema
│   │   │   ├── queries.ts                # Reusable queries
│   │   │   └── migrations/
│   │   │       └── 0001_initial.sql
│   │   ├── resend/
│   │   │   ├── client.ts                 # Resend API wrapper
│   │   │   ├── types.ts                  # Resend types
│   │   │   └── utils.ts                  # Helper functions
│   │   ├── threading/
│   │   │   ├── algorithm.ts              # Threading logic
│   │   │   └── types.ts                  # Thread types
│   │   ├── utils/
│   │   │   ├── email-helpers.ts          # Email parsing
│   │   │   ├── date-helpers.ts           # Date formatting
│   │   │   └── validation.ts             # Zod schemas
│   │   └── constants.ts                  # App constants
│   │
│   ├── types/
│   │   ├── domain.ts                     # Domain types
│   │   ├── email.ts                      # Email types
│   │   └── index.ts                      # Type exports
│   │
│   └── hooks/
│       ├── useEmails.ts                  # Email data hook
│       ├── useDomains.ts                 # Domain management hook
│       ├── usePolling.ts                 # Polling hook
│       └── useEmailActions.ts            # Email action mutations
│
├── public/
├── docs/                                 # Existing documentation
├── .env.local                            # Environment variables
├── .env.example                          # Example env vars
├── drizzle.config.ts                     # Drizzle configuration
├── tailwind.config.ts                    # Tailwind configuration
├── tsconfig.json                         # TypeScript config
├── next.config.mjs                       # Next.js config
├── package.json                          # Dependencies
└── README.md                             # Project documentation
```

### Database Schema (SQLite with Drizzle ORM)

**Domains Table:**
- `id` (text, primary key, UUID)
- `name` (text, unique) - e.g., "trainingdojo.app"
- `apiKey` (text) - Resend API key
- `createdAt` (timestamp)
- `isActive` (boolean)
- `lastSyncedAt` (timestamp)

**Emails Table:**
- `id` (text, primary key) - Resend email ID
- `domainId` (text, foreign key)
- `type` (enum: 'sent' | 'received')
- `messageId` (text) - Email message-id header
- `from`, `to`, `cc`, `bcc`, `replyTo` (text/JSON)
- `subject` (text)
- `html`, `text` (text)
- `headers` (JSON)
- `attachments` (JSON)
- `inReplyTo`, `references` (text) - Threading
- `threadId` (text) - Computed thread identifier
- `createdAt`, `syncedAt` (timestamp)
- `isRead`, `isStarred`, `isSpam`, `isDeleted` (boolean)
- `labels` (JSON)

**Indexes:** domainId, type, threadId, messageId, createdAt, isDeleted

**Sync State Table:**
- `id`, `domainId`, `type`, `lastCursor`, `lastSyncedAt`

### Core Technical Decisions

1. **Drizzle ORM** - Type-safe queries, lightweight, perfect for SQLite
2. **React Context** - State management (no external state library needed)
3. **Server Components** - Initial data fetching (RSC)
4. **Client Components** - Interactive elements (forms, selections)
5. **Tailwind CSS** - Zero border-radius enforced globally
6. **DOMPurify** - HTML sanitization for email content
7. **Zod** - Runtime validation for forms and API routes
8. **better-sqlite3** - Synchronous, fast SQLite driver

### Email Threading Algorithm

Groups emails into conversations using:
- `message_id` - Unique identifier for each email
- `in_reply_to` - The message-id this email replies to
- `references` - Chain of message-ids in the conversation

Algorithm builds a tree structure by:
1. Creating message-id lookup map
2. Finding root email (no in_reply_to)
3. Grouping replies under same threadId
4. Sorting by date within thread

### Polling Strategy

**Auto-Polling (30 seconds):**
- Only polls when window has focus
- Syncs received + sent emails from Resend API
- Updates SQLite cache
- Refreshes UI with new emails

**Manual Refresh:**
- User-triggered button in TopBar
- Immediately syncs all emails
- Shows loading indicator

### Design System Enforcement

**Zero Border-Radius Rule:**
```css
/* globals.css */
* {
  border-radius: 0 !important;
}
```

**Color Palette:**
- Background: `#E8E4E0` (light warm gray)
- Cards: `#FFFFFF` (pure white)
- Text: Black/gray scale
- Accent: `#2563eb` (blue) for buttons, active states
- Borders: Light gray

**Typography:**
- Font: Inter (clean geometric sans-serif)
- Sharp hierarchy with bold/regular mixing

## Implementation Phases

### Phase 1: Foundation & Setup
**Files to create:**
- `package.json` with Next.js, Drizzle, Tailwind dependencies
- `tailwind.config.ts` (zero border-radius, monochromatic colors)
- `drizzle.config.ts` (SQLite configuration)
- `src/lib/db/schema.ts` (database schema)
- `src/lib/db/index.ts` (database connection)
- `src/app/globals.css` (global styles, border-radius override)
- UI components: `Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`

**Verification:** Database initializes, UI components render with sharp corners

### Phase 2: Domain Management
**Files to create:**
- `src/app/api/domains/route.ts` (GET, POST)
- `src/app/api/domains/[id]/route.ts` (GET, PUT, DELETE)
- `src/lib/db/queries.ts` (domain queries)
- `src/lib/resend/client.ts` (Resend API wrapper)
- `src/components/providers/DomainProvider.tsx`
- `src/components/layout/DomainSwitcher.tsx`
- `src/components/layout/Sidebar.tsx`

**Verification:** Can add/edit/delete domains, switch between them

### Phase 3: Email Syncing
**Files to create:**
- `src/app/api/emails/received/sync/route.ts`
- `src/app/api/emails/sent/sync/route.ts`
- `src/lib/resend/client.ts` (extend with sync logic)
- `src/lib/db/queries.ts` (email storage queries)

**Verification:** Syncs emails from Resend, stores in SQLite, handles pagination

### Phase 4: Email List UI
**Files to create:**
- `src/app/api/emails/received/route.ts` (GET from SQLite)
- `src/app/api/emails/sent/route.ts`
- `src/components/providers/EmailProvider.tsx`
- `src/components/email/EmailList.tsx`
- `src/components/email/EmailListItem.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/app/page.tsx` (main UI)

**Verification:** Displays email list, selection works, filtering by type

### Phase 5: Email Detail & Threading
**Files to create:**
- `src/app/api/emails/received/[id]/route.ts`
- `src/components/email/EmailDetail.tsx`
- `src/components/email/EmailThread.tsx`
- `src/components/email/AttachmentsList.tsx`
- `src/lib/threading/algorithm.ts`
- `src/lib/utils/email-helpers.ts`

**Verification:** Email detail shows safely, threading groups conversations

### Phase 6: Email Composition
**Files to create:**
- `src/app/api/emails/send/route.ts`
- `src/components/compose/ComposeModal.tsx`
- `src/components/compose/ComposeForm.tsx`
- `src/components/compose/ReplyForm.tsx`
- `src/components/compose/ForwardForm.tsx`
- `src/lib/utils/validation.ts` (Zod schemas)

**Verification:** Can compose, send, reply, forward emails

### Phase 7: Email Actions
**Files to create:**
- `src/app/api/emails/actions/route.ts`
- `src/components/email/EmailActions.tsx`
- `src/hooks/useEmailActions.ts`

**Verification:** Delete, star, mark read/unread, spam work (single & bulk)

### Phase 8: Search & Auto-Polling
**Files to create:**
- `src/app/api/search/route.ts`
- `src/components/ui/SearchBar.tsx`
- `src/components/providers/PollingProvider.tsx`
- `src/hooks/usePolling.ts`

**Verification:** Search works, auto-polling refreshes every 30s

### Phase 9: Polish & Deployment
- Loading states, error boundaries, empty states
- Keyboard shortcuts
- Performance optimization
- Responsive design
- Deploy to Vercel (consider Turso for SQLite in production)

## Critical Files Priority

**Must create first (in order):**
1. `src/lib/db/schema.ts` - Database foundation
2. `src/lib/resend/client.ts` - Resend API integration
3. `src/app/api/emails/received/sync/route.ts` - Email syncing
4. `src/lib/threading/algorithm.ts` - Threading logic
5. `tailwind.config.ts` - Design system enforcement
6. `src/components/layout/MainLayout.tsx` - UI structure

## Dependencies (Key Packages)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.33.0",
    "drizzle-kit": "^0.24.0",
    "zod": "^3.23.0",
    "isomorphic-dompurify": "^2.15.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## Next Steps
Ready to begin implementation following the phases above.
