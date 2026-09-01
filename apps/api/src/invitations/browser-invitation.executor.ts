import { Injectable, Logger } from '@nestjs/common';
import { chromium, type Page } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { InvitationExecution, InvitationExecutor } from './invitation-executor';

type BrowserContext = Awaited<ReturnType<typeof chromium.launchPersistentContext>>;

export function browserProfilePath(
  ownerLabel: string,
  profileRoot = process.env.BROWSER_PROFILE_ROOT ?? join(process.cwd(), '.familyflow/browser-profiles'),
): string {
  const profileId = createHash('sha256').update(ownerLabel).digest('hex').slice(0, 24);
  return join(profileRoot, profileId);
}

/**
 * Runs an invitation through a pre-authenticated, owner-specific browser profile.
 *
 * This executor deliberately does not perform login or handle MFA/CAPTCHA. A
 * human must authenticate the profile once; if Google asks for re-authentication,
 * the task fails closed and the operator can take over locally.
 */
@Injectable()
export class BrowserInvitationExecutor implements InvitationExecutor {
  private readonly logger = new Logger(BrowserInvitationExecutor.name);
  private readonly ownerLocks = new Map<string, Promise<void>>();

  async execute(input: {
    taskId: string;
    ownerLabel: string;
    targetEmail: string;
  }): Promise<InvitationExecution> {
    const target = this.getInviteUrl();
    const profileRoot = process.env.BROWSER_PROFILE_ROOT ?? join(process.cwd(), '.familyflow/browser-profiles');
    const profileDir = browserProfilePath(input.ownerLabel, profileRoot);
    const profileId = basename(profileDir);

    return this.withOwnerLock(profileId, async () => {
      await mkdir(profileDir, { recursive: true, mode: 0o700 });
      let context: BrowserContext | undefined;
      try {
        context = await chromium.launchPersistentContext(profileDir, {
          headless: process.env.BROWSER_HEADLESS !== 'false',
          viewport: null,
        });
        const page = context.pages()[0] ?? (await context.newPage());
        await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

        await this.assertAuthenticated(page);
        await this.clickFirst(page, [
          /invite family member/i,
          /send invitations?/i,
          /邀请家庭成员/i,
          /发送邀请/i,
        ]);

        const emailInput = page.locator('input[type="email"]').first();
        await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
        await emailInput.fill(input.targetEmail);

        await this.clickFirst(page, [/^send$/i, /send invitation/i, /^发送$/i, /发送邀请/i]);
        await this.waitForSuccess(page);

        this.logger.log(`Browser invitation sent for task ${input.taskId}`);
        return { providerReference: `google-browser-${input.taskId}` };
      } finally {
        await context?.close();
      }
    });
  }

  private getInviteUrl(): URL {
    const raw = process.env.GOOGLE_FAMILY_INVITE_URL ?? 'https://families.google.com/families';
    const url = new URL(raw);
    const allowedHosts = new Set(
      (process.env.BROWSER_ALLOWED_HOSTS ?? 'families.google.com')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    );
    const allowInsecure = process.env.BROWSER_ALLOW_INSECURE === 'true';
    if ((url.protocol !== 'https:' && !allowInsecure) || !allowedHosts.has(url.hostname.toLowerCase())) {
      throw new Error('浏览器执行器目标地址不在允许列表中');
    }
    return url;
  }

  private async assertAuthenticated(page: Page): Promise<void> {
    const bodyText = await page.locator('body').innerText({ timeout: 5_000 });
    if (/sign in|登录|verify it(?:'|’)s you|验证身份|需要重新登录/i.test(bodyText)) {
      throw new Error('NEEDS_REAUTH: 母号浏览器会话已失效，请人工重新登录');
    }
  }

  private async clickFirst(page: Page, names: RegExp[]): Promise<void> {
    for (const name of names) {
      const locator = page.getByRole('button', { name }).first();
      if ((await locator.count()) > 0 && (await locator.isVisible())) {
        await locator.click();
        return;
      }
    }
    throw new Error('GOOGLE_UI_CHANGED: 未找到预期的邀请操作按钮');
  }

  private async waitForSuccess(page: Page): Promise<void> {
    const success = page.getByText(/invitation sent|邀请已发送|已发送邀请|sent successfully/i).first();
    await success.waitFor({ state: 'visible', timeout: 15_000 });
  }

  private async withOwnerLock<T>(ownerId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.ownerLocks.get(ownerId);
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.ownerLocks.set(ownerId, current);
    await previous;
    try {
      return await work();
    } finally {
      release();
      if (this.ownerLocks.get(ownerId) === current) this.ownerLocks.delete(ownerId);
    }
  }
}
