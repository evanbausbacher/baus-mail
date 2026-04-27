# BausMail

A simple, elegant web-based email client for managing multiple Resend-powered domains.

## Features

- 📧 **Multi-Domain Management** - Add and switch between multiple email domains
- 📬 **Email Viewing** - View received and sent emails with threading support
- ✉️ **Compose & Reply** - Send, reply to, and forward emails
- ⭐ **Email Actions** - Star, delete, mark as read/unread, flag as spam
- 🔍 **Search & Filter** - Find emails quickly
- 🎨 **Monochromatic Design** - Clean, professional interface with zero border-radius
- 🔄 **Webhook-First Sync** - Ingests received email through Resend webhooks with incremental sync fallback
- 💾 **Database Storage** - Postgres database for fast email caching

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: Postgres with Drizzle ORM
- **Styling**: Tailwind CSS
- **Email Service**: Resend API

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Postgres

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd baus-mail
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding a Domain

1. Click "Add Domain" in the sidebar
2. Enter your domain name (e.g., `yourdomain.com`)
3. Enter your Resend API key
4. Click "Add Domain"

### Managing Emails

- **Inbox**: View all received emails
- **Sent**: View all sent emails
- **Starred**: View starred emails
- **Search**: Use the search bar to find specific emails
- **Compose**: Click the "Compose" button to write a new email

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Project Structure

```
baus-mail/
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── email/       # Email-specific components
│   │   ├── compose/     # Email composition components
│   │   ├── layout/      # Layout components
│   │   └── providers/   # Context providers
│   ├── lib/             # Utility libraries
│   │   ├── db/          # Database configuration and queries
│   │   ├── resend/      # Resend API client
│   │   ├── threading/   # Email threading logic
│   │   └── utils/       # Helper utilities
│   ├── types/           # TypeScript type definitions
│   └── hooks/           # Custom React hooks
├── docs/                # Documentation
└── public/              # Static assets
```

## Design System

BausMail follows a distinctive monochromatic design aesthetic:

- **Zero border-radius** on all UI elements (sharp rectangular corners)
- **Color palette**: Black, white, and grays with a single accent color (blue)
- **Typography**: Inter font with clean, geometric styling
- **Layout**: Split-panel design with generous whitespace

## Contributing

Contributions are welcome! This is an open-source project designed to help others who need a simple email client for Resend.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [Resend](https://resend.com) API
- Inspired by technical dashboard aesthetics and clean email interfaces
