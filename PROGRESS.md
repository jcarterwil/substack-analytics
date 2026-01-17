# Substack Analyzer - Progress

## Completed Features

### Jan 16, 2026 - Post Attribution Analysis
Added feature to analyze which articles drove the most new subscribers.

**Changes:**
- `src/lib/types.ts` - Added `PostAttribution` and `AttributionResult` interfaces
- `src/lib/parser.ts` - Added `calculatePostAttributions()` function
- `src/components/Dashboard.tsx` - Added "Top Performing Posts" UI section

**How it works:**
- Correlates subscriber `created_at` timestamps with post `post_date`
- Attributes each subscriber to the most recent post published before their signup (within the window)
- Supports 1-day, 2-day, and 7-day attribution windows (toggleable in UI)
- Subscribers who signed up with no post in the window are counted as "organic"

**UI includes:**
- Window selector tabs (1 Day / 2 Days / 7 Days)
- Summary stats: Attributed, Organic/Unknown, Coverage %
- Horizontal bar chart of top 10 performing posts
- Table with: Post title, Date, Total attributed, Paid, Free, Avg days to signup

---

### Jan 16, 2026 - Export Functionality
- Export Articles (MD) - Chronological markdown compilation
- Export Subscribers (CSV) - All subscriber data fields

### Jan 16, 2026 - Initial Dashboard
- Client-side ZIP processing with JSZip
- Subscriber stats (total, active, paid, free, churned)
- Monthly trends charts (growth, posts per month)
- Subscriber breakdown pie chart
- Content types breakdown
- Recent posts table

---

## Backlog / Future Ideas
- [ ] Add sorting to attribution table
- [ ] Show attribution trends over time
- [ ] Compare paid vs free subscriber acquisition by post
- [ ] Add open rate data to attribution (requires analytics files)
- [ ] Export attribution results as CSV
