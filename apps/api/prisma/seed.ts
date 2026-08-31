import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();
const demoCode = 'DEMO-2026-MVP-0001';
const pepper = process.env.CARD_HASH_PEPPER ?? 'local-development-pepper';
const codeHash = createHash('sha256').update(`${pepper}:${demoCode}`).digest('hex');

async function main(): Promise<void> {
  await prisma.ownerAccount.upsert({
    where: { label: 'demo-owner-01' },
    update: {},
    create: { label: 'demo-owner-01', capacityTotal: 5 },
  });
  await prisma.redeemCode.upsert({
    where: { codeHash },
    update: {},
    create: { codeHash, orderNo: 'DEMO-ORDER-001' },
  });
  console.info(`Demo data ready. Redeem code: ${demoCode}`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
