import { test, expect, type Page } from '@playwright/test';
import { normalizeRows } from '../src/utils/recipients';
const campaigns = [
  { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', campaignName: 'Product launch', description: 'New product', status: 'sent', totalEmailSent: 10, totalEmailOpened: 4, totalEmailReplied: 2, isAutomatedReply: false, hasFollowUp: false, followUpDuration: null },
  { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', campaignName: 'Winter update', description: 'Quarterly news', status: 'queued', totalEmailSent: 0, totalEmailOpened: 0, totalEmailReplied: 0, isAutomatedReply: false, hasFollowUp: false, followUpDuration: null },
];
async function mockApi(page: Page) {
  await page.route('http://localhost:3000/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = {};
    if (url.pathname === '/campaigns/total') data = { totalCampaigns: 2, totalEmailsSent: 10, totalOpened: 4 };
    else if (url.pathname === '/templates/total') data = { total: 1 };
    else if (url.pathname === '/templates/getAll/names') data = [];
    else if (url.pathname === '/campaigns/getAll') { const search = url.searchParams.get('search')?.toLowerCase() || ''; const filtered = campaigns.filter(c => c.campaignName.toLowerCase().includes(search)); data = { campaigns: filtered, total: filtered.length }; }
    else if (url.pathname.startsWith('/api/auth/')) data = { token: 'test-session' };
    await route.fulfill({ json: data, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}
async function loginState(page: Page) {
  await page.addInitScript(() => localStorage.setItem('x-ai-sales-mail-token', 'test-session'));
}
async function noOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}
test('recipient imports reject duplicates and invalid addresses', () => {
  expect(normalizeRows([{ Email: ' ALICE@example.com ', Name: 'Alice' }])[0].email).toBe('alice@example.com');
  expect(() => normalizeRows([{ Email: 'bad' }])).toThrow('valid email');
  expect(() => normalizeRows([{ Email: 'a@b.com' }, { email: 'A@B.COM' }])).toThrow('Duplicate');
  expect(() => normalizeRows([])).toThrow('between 1 and 1000');
});
for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  test(`responsive navigation and layouts at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page);
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
    await page.evaluate(() => localStorage.setItem('x-ai-sales-mail-token', 'test-session'));
    await page.goto('/dashboard');
    await expect(page.getByText('40.0%', { exact: true }).first()).toBeVisible();
    await expect(page.locator('.recharts-sector')).toHaveCount(2);
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true, animations: 'disabled' });
    if (width < 992) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('menuitem', { name: 'Email campaigns' }).click();
    } else await page.getByRole('menuitem', { name: 'Email campaigns' }).click();
    await expect(page.getByRole('heading', { name: 'Email campaigns' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '0.0%', exact: true })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('campaigns.png'), fullPage: true });
    await page.getByRole('button', { name: 'New campaign' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await noOverflow(page);
    const bounds = await page.getByRole('dialog').boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath('modal.png'), fullPage: true, animations: 'disabled' });
  });
}
test('search filters campaigns on the server', async ({ page }) => {
  await mockApi(page); await loginState(page); await page.goto('/email-campaigns');
  await page.getByPlaceholder('Search campaigns…').fill('Winter');
  await expect(page.getByRole('cell', { name: 'Product launch', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Winter update', exact: true })).toBeVisible();
});
test('failed automation save stays open and reports the error', async ({ page }) => {
  await mockApi(page); await loginState(page);
  await page.route('**/automated-reply/enableAutomation', route => route.fulfill({ status: 500, json: { message: 'Could not save automation' }, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto('/email-campaigns');
  await page.getByRole('button', { name: 'Automate reply', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Subject', exact: true }).fill('Thank you');
  await page.getByRole('textbox', { name: 'Email body' }).fill('Thanks for replying.');
  await page.getByRole('textbox', { name: 'Closing', exact: true }).fill('Regards');
  await page.getByRole('button', { name: 'Save automation' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Could not save automation' })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Automated reply saved', { exact: true })).toHaveCount(0);
});
test('campaign upload, validation, failure and idempotent retry', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockApi(page); await loginState(page);
  const keys: string[] = [];
  await page.route('**/campaigns/create', async route => {
    keys.push(route.request().headers()['idempotency-key']);
    await route.fulfill({ status: keys.length === 1 ? 500 : 201, json: keys.length === 1 ? { message: 'Delivery is not configured' } : { campaign: { _id: 'new-campaign' } }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.route('**/campaigns/new-campaign/process', route => route.fulfill({ json: { campaign: { status: 'sent' }, message: 'Campaign sent' }, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto('/email-campaigns');
  await page.getByRole('button', { name: 'New campaign' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('campaign name and description');
  await page.getByRole('textbox', { name: 'Campaign name' }).fill('Test campaign');
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Test description');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'recipients.csv', mimeType: 'text/csv', buffer: Buffer.from('Email,First Name\nalice@example.com,Alice\nbob@example.com,Bob') });
  await expect(page.getByText('2 recipients', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('textbox', { name: 'Subject', exact: true }).fill('Hello {{First Name}}');
  await page.getByRole('textbox', { name: 'Email body' }).fill('Welcome to the launch.');
  await page.getByRole('textbox', { name: 'Closing', exact: true }).fill('Regards');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Send now', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Delivery is not configured' })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Send now', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(keys).toHaveLength(2); expect(keys[0]).toBeTruthy(); expect(keys[0]).toBe(keys[1]);
});
test('expired session redirects to sign in', async ({ page }) => {
  await mockApi(page); await loginState(page);
  await page.route('**/campaigns/getAll**', route => route.fulfill({ status: 401, json: { message: 'Session expired' }, headers: { 'Access-Control-Allow-Origin': '*' } }));
  // Add the token once here instead of injecting it on every full-page redirect.
  await page.goto('/auth/login');
  await page.evaluate(() => localStorage.setItem('x-ai-sales-mail-token', 'test-session'));
  await page.goto('/email-campaigns');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

async function openReview(page: Page) {
  await page.goto('/email-campaigns');
  await page.getByRole('button', { name: 'New campaign' }).click();
  await page.getByRole('textbox', { name: 'Campaign name' }).fill('Scheduled campaign');
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Choose a send time');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'recipients.csv', mimeType: 'text/csv', buffer: Buffer.from('Email,First Name\nalice@example.com,Alice') });
  await expect(page.getByText('1 recipients', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('textbox', { name: 'Subject', exact: true }).fill('Hello {{First Name}}');
  await page.getByRole('textbox', { name: 'Email body' }).fill('Your scheduled message.');
  await page.getByRole('textbox', { name: 'Closing', exact: true }).fill('Regards');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}

test('scheduling converts the chosen Pakistan time to UTC without sending early', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockApi(page); await loginState(page);
  let sendTime: unknown;
  let processed = false;
  await page.route('**/campaigns/create', async route => {
    sendTime = route.request().postDataJSON().scheduledAt;
    await route.fulfill({ status: 201, json: { campaign: { _id: 'scheduled-campaign', scheduledAt: sendTime } }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.route('**/campaigns/*/process', async route => { processed = true; await route.fulfill({ json: {} }); });
  await openReview(page);
  await page.getByRole('radio', { name: 'Schedule for later' }).check();
  await page.getByLabel('Send date and time', { exact: true }).fill('2035-01-01T13:00');
  await expect(page.getByText('Your timezone: Asia/Karachi')).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('scheduled-review-mobile.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Schedule campaign', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(sendTime).toBe('2035-01-01T08:00:00.000Z'); expect(processed).toBe(false);
});

test('past send times are rejected without submitting the campaign', async ({ page }) => {
  await mockApi(page); await loginState(page);
  let submitted = false;
  await page.route('**/campaigns/create', async route => { submitted = true; await route.fulfill({ json: {} }); });
  await openReview(page);
  await page.getByRole('radio', { name: 'Schedule for later' }).check();
  await page.getByLabel('Send date and time', { exact: true }).fill('2000-01-01T13:00');
  await page.getByRole('button', { name: 'Schedule campaign', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Choose a valid send date and time in the future.' })).toBeVisible();
  expect(submitted).toBe(false);
});

test('queued campaigns can be rescheduled from the list', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await mockApi(page); await loginState(page);
  let sendTime: unknown;
  await page.route('**/campaigns/bbbbbbbbbbbbbbbbbbbbbbbb/schedule', async route => {
    sendTime = route.request().postDataJSON().scheduledAt;
    await route.fulfill({ json: { message: 'Send time updated' }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/email-campaigns');
  await page.getByRole('button', { name: 'Change send time', exact: true }).click();
  await page.getByLabel('Send date and time', { exact: true }).fill('2035-01-01T18:30');
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('reschedule-mobile.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Save send time' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(sendTime).toBe('2035-01-01T13:30:00.000Z');
});
