# AI SalesMail frontend

React 19, TypeScript, Vite, and Ant Design. Includes responsive navigation, real campaign statistics, recipient imports, reusable templates, AI generation, automated replies, and follow-up configuration.

## Local development

Use Node.js 22. Run `npm ci`, copy `.env.example` to `.env.local`, and run `npm run dev`. Start the backend separately on port 5921.

The example `VITE_API_URL` and source fallback point to `https://ai-sales-backend.omnisuiteai.com`. Set that value on the deployed frontend too: an existing Vercel environment variable overrides the fallback. Do not append `/api`: the backend has separate route groups such as `/campaigns` and `/api/auth`. For local development, set it to `http://localhost:5921` and add `http://localhost:5173` to the local backend's `FRONTEND_URL`.

## Deploy on Vercel

Create a separate frontend Vercel project using this folder as its Root Directory. If importing the parent workspace, choose `ai-sales-mail-frontend`. The checked-in configuration selects Vite, runs `npm run build`, serves `dist`, and rewrites client routes to `index.html`.

Set `VITE_API_URL=https://ai-sales-backend.omnisuiteai.com` before building, and set the VPS backend's `FRONTEND_URL=https://ai-sales-mail-frontend.vercel.app` and `SERVER_URL=https://ai-sales-backend.omnisuiteai.com`. Vite embeds this setting during the build, so redeploy after changing it. Only put public values in `VITE_*` variables.

Create an account through the sign-in screen. On the Review step, choose **Send now** or **Schedule for later** and enter a date and time. The picker identifies your browser timezone and converts that time to UTC for storage. Use **Change send time** on a queued campaign to reschedule it before delivery starts. “Send now” immediately requests a delivery batch for that campaign. Automatic scheduled delivery runs through the VPS backend’s persistent PM2 worker, even with the browser closed. The worker checks due campaigns every minute; queue load and mail-provider latency can delay delivery. Follow the backend DEPLOYMENT.md guide to configure PM2, Nginx, HTTPS and the worker. After the VPS is healthy, update the frontend Vercel environment variable VITE_API_URL to the VPS origin and redeploy. AI is optional: email templates can be entered manually.

Recipient files must be .xlsx, .xls, or .csv, at most 2 MB, with up to 10,000 source rows and 5,000 unique recipients. Both `Email` and the supplied lead format's `Client email` headers are supported. The app finds the worksheet with the email column, skips missing email cells and duplicates, and displays the skipped counts. Malformed nonempty addresses are rejected. Use `{{Client Name}}` to personalize the saved Event Transportation template from the sheet's `Client name` column.

On Review, enable **Send emails in chunks**, enter the emails per chunk, and choose a numeric gap in seconds, minutes, or hours. The gap starts after the previous chunk finishes, survives server restarts, and cannot be bypassed using Send now. The worker checks every minute, so sending can start after the chosen minimum gap. The campaign list shows the next chunk time. The template's signature checkbox is preserved when loading or saving templates, and Review displays the actual signature image used in delivery.

## Verification

- `npm run build`: TypeScript checks and production bundle.
- `npm run lint`: ESLint.
- `npm test`: Playwright browser checks using mocked API responses. Tests exercise 320, 375, 768, 1024, 1440, and 1920 pixel layouts, navigation, search, zero-safe open rates, file import, failed saves, retry idempotency, expired sessions, future-time validation, timezone conversion, and editing queued campaign send times.
- On a machine without the browser installed, first run `npx playwright install chromium`.

Screenshots are written to `test-results`. Browser tests use mocked mail/AI responses and never send emails. Real SMTP, IMAP, AI credentials, MongoDB connectivity, and production Vercel routing must be checked with your deployed environment.

Spreadsheet parsing uses SheetJS CE 0.20.3 from its official CDN because the public npm registry version is outdated. See the [official installation instructions](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). The lockfile pins the archive and integrity hash.
