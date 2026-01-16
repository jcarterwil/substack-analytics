# Substack Archive Processor & Dashboard

A TypeScript CLI tool and Next.js dashboard to process and visualize Substack newsletter archives.

## Features

### CLI Processor (`substack-processor/`)
- **Content Export** - Convert HTML posts to clean markdown for AI chat tools
- **Subscriber Export** - Clean, segmented subscriber list exports (active, paid, free, churned)
- **Analytics** - Growth trends, engagement metrics, geographic distribution

### Dashboard (`substack-dashboard/`)
- **Overview** - Key metrics, monthly trends chart, top posts
- **Posts** - Searchable/sortable table of all posts with open rates
- **Subscribers** - Growth chart, plan breakdown, cumulative counts
- **Geography** - Country distribution visualization

## Quick Start

### Process Archive
```bash
cd substack-processor
npm install
npx tsx src/index.ts process ../archive --verbose
```

### Run Dashboard
```bash
cd substack-dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### Export Dashboard Data
```bash
cd substack-processor
npx tsx src/export-dashboard-data.ts
```

## CLI Commands

```bash
# Full processing
npx tsx src/index.ts process ./archive

# Individual commands
npx tsx src/index.ts content ./archive      # Content export only
npx tsx src/index.ts subscribers ./archive  # Subscriber export only
npx tsx src/index.ts analytics ./archive    # Analytics only

# Options
--output ./output    # Output directory
--verbose            # Detailed logging
```

## Output Structure

```
output/
├── content/
│   └── all-posts.md          # Consolidated markdown
├── subscribers/
│   ├── all-subscribers.csv
│   ├── active-subscribers.csv
│   ├── paid-subscribers.csv
│   └── summary.json
└── analytics/
    ├── analytics-report.md
    └── per-post-metrics.csv
```

## Tech Stack

- **Processor**: TypeScript, Commander.js, Papaparse, Turndown
- **Dashboard**: Next.js 16, React, Tailwind CSS, Recharts

## Deploy Dashboard

### Netlify
```bash
cd substack-dashboard
npm run build
npx netlify deploy --prod
```

### Render
- Build command: `npm run build`
- Start command: `npm start`
