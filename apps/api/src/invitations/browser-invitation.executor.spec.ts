import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { BrowserInvitationExecutor } from './browser-invitation.executor';

jest.mock('playwright', () => ({
  chromium: { launchPersistentContext: jest.fn() },
}));

type MockLocator = {
  count: jest.Mock;
  isVisible: jest.Mock;
  click: jest.Mock;
  fill: jest.Mock;
  first: jest.Mock;
  waitFor: jest.Mock;
};

function locator(overrides: Partial<MockLocator> = {}): MockLocator {
  const value = {} as MockLocator;
  value.count = jest.fn().mockResolvedValue(1);
  value.isVisible = jest.fn().mockResolvedValue(true);
  value.click = jest.fn().mockResolvedValue(undefined);
  value.fill = jest.fn().mockResolvedValue(undefined);
  value.first = jest.fn(() => value);
  value.waitFor = jest.fn().mockResolvedValue(undefined);
  Object.assign(value, overrides);
  return value;
}

describe('BrowserInvitationExecutor', () => {
  let profileRoot: string;

  beforeEach(async () => {
    profileRoot = await mkdtemp(`${tmpdir()}/familyflow-browser-`);
    process.env.BROWSER_PROFILE_ROOT = profileRoot;
    process.env.GOOGLE_FAMILY_INVITE_URL = 'https://families.google.com/families';
    process.env.BROWSER_ALLOWED_HOSTS = 'families.google.com';
    process.env.BROWSER_HEADLESS = 'true';
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await rm(profileRoot, { recursive: true, force: true });
    delete process.env.BROWSER_PROFILE_ROOT;
    delete process.env.GOOGLE_FAMILY_INVITE_URL;
    delete process.env.BROWSER_ALLOWED_HOSTS;
    delete process.env.BROWSER_HEADLESS;
  });

  it('reuses an owner profile and sends an invitation without login automation', async () => {
    const inviteButton = locator();
    const sendButton = locator();
    const emailInput = locator();
    const success = locator();
    const body = { innerText: jest.fn().mockResolvedValue('Family settings') };
    const page = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForLoadState: jest.fn().mockResolvedValue(undefined),
      locator: jest.fn((selector: string) => {
        if (selector === 'body') return body;
        return emailInput;
      }),
      getByRole: jest.fn((_role: string, { name }: { name: RegExp }) => {
        return name.source.includes('invite|send invitations') ? inviteButton : sendButton;
      }),
      getByText: jest.fn().mockReturnValue(success),
    };
    const context = { pages: jest.fn().mockReturnValue([page]), close: jest.fn() };
    (chromium.launchPersistentContext as jest.Mock).mockResolvedValue(context);

    const result = await new BrowserInvitationExecutor().execute({
      taskId: 'task-1',
      ownerLabel: 'owner-01',
      targetEmail: 'customer@example.com',
    });

    expect(result).toEqual({ providerReference: 'google-browser-task-1' });
    expect(chromium.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(profileRoot),
      expect.objectContaining({ headless: true }),
    );
    expect(emailInput.fill).toHaveBeenCalledWith('customer@example.com');
    expect(context.close).toHaveBeenCalled();
  });

  it('fails closed when the target host is not allowlisted', async () => {
    process.env.GOOGLE_FAMILY_INVITE_URL = 'https://example.com/family';

    await expect(
      new BrowserInvitationExecutor().execute({
        taskId: 'task-2',
        ownerLabel: 'owner-01',
        targetEmail: 'customer@example.com',
      }),
    ).rejects.toThrow('目标地址不在允许列表');
    expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
  });
});
