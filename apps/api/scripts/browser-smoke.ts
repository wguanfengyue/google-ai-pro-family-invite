import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { BrowserInvitationExecutor } from '../src/invitations/browser-invitation.executor';

async function main(): Promise<void> {
  const profileRoot = await mkdtemp(`${tmpdir()}/familyflow-browser-smoke-`);
  const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html>
    <html><body>
      <main><h1>Family settings</h1>
      <button>Invite family member</button>
      <label>Email <input type="email" /></label>
      <button>Send</button>
      <p hidden>Invitation sent</p>
      <script>
        document.querySelector('button').addEventListener('click', () => {
          document.querySelector('p').hidden = false;
        });
        document.querySelectorAll('button')[1].addEventListener('click', () => {
          document.querySelector('p').hidden = false;
        });
      </script>
    </main></body></html>`);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('无法启动浏览器 smoke server');

  process.env.BROWSER_PROFILE_ROOT = profileRoot;
  process.env.GOOGLE_FAMILY_INVITE_URL = `http://127.0.0.1:${address.port}/families`;
  process.env.BROWSER_ALLOWED_HOSTS = '127.0.0.1';
  process.env.BROWSER_ALLOW_INSECURE = 'true';
  process.env.BROWSER_HEADLESS = 'true';

  try {
    const result = await new BrowserInvitationExecutor().execute({
      taskId: 'browser-smoke-task',
      ownerLabel: 'browser-smoke-owner',
      targetEmail: 'smoke@example.com',
    });
    console.log(JSON.stringify({ ok: true, result }));
  } finally {
    server.close();
    await rm(profileRoot, { recursive: true, force: true });
  }
}

void main();
