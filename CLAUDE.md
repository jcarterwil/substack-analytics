# Substack Analyzer - Claude Context

## Project Overview
Client-side Substack archive analyzer and dashboard. Processes Substack export ZIP files entirely in the browser for privacy.

## Tech Stack
- **Dashboard**: Next.js 16, React, TypeScript, Tailwind CSS, Recharts
- **Parsing**: JSZip (client-side), PapaParse (CSV)
- **CLI Processor**: TypeScript, Commander.js (legacy batch processing)

## Project Structure
```
substack/
├── substack-dashboard/     # Next.js web dashboard (main app)
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components (Dashboard.tsx)
│   │   └── lib/            # Core logic (parser.ts, types.ts)
├── substack-processor/     # CLI batch processor (legacy)
├── archive/                # Sample Substack export
└── output/                 # CLI processor output
```

## Key Files
- `substack-dashboard/src/lib/types.ts` - TypeScript interfaces
- `substack-dashboard/src/lib/parser.ts` - ZIP parsing and analysis logic
- `substack-dashboard/src/components/Dashboard.tsx` - Main dashboard UI

## Data Model

### PostMetadata
- `post_id`, `title`, `subtitle`, `post_date`
- `is_published`, `type`, `audience`
- `htmlContent` (attached from HTML files)

### Subscriber
- `email`, `created_at`, `plan`
- `active_subscription`, `first_payment_at`
- `email_disabled`, `expiry`

### Attribution Analysis
- Correlates subscriber signups with post publication dates
- Three attribution windows: 1-day, 2-day, 7-day
- Shows which posts drove the most new subscribers

## Development
```bash
cd substack-dashboard
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
```

## Features
1. Upload Substack ZIP export
2. View subscriber stats (total, active, paid, free, churned)
3. Monthly trends (subscriber growth, posts per month)
4. Content type breakdown
5. **Post attribution analysis** - which articles drove subscriber growth
6. Export articles (Markdown) and subscribers (CSV)
