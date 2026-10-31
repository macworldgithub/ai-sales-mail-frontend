# AI SalesMail frontend

React 19, TypeScript, Vite, and Ant Design. Includes responsive navigation, real campaign statistics, recipient imports, reusable templates, AI generation, automated replies, and follow-up configuration.

## Local development

Use Node.js 22. Run `npm ci`, copy `.env.example` to `.env.local`, and run `npm run dev`. Start the backend separately on port 5921.

The example `VITE_API_URL` points to `https://ai-sales-backend.omnisuiteai.com`. Set that value on the deployed frontend after the VPS is ready. The source fallback retains the previous Vercel API during the migration. Do not append `/api`: the backend has separate route groups such as `/campaigns` and `/api/auth`. For local development, set it to `http://localhost:5921` and add `http://localhost:5173` to the local backend's `FRONTEND_URL`.

## Deploy on Vercel

Create a separate frontend Vercel project using this folder as its Root Directory. If importing the parent workspace, choose `ai-sales-mail-frontend`. The checked-in configuration selects Vite, runs `npm run build`, serves `dist`, and rewrites client routes to `index.html`.

Set `VITE_API_URL=https://ai-sales-backend.omnisuiteai.com` before building, and set the VPS backend's `FRONTEND_URL=https://ai-sales-mail-frontend.vercel.app` and `SERVER_URL=https://ai-sales-backend.omnisuiteai.com`. Vite embeds this setting during the build, so redeploy after changing it. Only put public values in `VITE_*` variables.

Create an account through the sign-in screen. On the Review step, choose **Send now** or **Schedule for later** and enter a date and time. The picker identifies your browser timezone and converts that time to UTC for storage. Use **Change send time** on a queued campaign to reschedule it before delivery starts. “Send now” immediately requests a delivery batch for that campaign. Automatic scheduled delivery runs through the VPS backend’s persistent PM2 worker, even with the browser closed. The worker checks due campaigns every minute; queue load and mail-provider latency can delay delivery. Follow the backend DEPLOYMENT.md guide to configure PM2, Nginx, HTTPS and the worker. After the VPS is healthy, update the frontend Vercel environment variable VITE_API_URL to the VPS origin and redeploy. AI is optional: email templates can be entered manually.

Recipient files must be .xlsx, .xls, or .csv, at most 2 MB, with 1–1000 recipients and an Email column. Other headers become placeholders such as `{{First Name}}`. Email addresses are normalized; duplicate or malformed addresses are rejected before submission.

## Verification

- `npm run build`: TypeScript checks and production bundle.
- `npm run lint`: ESLint.
- `npm test`: Playwright browser checks using mocked API responses. Tests exercise 320, 375, 768, 1024, 1440, and 1920 pixel layouts, navigation, search, zero-safe open rates, file import, failed saves, retry idempotency, expired sessions, future-time validation, timezone conversion, and editing queued campaign send times.
- On a machine without the browser installed, first run `npx playwright install chromium`.

Screenshots are written to `test-results`. Browser tests use mocked mail/AI responses and never send emails. Real SMTP, IMAP, AI credentials, MongoDB connectivity, and production Vercel routing must be checked with your deployed environment.

Spreadsheet parsing uses SheetJS CE 0.20.3 from its official CDN because the public npm registry version is outdated. See the [official installation instructions](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). The lockfile pins the archive and integrity hash.
