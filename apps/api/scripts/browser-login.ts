import { chromium } from 'playwright';
import { browserProfilePath } from '../src/invitations/browser-invitation.executor';
import { mkdir } from 'node:fs/promises';

async function main(): Promise<void> {
  const ownerLabel = process.argv[2]?.trim();
  if (!ownerLabel) throw new Error('用法：npm run browser:login -w @family-invite/api -- <owner-label>');

  const profileDir = browserProfilePath(ownerLabel);
  await mkdir(profileDir, { recursive: true, mode: 0o700 });
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: null,
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(process.env.GOOGLE_FAMILY_INVITE_URL ?? 'https://families.google.com/families', {
      waitUntil: 'domcontentloaded',
    });
    console.log(`请在打开的浏览器中完成 ${ownerLabel} 的人工登录。完成后回到终端按 Enter 关闭浏览器。`);
    await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
  } finally {
    await context.close();
  }
}

void main();
