import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      provider: 'LOCAL',
    },
  });

  console.log('Created test user:', user.email);

  const conversationId = randomUUID();
  const message1Id = randomUUID();
  const message2Id = randomUUID();

  const conversation = await prisma.conversation.create({
    data: {
      id: conversationId,
      userId: user.id,
      title: 'Contract Review Inquiry',
      mode: 'NORMAL',
      messages: {
        create: [
          {
            id: message1Id,
            role: 'USER',
            content: 'Can you help me review an employment contract?',
            attachments: [],
          },
          {
            id: message2Id,
            role: 'ASSISTANT',
            content:
              'Of course! I\'d be happy to help you review your employment contract. Please share the document or specific clauses you\'d like me to analyze.',
            attachments: [],
          },
        ],
      },
    },
  });

  console.log('Created sample conversation:', conversation.id);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
