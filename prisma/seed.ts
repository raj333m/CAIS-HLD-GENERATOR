import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MASTER_SECTIONS } from '../src/lib/sectionsData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CAIS HLD Generator database with exact verbatim Prompt 14 content...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Seed / Upsert Users
  let baUser = await prisma.user.findFirst({ where: { email: 'ba@cais.com' } });
  if (!baUser) {
    baUser = await prisma.user.create({
      data: {
        id: '92239e9e-cf9f-45db-b4ba-ee4cd97a0742',
        name: 'Aishwarya Raj Singh',
        email: 'ba@cais.com',
        passwordHash,
        role: 'BA',
        isActive: true,
      },
    });
  }

  let reviewerUser = await prisma.user.findFirst({ where: { email: 'reviewer@cais.com' } });
  if (!reviewerUser) {
    reviewerUser = await prisma.user.create({
      data: {
        id: '9c415e6f-7c6f-4b0b-b5b7-ee2e1c18ff02',
        name: 'Stuart H Lindsay',
        email: 'reviewer@cais.com',
        passwordHash,
        role: 'REVIEWER',
        isActive: true,
      },
    });
  }

  let adminUser = await prisma.user.findFirst({ where: { email: 'admin@cais.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        id: 'ad001e9e-cf9f-45db-b4ba-ee4cd97a0742',
        name: 'Manash R Chanda',
        email: 'admin@cais.com',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
  }

  console.log('Seeded Users: BA, Reviewer, Admin');

  // 2. Seed / Upsert Bureaus
  const bureauExperian = await prisma.bureau.findFirst({ where: { name: 'Experian' } });
  if (!bureauExperian) {
    await prisma.bureau.create({
      data: {
        name: 'Experian',
        submissionChannel: 'Connect:Direct / Secure FTP Gateway',
        fileFormat: 'Fixed-Width CAIS Spec v2024.1 (44-Field Record Layout)',
        cutoffDate: '15th of each month',
        fileSpecVersion: 'v2024.1',
        notes: 'Primary UK credit bureau. Requires fixed 44-field record layout with header/trailer checksums.',
      },
    });
  }

  const bureauEquifax = await prisma.bureau.findFirst({ where: { name: 'Equifax' } });
  if (!bureauEquifax) {
    await prisma.bureau.create({
      data: {
        name: 'Equifax',
        submissionChannel: 'Equifax Secure Connect (HTTPS/SFTP Gateway)',
        fileFormat: 'CAIS Pipe-Delimited & Fixed v4.2',
        cutoffDate: '17th of each month',
        fileSpecVersion: 'v4.2',
        notes: 'Requires separate test acknowledgment file verification prior to production batch release.',
      },
    });
  }

  const bureauTU = await prisma.bureau.findFirst({ where: { name: 'TransUnion' } });
  if (!bureauTU) {
    await prisma.bureau.create({
      data: {
        name: 'TransUnion',
        submissionChannel: 'TransUnion Secure Transfer (TUST / SFTP)',
        fileFormat: 'CAIS Standard XML / Fixed Spec v3.8',
        cutoffDate: '20th of each month',
        fileSpecVersion: 'v3.8',
        notes: 'TransUnion submission window closes 20th 23:59 GMT.',
      },
    });
  }

  console.log('Seeded Bureaus: Experian, Equifax, TransUnion');

  // 3. Seed Document Sections & SubSections if not present
  const existingSectionCount = await prisma.documentSection.count();
  if (existingSectionCount === 0) {
    for (const secData of MASTER_SECTIONS) {
      const createdSec = await prisma.documentSection.create({
        data: {
          sectionNumber: secData.sectionNumber,
          title: secData.title,
          displayOrder: secData.displayOrder,
        },
      });

      if (secData.subSections && secData.subSections.length > 0) {
        for (const sub of secData.subSections) {
          await prisma.subSection.create({
            data: {
              documentSectionId: createdSec.id,
              heading: sub.heading || '',
              contentBlocks: typeof sub.contentBlocks === 'string' ? sub.contentBlocks : JSON.stringify(sub.contentBlocks),
              displayOrder: sub.displayOrder || 1,
            },
          });
        }
      }
    }
  }

  // 4. Seed / Upsert Section 3 CAIS Change Register Entries (Idempotent non-destructive seed)
  const changesData = [
    {
      id: 'f9411d38-2e02-4740-9a29-158a1834279b',
      crReference: 'CAIS-BASE-003',
      title: 'Default Balance Reconciliation & Account Closure Date Alignment',
      status: 'DRAFT',
      changeType: 'Existing data item amended, Business rule change',
      businessDriver: 'Internal data quality remediation — align Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies so default balances remain accurate post-sale.',
      description: 'Align the Original Default Balance and Default Satisfaction Date fields for accounts sold to debt collection agencies to ensure default balances are correctly reflected once an account is transferred.',
      sectionsUpdated: 'Section 1.3 — Exclusion Rules Applied Post-Staging (All Brands); Section 2.5 — CAIS Variables 17 (Original Default Balance) and 42 (Default Satisfaction Date).',
      beforeText: '[Describe prior logic for Original Default Balance / Default Satisfaction Date on debt-sold accounts]',
      afterText: '[Describe corrected logic once implemented]',
      impactedBureaus: 'HSBC Cards (51), First Direct Cards (211)',
      impactedDataItems: '17. Original Default Balance, 42. Default Satisfaction Date',
      targetMonth: 'December 2026',
      createdById: baUser.id,
    },
    {
      id: 'b82df910-449e-4e63-8a3e-721fb653ab12',
      crReference: 'CAIS-BASE-002',
      title: 'Buy-Now-Pay-Later (BNPL) Product Scope Expansion to CAIS',
      status: 'IN_REVIEW',
      changeType: 'New product type, New data item added, Technical schema change',
      businessDriver: 'Bring the new BNPL instalment product into scope in line with expanding regulatory expectations on BNPL data sharing.',
      description: 'Incorporate new BNPL installment product line into monthly CAIS reporting files submitted to Experian, Equifax, and TransUnion.',
      sectionsUpdated: 'Section 1.3 — New BNPL inclusion sub-section; Section 2.5 — Supported Products table',
      beforeText: 'BNPL products were out of scope for monthly CAIS reporting.',
      afterText: 'BNPL products mapped to CAIS Product Code "BN" with 3-installment reporting logic active across staging pipeline.',
      impactedBureaus: 'HSBC Retail (85), HSBC Cards (51), First Direct (211)',
      impactedDataItems: '02. Account Type, 09. Credit Limit / Total Loan Amount',
      targetMonth: 'November 2026',
      createdById: baUser.id,
      reviewedById: reviewerUser.id,
      reviewComments: 'Under review by Risk Committee.',
    },
    {
      id: '37eda0d7-1c69-40f4-94ff-452c6141b56a',
      crReference: 'CAIS-BASE-001',
      title: 'Consumer Duty Payment Holiday & Forbearance Indicator Update',
      status: 'APPROVED',
      changeType: 'Existing data item amended, Business rule change, Bureau variation',
      businessDriver: 'Accurately flag temporary forbearance/payment holidays in support of Consumer Duty.',
      description: 'Enhance monthly reporting to flag temporary forbearance payment holidays accurately across all 3 bureaus, preventing erroneous arrears scoring for impacted customers.',
      sectionsUpdated: 'Section 1.3 — Status criteria; Section 2.5 — CAIS Variable 19 (Special Instruction Indicator)',
      beforeText: 'ARR_INDICATOR only supported "I" (Formal Plan) and "N" (None). Payment holiday accounts were reported with status increments.',
      afterText: 'ARR_INDICATOR now supports "P" (Payment Holiday) with STATUS_CODE held at "0" (Up to Date) during active arrangement period.',
      impactedBureaus: 'HSBC Retail (85), HSBC Cards (51), M&S Loans (947), First Direct (211)',
      impactedDataItems: '19. Special Instruction Indicator, 05. Account Status',
      targetMonth: 'October 2026',
      createdById: baUser.id,
      reviewedById: reviewerUser.id,
      reviewComments: 'Approved by Lead Reviewer. Fully compliant with CAIS data standard.',
      approvedAt: new Date('2026-09-10T14:30:00Z'),
    },
  ];

  for (const c of changesData) {
    const existing = await prisma.caisChange.findFirst({ where: { crReference: c.crReference } });
    if (!existing) {
      const createdChange = await prisma.caisChange.create({ data: c });
      await prisma.changeRisk.create({
        data: {
          changeId: createdChange.id,
          risk: 'Upstream deployment delay reduces UAT window',
          impact: 'Medium',
          mitigation: 'Build transformation rules against simulated staging schema.',
        },
      });
    }
  }

  console.log('Database non-destructive seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
