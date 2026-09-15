import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MASTER_SECTIONS } from '../src/lib/sectionsData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CAIS HLD Generator database with exact verbatim Prompt 14 content...');

  // Clean existing data in order
  await prisma.sectionVersion.deleteMany({});
  await prisma.subSection.deleteMany({});
  await prisma.changeRisk.deleteMany({});
  await prisma.caisChange.deleteMany({});
  await prisma.documentSection.deleteMany({});
  await prisma.hldVersion.deleteMany({});
  await prisma.hldComment.deleteMany({});
  await prisma.hldStakeholder.deleteMany({});
  await prisma.hldRisk.deleteMany({});
  await prisma.hldBureauNote.deleteMany({});
  await prisma.hldDataItemImpact.deleteMany({});
  await prisma.hldDocument.deleteMany({});
  await prisma.caisDataItem.deleteMany({});
  await prisma.bureau.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Users
  const passwordHash = bcrypt.hashSync('password123', 10);

  const baUser = await prisma.user.create({
    data: {
      name: 'Aishwarya Raj Singh',
      email: 'ba@cais.com',
      passwordHash,
      role: 'BA',
      isActive: true,
    },
  });

  const reviewerUser = await prisma.user.create({
    data: {
      name: 'Stuart H Lindsay',
      email: 'reviewer@cais.com',
      passwordHash,
      role: 'REVIEWER',
      isActive: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Manash R Chanda',
      email: 'admin@cais.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Seeded Users: BA, Reviewer, Admin');

  // 2. Seed Bureaus
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

  await prisma.bureau.create({
    data: {
      name: 'TransUnion',
      submissionChannel: 'TU Direct File Gateway',
      fileFormat: 'CAIS Standard Fixed/CSV v3.9',
      cutoffDate: '18th of each month',
      fileSpecVersion: 'v3.9',
      notes: 'Accepts monthly incremental batch delta files and full snapshot refreshes.',
    },
  });

  console.log('Seeded Bureaus: Experian, Equifax, TransUnion');

  // 3. Seed CAIS 44-Field Catalog Items
  const catalogFields = [
    { pos: 1, code: 'CLOSE_DATE', name: 'Close Date', cat: 'Account Identification', def: 'YYYYMMDD format when account closed; blank if active.' },
    { pos: 2, code: 'MONTHLY_PMT', name: 'Monthly Payment (Derived)', cat: 'Balance & Limit', def: 'CU Team derived monthly contractual payment amount in GBP.' },
    { pos: 3, code: 'REPAY_PER', name: 'Repayment period (Derived)', cat: 'Account Identification', def: 'CU Team derived total repayment term in months.' },
    { pos: 4, code: 'CURRENT_BAL', name: 'Current Balance (Derived)', cat: 'Balance & Limit', def: 'CU Team derived outstanding balance (+ for debt, - for credit balance).' },
    { pos: 5, code: 'ACC_STATUS', name: 'Account Status (Derived)', cat: 'Status & Arrears', def: 'CU Team derived status (0=Up to Date, 1-6=Months in Arrears, D=Default, S=Settled).' },
    { pos: 6, code: 'FLAG_SETTINGS', name: 'Flag settings (Derived)', cat: 'Special Flags', def: 'CU Team derived special arrangement indicator flag.' },
    { pos: 7, code: 'TRANS_FLAG', name: 'Transaction Flag', cat: 'Account Identification', def: 'N=New Account, U=Update Record, D=Delete Record.' },
    { pos: 8, code: 'PMT_FREQ', name: 'Payment frequency', cat: 'Account Identification', def: 'M=Monthly, W=Weekly, Q=Quarterly, A=Annual.' },
    { pos: 9, code: 'ACC_NUM', name: 'Account Number', cat: 'Account Identification', def: 'Primary account identifier (up to 18 characters).' },
    { pos: 10, code: 'SEQ_NUM', name: 'Sequence Number', cat: 'Account Identification', def: 'Joint customer sequence number (001=Primary, 002=Joint).' },
    { pos: 11, code: 'ACC_TYPE', name: 'Account Type', cat: 'Account Identification', def: '2-digit CAIS product type code (02=Loan, 05=Credit Card, 06=Overdraft).' },
    { pos: 12, code: 'START_DATE', name: 'Start Date', cat: 'Account Identification', def: 'Account open date (YYYYMMDD).' },
    { pos: 13, code: 'CREDIT_BAL_IND', name: 'Credit Balance indicator (Derived)', cat: 'Balance & Limit', def: 'Y if balance is in credit, blank otherwise.' },
    { pos: 14, code: 'PMT_AMT', name: 'Payment amount', cat: 'Balance & Limit', def: 'Actual cash payment received in reporting period.' },
    { pos: 15, code: 'CUST_NAME', name: 'Name', cat: 'Account Identification', def: 'Customer full legal title, forename, surname.' },
    { pos: 16, code: 'DOB', name: 'Date of Birth', cat: 'Account Identification', def: 'Customer DOB (YYYYMMDD format).' },
    { pos: 17, code: 'ORIG_DEF_BAL', name: 'Original Default Balance', cat: 'Default & Recovery', def: 'Outstanding balance at initial default notice date.' },
    { pos: 18, code: 'NEW_SEQ_NUM', name: 'New Sequence Number', cat: 'Account Identification', def: 'Updated joint customer sequence number.' },
    { pos: 19, code: 'SPEC_INST_FLAG', name: 'Special instruction indicator', cat: 'Special Flags', def: 'Flags for Deceased, Fraud, Forbearance, Payment Holiday.' },
    { pos: 20, code: 'EXP_BLOCK', name: 'Experian Block', cat: 'Special Flags', def: 'Experian-specific block code indicator.' },
    { pos: 21, code: 'CREDIT_PMT_IND', name: 'Credit Payment indicator', cat: 'Balance & Limit', def: 'Indicator for credit payment processing.' },
    { pos: 22, code: 'PREV_STMT_BAL', name: 'PreviousStatement Balance', cat: 'Balance & Limit', def: 'Prior month closing statement balance.' },
    { pos: 23, code: 'PREV_STMT_BAL_IND', name: 'PreviousStatement Balance Indicator', cat: 'Balance & Limit', def: 'Sign indicator (+/-) for previous statement balance.' },
    { pos: 24, code: 'NUM_CASH_ADV', name: 'Number of cash advances', cat: 'Balance & Limit', def: 'Cash advance transaction count in period.' },
    { pos: 25, code: 'VAL_CASH_ADV', name: 'Value of cash advances', cat: 'Balance & Limit', def: 'Total cash advance GBP monetary value.' },
    { pos: 26, code: 'PMT_CODE', name: 'Payment Code', cat: 'Status & Arrears', def: 'Payment method code (Direct Debit, Standing Order, Cheque).' },
    { pos: 27, code: 'PROMO_ACT_FLAG', name: 'Promotion activity Flag', cat: 'Special Flags', def: 'Promotional 0% rate flag.' },
    { pos: 28, code: 'FILLER_1', name: 'Filler 1', cat: 'Account Identification', def: 'Reserved specification filler.' },
    { pos: 29, code: 'TRANSIENT_ASSOC_FLAG', name: 'Transient Association Flag', cat: 'Special Flags', def: 'Association linkage flag.' },
    { pos: 30, code: 'AIR_TIME_FLAG', name: 'Air time Flag', cat: 'Special Flags', def: 'Telecom/airtime flag.' },
    { pos: 31, code: 'ADDR_1', name: 'Address1', cat: 'Account Identification', def: 'Residential address line 1.' },
    { pos: 32, code: 'ADDR_2', name: 'Address2', cat: 'Account Identification', def: 'Residential address line 2.' },
    { pos: 33, code: 'ADDR_3', name: 'Address3', cat: 'Account Identification', def: 'Residential address line 3.' },
    { pos: 34, code: 'ADDR_4', name: 'Address4', cat: 'Account Identification', def: 'Residential address line 4.' },
    { pos: 35, code: 'POSTCODE', name: 'Postcode', cat: 'Account Identification', def: 'Valid UK Postcode.' },
    { pos: 36, code: 'CREDIT_LIMIT', name: 'Credit Limit', cat: 'Balance & Limit', def: 'Sanctioned credit facility limit.' },
    { pos: 37, code: 'FILLER_2', name: 'Filler2', cat: 'Account Identification', def: 'Reserved specification filler.' },
    { pos: 38, code: 'TRANSFER_COLL_ACC', name: 'Transferred to collection account', cat: 'Default & Recovery', def: 'Y if assigned to Debt Collection Agency (DCA).' },
    { pos: 39, code: 'BAL_TYPE', name: 'Balance type', cat: 'Balance & Limit', def: 'D=Debt balance, C=Credit balance.' },
    { pos: 40, code: 'CREDIT_TURNOVER', name: 'Credit turnover', cat: 'Balance & Limit', def: 'Total credit turn-over applied in month.' },
    { pos: 41, code: 'PRIMARY_ACC_IND', name: 'Primary Account indicator', cat: 'Account Identification', def: 'Y=Primary account holder, N=Secondary holder.' },
    { pos: 42, code: 'DEF_SAT_DATE', name: 'Default Satisfaction date', cat: 'Default & Recovery', def: 'Date defaulted debt was fully settled (YYYYMMDD).' },
    { pos: 43, code: 'FILLER_3', name: 'Filler3', cat: 'Account Identification', def: 'Reserved specification filler.' },
    { pos: 44, code: 'NEW_ACC_NUM', name: 'New Account Number', cat: 'Account Identification', def: 'Replacement account number if re-issued.' },
  ];

  for (const item of catalogFields) {
    await prisma.caisDataItem.create({
      data: {
        itemCode: item.code,
        itemName: item.name,
        category: item.cat,
        description: `${item.name} (Position ${item.pos} in CAIS 44-field record layout)`,
        currentDefinition: item.def,
        positionInLayout: item.pos,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${catalogFields.length} CAIS 44-Field Catalog Items`);

  // 4. Seed Living Document Sections & Relational SubSections
  const sectionsMaster: any[] = MASTER_SECTIONS;

  for (const s of sectionsMaster) {
    const createdSection = await prisma.documentSection.create({
      data: {
        sectionNumber: s.sectionNumber,
        title: s.title,
        displayOrder: s.displayOrder,
        lastUpdatedById: baUser.id,
      },
    });

    for (const sub of s.subSections) {
      const blocksStr = typeof sub.contentBlocks === 'string' ? sub.contentBlocks : JSON.stringify(sub.contentBlocks || sub.blocks || []);
      const createdSub = await prisma.subSection.create({
        data: {
          documentSectionId: createdSection.id,
          heading: sub.heading,
          displayOrder: sub.displayOrder,
          contentBlocks: blocksStr,
          lastUpdatedById: baUser.id,
        },
      });

      // Create initial Version 1 snapshot
      await prisma.sectionVersion.create({
        data: {
          subSectionId: createdSub.id,
          versionNumber: 1,
          contentSnapshot: JSON.stringify({
            heading: sub.heading,
            blocks: blocksStr,
          }),
          editedById: baUser.id,
        },
      });
    }
  }

  console.log(`Seeded ${sectionsMaster.length} Living Document Sections with relational SubSections`);

  // 5. Seed Section 3 CAIS Change Register Entries (Append-only Master Change Log)
  const changesData = [
    {
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

  console.log(`Seeded ${changesData.length} Section 3 Change Register entries`);
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
