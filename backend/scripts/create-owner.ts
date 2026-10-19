import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const title = process.env.PORTFOLIO_TITLE?.trim();
  const slug = process.env.PORTFOLIO_SLUG?.trim();
  if (!email || !password || !title || !slug) {
    throw new Error('Cần cấu hình OWNER_EMAIL, OWNER_PASSWORD, PORTFOLIO_TITLE và PORTFOLIO_SLUG trong .env.');
  }
  if (Buffer.byteLength(password, 'utf8') < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('OWNER_PASSWORD phải dài từ 12 đến 72 byte UTF-8.');
  }
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error('Email đã tồn tại; script không thay đổi tài khoản hiện có.');
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash } });
    await tx.portfolio.create({ data: { userId: user.id, title, slug } });
  });
  process.stdout.write(`Đã tạo tài khoản chủ sở hữu và portfolio "${slug}".\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Không thể tạo tài khoản chủ sở hữu.'}\n`);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
