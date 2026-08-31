import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { hashRedeemCode } from '../src/common/code-hash';

const demoCode = 'TEST-2026-CARD-0001';
let app: INestApplication;
let prisma: PrismaClient;

describe('invitation API integration', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://family_invite:local_only_password@localhost:5432/family_invite?schema=public';
    process.env.REDIS_HOST ??= 'localhost';
    process.env.REDIS_PORT ??= '6379';
    process.env.CARD_HASH_PEPPER ??= 'integration-test-pepper';
    process.env.ADMIN_API_KEY ??= 'integration-admin-key';

    const [{ AppModule }, { PrismaService }] = await Promise.all([
      import('../src/app.module'),
      import('../src/prisma/prisma.service'),
    ]);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.invitationTask.deleteMany();
    await prisma.redeemCode.deleteMany();
    await prisma.ownerAccount.deleteMany();
    await prisma.ownerAccount.create({
      data: { label: 'integration-owner-01', capacityTotal: 2 },
    });
    await prisma.redeemCode.create({
      data: {
        codeHash: hashRedeemCode(demoCode, process.env.CARD_HASH_PEPPER!),
        orderNo: 'TEST-ORDER-001',
      },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('completes the card-to-invitation workflow and consumes one slot', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cards/verify')
      .send({ code: demoCode })
      .expect(201)
      .expect(({ body }) => expect(body).toMatchObject({ valid: true, status: 'ACTIVE' }));

    const created = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .send({ code: demoCode, email: 'User@Example.com' })
      .expect(201);
    expect(created.body).toMatchObject({ email: 'us***@example.com', status: 'QUEUED' });
    expect(created.body.id).toMatch(/^[0-9a-f-]{36}$/);

    const completed = await waitForCompletion(created.body.id as string);
    expect(completed).toMatchObject({ email: 'us***@example.com', status: 'SUCCEEDED' });
    expect(JSON.stringify(completed)).not.toContain('user@example.com');

    const owner = await prisma.ownerAccount.findUniqueOrThrow({
      where: { label: 'integration-owner-01' },
    });
    expect(owner).toMatchObject({ capacityUsed: 1, pendingSlots: 0 });

    const repeated = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .send({ code: demoCode, email: 'user@example.com' })
      .expect(201);
    expect(repeated.body.id).toBe(created.body.id);
  });

  it('protects capacity management and prevents card rebinding', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/owners').expect(401);
    const owners = await request(app.getHttpServer())
      .get('/api/v1/admin/owners')
      .set('x-admin-key', process.env.ADMIN_API_KEY!)
      .expect(200);
    expect(owners.body).toHaveLength(1);
    expect(owners.body[0]).toMatchObject({ availableSlots: 2 });

    await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .send({ code: demoCode, email: 'first@example.com' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .send({ code: demoCode, email: 'second@example.com' })
      .expect(409);
  });
});

async function waitForCompletion(id: string): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await request(app.getHttpServer()).get(`/api/v1/invitations/${id}`).expect(200);
    if (response.body.status === 'SUCCEEDED' || response.body.status === 'FAILED') {
      return response.body as Record<string, unknown>;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Invitation did not finish in time');
}
