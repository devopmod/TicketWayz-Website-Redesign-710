# TicketWayzV3

This project uses [Vite](https://vitejs.dev/) for development and the built-in Node.js test runner for unit tests.

## Setup

1. Install [Node.js](https://nodejs.org/) (LTS version recommended).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and set your Supabase credentials:
   ```bash
   cp .env.example .env.local
   # then edit .env.local
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="public-anon-key"
   ```

## Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   # or
   brew install supabase
   ```
2. Verify the installation:
   ```bash
   supabase --version
   ```
3. Check that the `events` table contains a `note` column:
   ```bash
   npm run check:note
   ```
4. If the column is missing, run a migration:
   ```bash
   supabase db push
   # or
   ALTER TABLE events ADD COLUMN note TEXT;
   ```

## Testing

Run the test suite:

```bash
npm test
```

This executes the Node.js test runner.

## Ticket PDF Export

Use `downloadTicketsPDF` to generate and download tickets as a single PDF. The function is provided by `src/utils/ticketExport`.

```js
import { downloadTicketsPDF } from './src/utils/ticketExport';
await downloadTicketsPDF(order, 'tickets', settings);
```

Arguments:
- `order` – object with event details, company information and `seats` array.
- `baseFileName` – optional filename without extension, defaults to `ticket`.
- `templateSettings` – optional ticket template configuration.

The function returns a `Promise` that resolves once the browser download of the generated PDF (one page per seat) has been triggered.
