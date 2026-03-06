import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { createCipheriv, randomBytes } from 'crypto';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'DevPass@2024';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encryptForSeed(plaintext: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex chars. Set it in .env before seeding.');
  }
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

async function main() {
  console.log('\n🌱 Seeding database for alpha testing...\n');

  const hashedPassword = await bcrypt.hash(DEV_PASSWORD, 12);

  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@nyaymitra.dev' },
    update: {},
    create: {
      email: 'citizen@nyaymitra.dev',
      password: hashedPassword,
      name: 'Dev Citizen',
      provider: 'LOCAL',
    },
  });

  const citizenConvId = randomUUID();
  await prisma.conversation.upsert({
    where: { id: citizenConvId },
    update: {},
    create: {
      id: citizenConvId,
      userId: citizen.id,
      title: 'Sample Legal Query',
      mode: 'NORMAL',
      messages: {
        create: [
          { id: randomUUID(), role: 'USER', content: 'What are my rights if I receive an eviction notice?', attachments: [] },
          { id: randomUUID(), role: 'ASSISTANT', content: 'When you receive an eviction notice in India, you have several rights under the Transfer of Property Act and relevant state rent control laws...', attachments: [] },
        ],
      },
    },
  });

  console.log('CitizenUser created:', citizen.email);

  const existingLawyer = await prisma.lawyerUser.findUnique({
    where: { email: 'lawyer@nyaymitra.dev' },
  });

  let lawyer;
  if (!existingLawyer) {
    lawyer = await prisma.lawyerUser.create({
      data: {
        email: 'lawyer@nyaymitra.dev',
        name: 'Dev Advocate',
        password: hashedPassword,
        provider: 'LOCAL',
        encryptedPhone: encryptForSeed('9876543210'),
        encryptedBarNumber: encryptForSeed('D/2015/12345'),
        barCouncilState: 'DELHI',
        practiceAreas: ['Civil', 'Criminal'],
        yearsOfExperience: 8,
        phoneVerified: true,
        emailVerified: true,
        barNumberFormatValid: true,
        verificationStatus: 'AUTO_VERIFIED',
        verifiedAt: new Date(),
        twoFactorAuth: {
          create: {
            method: 'EMAIL',
            isEnabled: true,
            isSetupComplete: true,
            hashedBackupCodes: [],
          },
        },
      },
    });

    const matter = await prisma.matter.create({
      data: {
        lawyerId: lawyer.id,
        title: 'Sharma v. Singh — Cheque Bounce',
        caseNumber: 'CC/2024/1234',
        court: 'Delhi MM Court, Saket',
        practiceArea: 'Criminal',
        stage: 'ACTIVE',
        parties: { plaintiff: 'Rajesh Sharma', defendant: 'Vikram Singh' },
        memory: {
          create: {
            partySummary: 'Plaintiff: Rajesh Sharma (payee). Defendant: Vikram Singh (drawer). Cheque for ₹5,00,000 dated 15-Jan-2024 dishonoured.',
            legalIssues: 'Dishonour of cheque under NI Act Section 138.',
            estimatedTokens: 120,
          },
        },
      },
    });

    console.log('LawyerUser created:', lawyer.email);
    console.log('Sample Matter created:', matter.title);
  } else {
    lawyer = existingLawyer;
    console.log('LawyerUser already exists:', lawyer.email);
  }

  const existingFirm = await prisma.firmUser.findUnique({
    where: { email: 'firm@nyaymitra.dev' },
  });

  if (!existingFirm) {
    const firm = await prisma.firmUser.create({
      data: {
        email: 'firm@nyaymitra.dev',
        name: 'Dev Admin',
        firmName: 'Dev & Associates',
        password: hashedPassword,
        encryptedPhone: encryptForSeed('9811223344'),
        encryptedRegistrationNumber: encryptForSeed('U74999DL2018PTC123456'),
        encryptedGstNumber: encryptForSeed('07AABCD1234E1ZV'),
        city: 'New Delhi',
        state: 'Delhi',
        emailVerified: true,
        phoneVerified: true,
        registrationFormatValid: true,
        verificationStatus: 'AUTO_VERIFIED',
        verifiedAt: new Date(),
        knownIpAddresses: ['127.0.0.1', '::1'],
        twoFactorAuth: {
          create: {
            method: 'EMAIL',
            isEnabled: true,
            isSetupComplete: true,
            hashedBackupCodes: [],
          },
        },
      },
    });

    console.log('FirmUser created:', firm.email);
  } else {
    console.log('ℹFirmUser already exists:', existingFirm.email);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nyay Mitra — Dev Seed Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Accounts (all use password: ${DEV_PASSWORD})

Citizen
   Email:    citizen@nyaymitra.dev
   Login:    POST /api/auth/login
   No 2FA required.

Lawyer
   Email:    lawyer@nyaymitra.dev
   Login:    POST /api/lawyer/auth/login  → get twoFactorToken
             POST /api/lawyer/auth/login/verify-2fa  → submit OTP
  OTP:      Generated during login. In development, read the server log line:
         [DEV] OTP for <lawyerId> (LOGIN_2FA): 123456

Firm
   Email:    firm@nyaymitra.dev
   Login:    POST /api/firm/auth/login  → get twoFactorToken
             POST /api/firm/auth/login/verify-2fa  → submit OTP
  OTP:      Generated during login. In development, read the server log line:
         [DEV] OTP for <firmId> (LOGIN_2FA): 123456

Recommended local flow
  1. Run migrations
  2. Run: npx prisma db seed
  3. Start: npm run dev
  4. Use curl.exe against /api/lawyer/auth/* and /api/firm/auth/*
  5. Read OTPs from the dev server logs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
