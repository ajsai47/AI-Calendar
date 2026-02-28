# AI Calendar

Aggregated event listing for AI/ML communities. Pulls events from Luma and Meetup, displays them in a filterable calendar view.

## Setup

```bash
git clone https://github.com/ajsai47/AI-Calendar.git
cd AI-Calendar
yarn install
```

Create `.env.local`:

```
DATABASE_URL=postgresql://user:pass@host:5432/ai_calendar
```

Push the schema and start dev:

```bash
yarn db:push
yarn dev
```

## API

- `GET /api/events` — upcoming events (query: `community`, `format`, `from`, `to`)
- `GET /api/communities` — all communities
- `GET /api/cron/ingest` — ingestion cron (runs every 6h on Vercel)
