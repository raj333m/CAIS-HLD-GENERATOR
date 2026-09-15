import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  const sectionsMaster: any[] = [
  {
    "sectionNumber": "1.1",
    "title": "1.1 Business Overview and Requirements Summary",
    "displayOrder": 1,
    "subSections": [
      {
        "heading": "Credit Reference Agencies in the UK",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "In the UK, there are three main credit reference agencies: Experian, Equifax, and TransUnion (formerly known as Callcredit). Each of these CRAs has slightly different ways of collecting and presenting information. Additionally, CRAs offer various services to help financial institutions manage credit risk, such as credit monitoring and risk management tools."
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "Credit reference agencies (CRAs) collect and maintain information about businesses in addition to individuals' credit histories. The information provided by CRAs about corporate entities can include: credit accounts and outstanding debts; payment history and credit utilization; legal filings, such as bankruptcies, judgments, and liens; business registration information and ownership details; industry and business classification codes; financial data, such as revenue and number of employees; trade references and credit scores."
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "CRAs provide credit reports to lenders and other authorized parties, including corporate and institutional customers, to help them make informed credit decisions. By providing information about an individual or businesses' credit history, credit reference agencies help lenders assess creditworthiness and manage risk. For example, a lender may use a credit report to determine whether to approve a loan application, set the terms of a loan, or monitor the creditworthiness of an existing borrower."
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "All of this information is used to create a credit report that provides a snapshot of a business's creditworthiness and financial history. Corporate and institutional customers can use this information to make informed credit decisions, such as whether to approve a loan application or set the terms of a loan. In addition, CRAs may offer various services to help corporate and institutional customers manage credit risk, such as credit monitoring and risk management tools."
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "Regulatory Report carries monthly data (previous month's) to bureaus which includes Red Brand, CIIOM, FD, M&S and Harvey Nichols. All products data which are eligible to be reported are shared with the bureaus on monthly basis including Loans, Mortgages, Credit Cards, Current Accounts."
            }
          }
        ]
      },
      {
        "heading": "Purpose and Objectives of this Document",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "This document exists to provide a single, current-state High-Level Design of the CAIS monthly reporting process, covering the business requirements, the data reported, the technical approach and modelling used to produce it, and the mappings between source systems and the final regulatory output. Rather than issuing a new HLD each time a change is required \u2014 however small \u2014 this document is maintained as one continuously updated design of record: Sections 1 and 2 are edited in place whenever a change affects a requirement, a data item, a rule, or an aspect of the technical approach. Section 3 (CAIS Change Register) preserves, in full, the history of every change that has led to the current state."
            }
          }
        ]
      },
      {
        "heading": "Stakeholders and Ownership",
        "displayOrder": 4,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Delivery of the CAIS monthly reporting process is shared across a small number of named teams, each with a distinct and non-overlapping area of ownership:"
            }
          },
          {
            "type": "bullets",
            "payload": {
              "items": [
                "UK BI Data Warehouse (BI) \u2014 Retail and Cards staging, staging validation, address processing, file generation, and loading to the CAIS snapshot.",
                "Central Utility (CU) Team \u2014 exclusions file and debt-sale file supplied to BI, CADS processing, the six CU-owned calculated variables, default/recoveries treatment.",
                "Transmission Team \u2014 final delivery via Connect:Direct to Experian, Equifax, and TransUnion.",
                "Product Owner \u2014 Risk CRA \u2014 business ownership and joint final sign-off.",
                "Business Analyst \u2014 translation of requirements into this design and impact assessment of each change."
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "1.2",
    "title": "1.2 Data Requirements",
    "displayOrder": 2,
    "subSections": [
      {
        "heading": "Core Data Categories and Record Layout",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "The CAIS submission is built from a fixed, 44-field record layout common across the brands and products in scope (full layout in Section 2.5). Broadly the fields fall into: account/customer identification; balance and limit data; status and arrears data; default and recovery data; and a small number of derived/calculated fields produced specifically for CRA reporting."
            }
          }
        ]
      },
      {
        "heading": "Source Systems Feeding CRA",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Source systems feeding CRA (CAIS File Submission for Retail Banking): CDU, PLM, BDRAS, OHC, RMS, BCDU."
            }
          }
        ]
      },
      {
        "heading": "CU Team-Owned Variables and Reporting Cadence Facts",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "CAIS File delivery for Retail is a joint effort from UKBIDWH and CU Team. Dependency lies with CU Team for 6 variables' data."
            }
          },
          {
            "type": "bullets",
            "payload": {
              "items": [
                "Current Balance",
                "Account Status",
                "Flag Settings",
                "Monthly Payment",
                "Repayment Period",
                "Payment Frequency"
              ]
            }
          },
          {
            "type": "table",
            "payload": {
              "headers": [
                "Cadence / System Fact",
                "Value"
              ],
              "rows": [
                [
                  "CRA Staging Data Mart for CAIS File (Retail Banking)",
                  "DWH_PDS_STAG (Monthly Data Truncate/Insert)"
                ],
                [
                  "CRA Staging Jobs Execution",
                  "01st of every month"
                ],
                [
                  "CADS Processing Table (Retail Banking)",
                  "DWH_IP_ARRG_CALC_V"
                ],
                [
                  "CU Status Execution (Start Date)",
                  "06th or 07th of every month"
                ],
                [
                  "CRA Final Data Mart for CAIS File (Retail Banking)",
                  "DWH_CAIS_SMRY_SNAP"
                ],
                [
                  "CRA Validation Table (Retail Banking)",
                  "DWH_CAIS_EXCEPTION"
                ],
                [
                  "Reporting Frequency",
                  "Monthly"
                ],
                [
                  "Bureau File Sharing Timelines (TU, Experian and Equifax)",
                  "Mid-Month Tentatively"
                ]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "1.3",
    "title": "1.3 Data Analysis",
    "displayOrder": 3,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "This section documents, brand by brand, the eligibility, inclusion and exclusion logic that determines which accounts and data items are permitted into the CRA staging tables and, ultimately, the monthly CAIS extract \u2014 maintained at brand-specific granularity because HSBC, First Direct and M&S have each arrived at distinct commercial/regulatory arrangements with the bureaus."
            }
          }
        ]
      },
      {
        "heading": "All Brands (Exclusion Rule)",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Deletes records from DWH_PDS_STAG where ARRG_ID matches any arrangement in DWH_CAIS_SMRY_SNAP that meets all the following conditions:"
            }
          },
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Closure & Default Logic",
                  "condition": "Summary period end date is on or after '2025-11-30'.",
                  "keyFields": "Summary Period End Date"
                },
                {
                  "num": 2,
                  "category": "Data Integrity / Null Check",
                  "condition": "Account status code is '0'.",
                  "keyFields": "Account Status Code"
                },
                {
                  "num": 3,
                  "category": "Indicator Check",
                  "condition": "Account indicator setting is 'P'.",
                  "keyFields": "Account Indicator"
                },
                {
                  "num": 4,
                  "category": "Data Integrity / Null Check",
                  "condition": "Original default balance is less than 100.",
                  "keyFields": "Original Default Balance"
                },
                {
                  "num": 5,
                  "category": "Closure & Default Logic",
                  "condition": "Arrangement relation end date is present, not '9999-12-31', and not '0001-01-01'.",
                  "keyFields": "Arrangement Relation End Date"
                },
                {
                  "num": 6,
                  "category": "Eligibility & Product Scope",
                  "condition": "Products belong to 0, 2, 3, 4, 5, 6, 15, 16, 19, 25, 26.",
                  "keyFields": "Product Code"
                }
              ]
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "For low balance default accounts (original default balance is less than 100 pounds), once the account is partially settled with account closed having valid account closure date along with status 0, then it's not allowed to report further."
            }
          }
        ]
      },
      {
        "heading": "For HSBC Credit and Charge Cards (Exclusion Rule)",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Deletes card records from DWH_PDS_STAG where ARRG_ID matches any arrangement in DWH_CAIS_SMRY_SNAP that is default satisfied in the previous month, specifically:"
            }
          },
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Data Integrity / Null Check",
                  "condition": "When current balance is 0.",
                  "keyFields": "Current Balance"
                },
                {
                  "num": 2,
                  "category": "Indicator Check",
                  "condition": "When account status code is '8'.",
                  "keyFields": "Account Status Code"
                },
                {
                  "num": 3,
                  "category": "Closure & Default Logic",
                  "condition": "When default satisfaction date is not null and not '9999-12-31'.",
                  "keyFields": "Default Satisfaction Date"
                }
              ]
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "In other words, default and settled accounts are not allowed to enter the staging table.\n\nAccounts are excluded at data stage level when the accounts being default and default satisfied in the same month for the first time while entering the CRA final data mart. In other words, default and default satisfied accounts are not allowed to report to the bureaus."
            }
          }
        ]
      },
      {
        "heading": "HSBC Cards (Brand Code 51)",
        "displayOrder": 4,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years, or the start date should be before 01st June 2005 for getting reported to bureaus.",
                  "keyFields": "Customer Age, Start Date"
                },
                {
                  "num": 3,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Virtual Cards are not reported.",
                  "keyFields": "Card Type"
                },
                {
                  "num": 4,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Secondary Cards are not reported.",
                  "keyFields": "Card Type"
                },
                {
                  "num": 5,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Cards Organization Code 900 and 700 are not reported.",
                  "keyFields": "Cards Organization Code"
                },
                {
                  "num": 6,
                  "category": "Indicator Check",
                  "condition": "Primary Cards Indicator CRA_CDE inclusive of (0 non-defaulters, 1 Collections, 2 Recoveries) are reported whereas X are not reported to the bureaus.",
                  "keyFields": "Primary Cards Indicator (CRA_CDE)"
                },
                {
                  "num": 7,
                  "category": "Data Integrity / Null Check",
                  "condition": "Account number cannot be shared to the bureaus as null value.",
                  "keyFields": "Account Number"
                },
                {
                  "num": 8,
                  "category": "Indicator Check",
                  "condition": "Positive data sharing indicator should be set as Y for reporting or else Positive Data Sharing Indicator should not be set as N and account opening date should be after 30th November 2001 for data reporting.",
                  "keyFields": "Positive Data Sharing Indicator, Account Opening Date"
                },
                {
                  "num": 9,
                  "category": "Closure & Default Logic",
                  "condition": "For Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date refers to the write off date which should be valid (not null) and before the reporting date and should fall in the reporting month for reporting to bureaus OR for Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date follows the 6 years logic for default reporting \u2014 default card holder account continues to get reported to the bureaus for 71 months from the account closure date.",
                  "keyFields": "Account Closure Date, CRA_CDE"
                },
                {
                  "num": 10,
                  "category": "Closure & Default Logic",
                  "condition": "For Non Default accounts (CRA_CDE = 0), when the current balance becomes 0 and eligible closure block codes are applied ('D','K','P','E','Z','F','L','R','O','B') in block code 1 or block code 2, then it extracts the most recent date amongst block 1 date, block 2 date, gross active last date and AMBS last activity date which should fall in the reporting month period for data reporting to bureaus, or else there should be a non-zero outstanding balance for data reporting.",
                  "keyFields": "Current Balance, Closure Block Codes, Block/Activity Dates"
                },
                {
                  "num": 11,
                  "category": "Eligibility & Product Scope",
                  "condition": "Charge cards (Product Code 6) and credit cards (Product Code 5) are the only specific products falling under brand code 51 (HSBC Cards).",
                  "keyFields": "Product Code"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "First Direct Cards (Brand Code 211)",
        "displayOrder": 5,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years, or the start date should be before 01st June 2005 for getting reported to bureaus.",
                  "keyFields": "Customer Age, Start Date"
                },
                {
                  "num": 3,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Virtual Cards are not reported.",
                  "keyFields": "Card Type"
                },
                {
                  "num": 4,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Secondary Cards are not reported.",
                  "keyFields": "Card Type"
                },
                {
                  "num": 5,
                  "category": "Card/Account Type Exclusion",
                  "condition": "Cards organization Code 900 is only reported (First Direct).",
                  "keyFields": "Cards Organization Code"
                },
                {
                  "num": 6,
                  "category": "Indicator Check",
                  "condition": "Primary Cards Indicator CRA_CDE inclusive of (0 non-defaulters, 1 Collections, 2 Recoveries) are reported whereas X are not reported to the bureaus.",
                  "keyFields": "Primary Cards Indicator (CRA_CDE)"
                },
                {
                  "num": 7,
                  "category": "Data Integrity / Null Check",
                  "condition": "Account number cannot be shared to the bureaus as null value.",
                  "keyFields": "Account Number"
                },
                {
                  "num": 8,
                  "category": "Indicator Check",
                  "condition": "Positive data sharing indicators should be set as Y or blank for data reporting.",
                  "keyFields": "Positive Data Sharing Indicator"
                },
                {
                  "num": 9,
                  "category": "Data Integrity / Null Check",
                  "condition": "TSS_CUST_ID (DWH_IP_XREF Table) cannot be null, it should have non null value too for data reporting.",
                  "keyFields": "TSS_CUST_ID"
                },
                {
                  "num": 10,
                  "category": "Closure & Default Logic",
                  "condition": "For Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date refers to the last delinquent date which should be valid (not null) and should fall in the reporting month for reporting to bureaus OR for Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date follows the 6 years logic for default reporting \u2014 default card holder account continues to get reported to the bureaus for 71 months from the account closure date.",
                  "keyFields": "Account Closure Date"
                },
                {
                  "num": 11,
                  "category": "Closure & Default Logic",
                  "condition": "For Non Default accounts (CRA_CDE = 0), when the current balance becomes 0 and eligible closure block codes are applied ('D','K','P','E','Z','F','L','R','O','B') in block code 1 or block code 2, then it extracts the most recent date amongst block 1 date, block 2 date, gross active last date and AMBS last activity date which should fall in the reporting month period for data reporting to bureaus, or else there should be a non-zero outstanding balance for data reporting.",
                  "keyFields": "Closure Block Code, Block/Activity Dates"
                },
                {
                  "num": 12,
                  "category": "Eligibility & Product Scope",
                  "condition": "Charge cards (6) and credit cards (5) are the only specific products falling under brand code 51 (HSBC Cards). [Verbatim source note: Source page references brand code 51 under First Direct Cards heading]",
                  "keyFields": "Product Code"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "First Direct Retail (Brand Code 211)",
        "displayOrder": 6,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Ownership & Customer Mapping",
                  "condition": "Customer accounts needs to be mapped with the primary account owners associated to account (in other words, customer fully owns the account).",
                  "keyFields": "Primary Account Owner"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 3,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product relation end date should be either '0001-01-01' or null or it should be greater than the reporting date.",
                  "keyFields": "Product Relation End Date"
                },
                {
                  "num": 4,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years for getting reported to bureaus.",
                  "keyFields": "Customer Age"
                },
                {
                  "num": 5,
                  "category": "Indicator Check",
                  "condition": "OWN_GRP_TYCD (DWH_ARRG_XREF table) = \"FD\" OR OWN_GRP_TYCD (DWH_ARRG_XREF table) is not blank.",
                  "keyFields": "OWN_GRP_TYCD"
                },
                {
                  "num": 6,
                  "category": "Data Integrity / Null Check",
                  "condition": "TSS_CUST_ID (DWH_IP_XREF table) should not be null.",
                  "keyFields": "TSS_CUST_ID"
                },
                {
                  "num": 7,
                  "category": "Indicator Check",
                  "condition": "For all accounts, Positive data sharing indicator should not be set as \"Y\" for data reporting.\nOR For non-default accounts, if Positive data sharing indicator is set as <> \"N\" and Temporary scheme for initial positive data load is set 'Y', and if the account is closed then it should have closed within the reporting period, or else if the account is declared as \"Fraud\" \u2014 if compliant with condition, then the account will get reported, else drop the account.\nELSE IF For default accounts, it should be reported to the bureaus for 71 months from the account closure date irrespective of the positive data sharing indicator value.",
                  "keyFields": "Positive Data Sharing Indicator"
                },
                {
                  "num": 8,
                  "category": "Data Integrity / Null Check",
                  "condition": "RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null.",
                  "keyFields": "RPS_ACCT_ID_14"
                },
                {
                  "num": 9,
                  "category": "Data Integrity / Null Check",
                  "condition": "Product classification cannot be null, or BDRAS date of default cannot be null, or if the account belongs to First Direct Everyday Saving Account and the account is in collections.",
                  "keyFields": "Product Classification, BDRAS Date of Default"
                },
                {
                  "num": 10,
                  "category": "Closure & Default Logic",
                  "condition": "Default accounts which are settled with no outstanding balance and valid default satisfaction date are not produced again in snap reporting, with exception of them being reported as Debt Sale records with Delete marker.",
                  "keyFields": "Default Satisfaction Date, Outstanding Balance"
                },
                {
                  "num": 11,
                  "category": "Product Range Included",
                  "condition": "Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts get populated under First Direct Retail portfolio.",
                  "keyFields": "Product Type"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "M&S Loans (Brand Code 947)",
        "displayOrder": 7,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Ownership & Customer Mapping",
                  "condition": "Customer accounts need to be mapped with the primary account owners associated with accounts (in other words, customer fully owns the account).",
                  "keyFields": "Primary Account Owner"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 3,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years for getting reported to bureaus.",
                  "keyFields": "Customer Age"
                },
                {
                  "num": 4,
                  "category": "Indicator Check",
                  "condition": "Own Institution (OWN_INSTT = 1) indicator should be set up as 1 for identifying M&S customers in DWH_CUST Table.",
                  "keyFields": "OWN_INSTT"
                },
                {
                  "num": 5,
                  "category": "Closure & Default Logic",
                  "condition": "For a non-default account: Positive data sharing indicator should not be set as \"N\", and if the account is closed then it should have closed in the reporting month, OR if it is a default account then it should get reported for ~6 years (71 months).",
                  "keyFields": "Positive Data Sharing Indicator, Closure Date"
                },
                {
                  "num": 6,
                  "category": "Data Integrity / Null Check",
                  "condition": "RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null.",
                  "keyFields": "RPS_ACCT_ID_14"
                },
                {
                  "num": 7,
                  "category": "Product Range Included",
                  "condition": "Personal Loans and Debt Consolidated Loans are the specific products reported under PDS1 product hierarchy.",
                  "keyFields": "Product Type"
                },
                {
                  "num": 8,
                  "category": "Eligibility & Product Scope",
                  "condition": "PDS1 product hierarchy is not designed for mortgages, basic bank accounts and current accounts.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 9,
                  "category": "Data Integrity / Null Check",
                  "condition": "Product classification cannot be null, or BDRAS date of default cannot be null.",
                  "keyFields": "Product Classification, BDRAS Date of Default"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "M&S Current Accounts (Brand Code 662)",
        "displayOrder": 8,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Ownership & Customer Mapping",
                  "condition": "Customer accounts need to be mapped with the primary account owners associated with it (in other words, customer fully owns the account).",
                  "keyFields": "Primary Account Owner"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as Gleam (937) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 3,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years for getting reported to bureaus.",
                  "keyFields": "Customer Age"
                },
                {
                  "num": 4,
                  "category": "Indicator Check",
                  "condition": "Own Institution (OWN_INSTT = 1) indicator should be set up as 1 for identifying M&S customers in DWH_CUST Table.",
                  "keyFields": "OWN_INSTT"
                },
                {
                  "num": 5,
                  "category": "Closure & Default Logic",
                  "condition": "For a non-default account: Positive data sharing indicator should not be set as \"N\", and if the account is closed then it should have closed in the reporting month, OR if it is a default account then it should get reported for ~6 years (71 months).",
                  "keyFields": "Positive Data Sharing Indicator, Closure Date"
                },
                {
                  "num": 6,
                  "category": "Data Integrity / Null Check",
                  "condition": "RPS_ACCT_ID_14 should not be null.",
                  "keyFields": "RPS_ACCT_ID_14"
                },
                {
                  "num": 7,
                  "category": "Product Range Included",
                  "condition": "Product category is inclusive of MC and MI.",
                  "keyFields": "Product Category"
                },
                {
                  "num": 8,
                  "category": "Eligibility & Product Scope",
                  "condition": "Current accounts are the only product reported under Gleam product hierarchy.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 9,
                  "category": "Data Integrity / Null Check",
                  "condition": "Product classification cannot be null, or BDRAS date of default cannot be null.",
                  "keyFields": "Product Classification, BDRAS Date of Default"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "HSBC Retail (Brand Code 85)",
        "displayOrder": 9,
        "blocks": [
          {
            "type": "rule-table",
            "payload": {
              "rows": [
                {
                  "num": 1,
                  "category": "Ownership & Customer Mapping",
                  "condition": "Customer accounts need to be mapped with the primary account owners associated with accounts (in other words, customer fully owns the account).",
                  "keyFields": "Primary Account Owner"
                },
                {
                  "num": 2,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.",
                  "keyFields": "Product Hierarchy"
                },
                {
                  "num": 3,
                  "category": "Eligibility & Product Scope",
                  "condition": "Product relation end date should be either '0001-01-01' or null or it should be greater than the reporting date.",
                  "keyFields": "Product Relation End Date"
                },
                {
                  "num": 4,
                  "category": "Eligibility & Product Scope",
                  "condition": "Customer age should be at least 18 years for getting reported to bureaus.",
                  "keyFields": "Customer Age"
                },
                {
                  "num": 5,
                  "category": "Indicator Check",
                  "condition": "Own Institution (OWN_INSTT <> 1) indicator, and OWN_GRP_TYCD (DWH_ARRG_XREF table) <> \"FD\" OR OWN_GRP_TYCD (DWH_ARRG_XREF table) is not blank.",
                  "keyFields": "OWN_INSTT, OWN_GRP_TYCD"
                },
                {
                  "num": 6,
                  "category": "Data Integrity / Null Check",
                  "condition": "TSS_CUST_ID (DWH_IP_XREF table) should be null.",
                  "keyFields": "TSS_CUST_ID"
                },
                {
                  "num": 7,
                  "category": "Indicator Check",
                  "condition": "For all accounts, Positive data sharing indicator should not be set as \"Y\" for data reporting.\nOR For non-default accounts, if Positive data sharing indicator is set as <> \"N\", and for mortgages and second mortgages products the account opening date should be greater than 15th September 2003 \u2014 for all other products the account opening date should be greater than 29th November 2002. If the account is closed then it should have closed within the reporting period; if compliant with condition, then the account will get reported, else drop the account.\nELSE IF For default accounts, it should be reported to the bureaus for 71 months from the account closure date irrespective of the positive data sharing indicator value.",
                  "keyFields": "Positive Data Sharing Indicator, Account Opening Date"
                },
                {
                  "num": 8,
                  "category": "Data Integrity / Null Check",
                  "condition": "RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null.",
                  "keyFields": "RPS_ACCT_ID_14"
                },
                {
                  "num": 9,
                  "category": "Data Integrity / Null Check",
                  "condition": "Product classification cannot be null, or BDRAS date of default cannot be null.",
                  "keyFields": "Product Classification, BDRAS Date of Default"
                },
                {
                  "num": 10,
                  "category": "Closure & Default Logic",
                  "condition": "Default accounts which are settled with no outstanding balance and valid default satisfaction date are not produced again in snap reporting, with exception of them being reported as Debt Sale records with Delete marker.",
                  "keyFields": "Default Satisfaction Date, Outstanding Balance"
                },
                {
                  "num": 11,
                  "category": "Product Range Included",
                  "condition": "Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts and Basic Bank Accounts get populated under HSBC Retail portfolio.",
                  "keyFields": "Product Type"
                }
              ]
            }
          }
        ]
      },
      {
        "heading": "Supported Products for CRA Data Reporting (Retail Banking)",
        "displayOrder": 10,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "PDS (Product Code)",
                "Description"
              ],
              "rows": [
                [
                  "02",
                  "Unsecured Loan"
                ],
                [
                  "03",
                  "Mortgage"
                ],
                [
                  "04",
                  "Revolving Account"
                ],
                [
                  "05",
                  "Credit Card"
                ],
                [
                  "06",
                  "Charge Card"
                ],
                [
                  "15",
                  "Current Account"
                ],
                [
                  "16",
                  "Second Mortgage"
                ],
                [
                  "19",
                  "Fixed Term Deferred Payment"
                ],
                [
                  "25",
                  "Flexible Mortgage"
                ],
                [
                  "26",
                  "Debt Consolidated Loan"
                ],
                [
                  "71",
                  "Basic Bank Account"
                ]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "1.4",
    "title": "1.4 SOX Impacts",
    "displayOrder": 4,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "No Impact on CAIS Reporting"
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "1.5",
    "title": "1.5 Analysis Risks and Assumptions",
    "displayOrder": 5,
    "subSections": [
      {
        "heading": "Assumptions",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "bullets",
            "payload": {
              "items": [
                "Bureau file formats, cut-offs, and delivery mechanisms reflect what is currently agreed and may be superseded by a bureau-initiated change at any time.",
                "Upstream core systems (CDU, PLM, BDRAS, OHC, RMS, BCDU) remain available on current monthly batch schedules.",
                "Brand-specific rules reflect current commercial/regulatory arrangements and are assumed stable unless a change is logged in Section 3."
              ]
            }
          }
        ]
      },
      {
        "heading": "Risks",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Risk Description",
                "Business Impact",
                "Mitigation & Owner"
              ],
              "rows": [
                [
                  "Bureau implementing a change on a different timeline",
                  "Inconsistent reporting across Experian, Equifax, and TransUnion",
                  "Track bureau-specific target dates per Change Register entry and execute phased rollouts. Owner: Bureau Relationship Lead"
                ],
                [
                  "Gap in brand-specific exclusion rules",
                  "Mis-reporting of accounts leading to consumer detriment or regulatory audit query",
                  "Section 1.4 validation and volume reconciliation controls. Owner: Lead BA (Aishwarya Raj Singh)"
                ],
                [
                  "Regulatory deadline missed due to slippage",
                  "Non-compliance with CAIS guidelines and CRA reporting penalties",
                  "Track Target Implementation Month per change and escalate via Operational Support. Owner: Product Owner Risk CRA"
                ]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.1",
    "title": "2.1 Approach Summary and Overview Diagram",
    "displayOrder": 6,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "The CAIS extract is produced by a fifteen-step pipeline taking raw Retail and Cards data through staging, exclusion/debt-sale treatment, validation, core calculation processing, snapshot loading, final sign-off, and transmission \u2014 staged deliberately so each team's contribution is a discrete, auditable step."
            }
          }
        ]
      },
      {
        "heading": "Conceptual Data Flow",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "diagram",
            "payload": {
              "imageKey": "conceptual",
              "caption": "Figure 2.1(a) — Conceptual Data Flow Diagram: the fifteen-step CAIS extract pipeline from Retail/Cards staging through to bureau transmission."
            }
          },
          {
            "type": "brand-flow",
            "payload": {
              "brand": "hsbc",
              "title": "Figure 2.1(b) — HSBC Design Overview",
              "caption": "Figure 2.1(b) — HSBC Design Overview: complete 15-step pipeline for HSBC Cards (Brand 51) and HSBC Retail (Brand 85), including brand-specific exclusion rules and debt sale file processing.",
              "escalationInfo": "Validation escalations routed to BI Support or CU Team Data Quality.",
              "steps": [
                { "num": "1-2", "name": "Retail & Cards Source Staging", "owner": "BI", "desc": "Load DWH staging datasets for HSBC Retail & Cards." },
                { "num": "3", "name": "HSBC Exclusions Applied", "owner": "CU Team", "desc": "Apply HSBC-specific exclusion files (Virtual/Secondary Cards, Brand 51/85 rules)." },
                { "num": "4", "name": "Debt Sale Treatment", "owner": "CU Team", "desc": "Apply debt sale files & Delete markers for sold accounts." },
                { "num": "5-6", "name": "Staging Validation & Address Processing", "owner": "BI", "desc": "Execute staging completeness checks & address standardization." },
                { "num": "7-9", "name": "DWH_PDS_STAG Core Load & CADS Processing", "owner": "BI & CU Team", "desc": "Populate DWH_PDS_STAG, run CADS, and update DWH_IP_ARRG_CALC_V." },
                { "num": "10-12", "name": "File Creation & CAIS Snapshot Load", "owner": "BI", "desc": "Generate CRA extract files & load Retail/Cards snapshot tables." },
                { "num": "13-14", "name": "Business Rules Validation & Ad-hoc Processing", "owner": "BI & CU Team", "desc": "Joint end-to-end validation. Ad-hoc patch runs available if required." },
                { "num": "15", "name": "File Transmission to CRAs", "owner": "Transmission Team", "desc": "Push extract files to Connect:Direct server for bureau delivery." }
              ]
            }
          },
          {
            "type": "brand-flow",
            "payload": {
              "brand": "first_direct",
              "title": "Figure 2.1(c) — First Direct Design Overview",
              "caption": "Figure 2.1(c) — First Direct Design Overview: 15-step pipeline for First Direct Cards and Retail (Brand 211), including FD exclusion rules, debt sale files, and senior-level sign-off gate.",
              "escalationInfo": "Validation escalations routed to BI Support or CU Team Data Quality.",
              "signoffRequired": true,
              "steps": [
                { "num": "1-2", "name": "Retail & Cards Source Staging", "owner": "BI", "desc": "Load DWH staging datasets for First Direct (Brand 211)." },
                { "num": "3", "name": "First Direct Exclusions Applied", "owner": "CU Team", "desc": "Apply FD exclusion file (Positive data sharing flags & TSS_CUST_ID checks)." },
                { "num": "4", "name": "Debt Sale Treatment", "owner": "CU Team", "desc": "Apply FD debt sale file & Delete marker rules." },
                { "num": "5-6", "name": "Staging Validation & Address Processing", "owner": "BI", "desc": "Execute staging completeness checks & address standardization." },
                { "num": "7-9", "name": "DWH_PDS_STAG Core Load & CADS Processing", "owner": "BI & CU Team", "desc": "Populate DWH_PDS_STAG, run CADS, and update DWH_IP_ARRG_CALC_V." },
                { "num": "10-12", "name": "File Creation & CAIS Snapshot Load", "owner": "BI", "desc": "Generate CRA extract files & load Retail/Cards snapshot tables." },
                { "num": "13", "name": "Business Rules Validation", "owner": "BI & CU Team", "desc": "Joint validation by Product Owner (Risk CRA) & CU Team." },
                { "num": "14", "name": "Ad-hoc Rerun / Patch Processing", "owner": "BI / CU Team", "desc": "Post-validation ad-hoc file generation (available when required)." },
                { "num": "14.5", "name": "Senior-Level Sign-Off Gate", "owner": "Senior Reviewer / Lead", "desc": "Mandatory senior governance sign-off required prior to CRA release." },
                { "num": "15", "name": "File Transmission to CRAs", "owner": "Transmission Team", "desc": "Push extract files to Connect:Direct server for bureau delivery." }
              ]
            }
          },
          {
            "type": "brand-flow",
            "payload": {
              "brand": "ms_current_account",
              "title": "Figure 2.1(d) — M&S Bank Current Account Design Overview",
              "caption": "Figure 2.1(d) — M&S Bank Current Account Design Overview: streamlined pipeline for M&S Current Accounts (Brand 662 / Gleam 937), omitting Exclusions and Debt Sale steps.",
              "escalationInfo": "Validation escalations routed to BI Support or CU Team Data Quality.",
              "isDistinctProcess": true,
              "supportingNote": "Note on Staging Variables: On M&S Bank Current Account staging data, the CRA_ACCT_TYCD variable takes the value 02 for Personal Loans and 26 for Debt Consolidated Loans (DCLs), consistent with Product Code 02 (Unsecured Loan) and 26 (Debt Consolidated Loan) in the Supported Products table.",
              "steps": [
                { "num": "1-2", "name": "M&S Current Account Staging", "owner": "BI", "desc": "Load Gleam (937) staging dataset for M&S Current Accounts (Brand 662)." },
                { "num": "—", "name": "Exclusions Step Omitted", "owner": "N/A", "desc": "No exclusions file in place for M&S Current Account brand." },
                { "num": "—", "name": "Debt Sale Step Omitted", "owner": "N/A", "desc": "No debt sale file in place for M&S Current Account brand." },
                { "num": "5-6", "name": "Staging Validation & Address Processing", "owner": "BI", "desc": "Execute staging completeness checks & address standardization." },
                { "num": "7-9", "name": "DWH_PDS_STAG Core Load & CADS Processing", "owner": "BI & CU Team", "desc": "Populate DWH_PDS_STAG, run CADS, and update DWH_IP_ARRG_CALC_V." },
                { "num": "10-12", "name": "File Creation & CAIS Snapshot Load", "owner": "BI", "desc": "Generate CRA extract files & load snapshot table." },
                { "num": "13-14", "name": "Business Rules Validation & Ad-hoc Potential", "owner": "BI & CU Team", "desc": "Joint validation. Ad-hoc processing available (unused to date)." },
                { "num": "15", "name": "File Transmission to CRAs", "owner": "Transmission Team", "desc": "Push extract files to Connect:Direct server for bureau delivery." }
              ]
            }
          },
          {
            "type": "comparison-table",
            "payload": {
              "title": "Figure 2.1(e) — Cross-Brand Process Differences",
              "caption": "Figure 2.1(e) — Cross-Brand Process Differences: summary of pipeline variations across HSBC, M&S Bank Current Account, and First Direct.",
              "headers": ["Dimension", "HSBC Card & Retail", "M&S Bank Current Account", "First Direct"],
              "rows": [
                ["BI Steps", "Standard BI step count with brand-specific control jobs", "Standard BI step count with M&S-specific control jobs", "Standard BI step count with brand-specific control jobs"],
                ["Exclusion Files", "Brand-specific exclusion file applied", "No exclusions file in place for this brand", "Exclusion file applied, differs by brand"],
                ["Debt Sale Files", "Debt sale file applied (CU Team)", "No debt sale file in place for this brand", "Debt sale file applied (CU Team)"],
                ["CADS Steps", "CU Team-owned CADS processing", "CU Team-owned CADS processing", "CU Team-owned CADS processing"],
                ["Basic Data Validation", "Performed, escalation via generic team-level validation contacts", "Performed, escalation via generic team-level validation contacts", "Performed, escalation via generic team-level validation contacts"],
                ["Potential for Ad-hoc File Processing", "Available, post-validation, when used", "Available, but not yet used to date", "Available, post-validation, when used"],
                ["Sign-off", "No formal sign-off step currently in place", "No formal sign-off step currently in place", "Senior-level sign-off required"]
              ]
            }
          }
        ]
      },
      {
        "heading": "Detailed Process Steps (Description, Dependency, Output, Owner)",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Step Name",
                "Description",
                "Dependency",
                "Output",
                "Owner"
              ],
              "rows": [
                [
                  "Step 1 \u2014 Retail Staging Table (Input preparation)",
                  "Load/prepare retail staging dataset from upstream DWH/source feeds.",
                  "Upstream DWH / Source feeds",
                  "Retail staging table ready for downstream exclusion and validation steps.",
                  "BI"
                ],
                [
                  "Step 2 \u2014 Cards Staging Table (Input preparation)",
                  "Load/prepare Cards staging dataset from upstream DWH/source feeds.",
                  "Upstream DWH / Source feeds",
                  "Cards staging table ready for downstream exclusion and validation steps.",
                  "BI"
                ],
                [
                  "Step 3 \u2014 Exclusions",
                  "Apply exclusion rules (e.g., products/accounts not eligible for bureau reporting, policy-driven removals).",
                  "Requires Retail/Cards staging prepared.",
                  "Exclusion-adjusted datasets.",
                  "CU team shares the exclusion file with BI."
                ],
                [
                  "Step 4 \u2014 Debt Sale",
                  "Apply debt sale identification/treatment rules to ensure correct reporting of sold debts.",
                  "Executes after exclusions.",
                  "Dataset updated to reflect debt sale logic.",
                  "CU team shares the debt sale file with BI."
                ],
                [
                  "Step 5 \u2014 Staging Table Validation",
                  "Run validation checks on staging outputs (completeness, formats, key fields, reconciliation controls).",
                  "After exclusions and debt sale.",
                  "Validated staging dataset and/or exception reports.",
                  "BI"
                ],
                [
                  "Step 6 \u2014 Address Processing",
                  "Standardize and/or validate address-related fields used for bureau reporting.",
                  "Triggered from staging validation step.",
                  "Address-enriched dataset for downstream reporting.",
                  "BI"
                ],
                [
                  "Core Processing (SAS block) \u2014 Data Loaded to DWH_PDS_STAG for CADS",
                  "Load validated/transformed data into DWH_PDS_STAG (CRA Staging Table) which becomes the base for subsequent processing.",
                  "Staging validation complete.",
                  "DWH_PDS_STAG populated for the processing month.",
                  "BI"
                ],
                [
                  "CADS Processing",
                  "Execute CADS processing logic using DWH_PDS_STAG as the base.",
                  "DWH_PDS_STAG loaded.",
                  "CADS-derived outputs used downstream.",
                  "CU Team"
                ],
                [
                  "Update DWH_IP_ARRG_CALC_V",
                  "Update calculation view/table DWH_IP_ARRG_CALC_V (includes CRA-relevant calculated variables).",
                  "Inputs from staging/CADS outputs.",
                  "Updated DWH_IP_ARRG_CALC_V for the month.",
                  "CU team runs SAS datasets to populate the DWH_IP_ARRG_CALC_V table."
                ],
                [
                  "File Creation and Loading to CAIS Final Data Mart \u2014 Create File from DWH_IP_ARRG_CALC_V",
                  "Generate CRA extract file(s) based on the updated DWH_IP_ARRG_CALC_V.",
                  "DWH_IP_ARRG_CALC_V updated.",
                  "Intermediate CRA/CAIS-format file(s).",
                  "BI (file generation job)"
                ],
                [
                  "Load CARDS data to CAIS Snap-Shot",
                  "Load Cards-specific output into the CAIS snapshot structure.",
                  "Cards extract file ready.",
                  "CAIS snapshot populated with Cards.",
                  "BI"
                ],
                [
                  "Load RETAIL data to CAIS Snap-Shot",
                  "Load Retail-specific output into the CAIS snapshot structure.",
                  "Retail extract file ready.",
                  "CAIS snapshot populated for Retail.",
                  "BI"
                ],
                [
                  "Business Rules Validations",
                  "Perform final end-to-end validations prior to submission.",
                  "Staging and snapshot loads complete.",
                  "Validation sign-off or exception list for remediation.",
                  "BI & CU Team"
                ],
                [
                  "Ad-hoc File Processing (if required)",
                  "Non-standard intervention step used only when required (e.g., reruns, fixes for data issues, regeneration due to late changes).",
                  "Exceptions identified in validations or business sign-off requirements.",
                  "Regenerated or patched CRA file.",
                  "BI / CU Team"
                ],
                [
                  "File Transmitted to CRAs",
                  "Final files transmitted to bureaus/CRAs via the Transmission route.",
                  "BI pushes files to the Transmission team server.",
                  "Files delivered to CRAs via Connect:Direct.",
                  "Transmission team (with BI providing the files)"
                ]
              ]
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "Validation Rules (Business Rules) are applied on the data at the end, post all data load jobs of staging and snap being executed, from a BI perspective, so that the data shared with bureaus is as per business acceptability standards. These rules are applied on the CRA final data mart. Final validation on data volume, and for all exceptions, is carried out jointly by the Product Owner (Risk CRA) and the CU team. Any unusual variation/hike in the data found (if any) would allow for investigation from BI and CU side. The reasons for unusual data behavior would be analyzed and then concluded accordingly."
            }
          },
          {
            "type": "paragraph",
            "payload": {
              "text": "BI Team does not directly send the file to bureaus; rather, files are routed to bureaus via Connect:Direct (the Transmission team's server) \u2014 the BI team places/pushes the file onto the Transmission team's server, after which it is sent to bureaus via the UK Transmission team."
            }
          }
        ]
      },
      {
        "heading": "Operational Support / Escalation",
        "displayOrder": 4,
        "blocks": [
          {
            "type": "bullets",
            "payload": {
              "items": [
                "BI data issues are escalated via a monitored BI support mailbox.",
                "CU data quality issues are escalated via a separate monitored CU data-quality mailbox.",
                "Both mailboxes are monitored daily."
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.2",
    "title": "2.2 Logical Modelling",
    "displayOrder": 7,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "The logical model describes core business entities independently of physical implementation, giving a shared vocabulary for discussing changes before physical tables are identified."
            }
          }
        ]
      },
      {
        "heading": "Core Logical Entities",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Entity Name",
                "Logical Description & Scope"
              ],
              "rows": [
                [
                  "Customer",
                  "Legal entity (Individual or Business) holding credit agreements; carries name, DOB, address history."
                ],
                [
                  "Account / Arrangement",
                  "Individual credit facility instance (Loan, Card, Overdraft, Mortgage) subject to monthly reporting."
                ],
                [
                  "Product",
                  "Classification mapping internal codes to CAIS product type code (02, 05, 15, etc.)."
                ],
                [
                  "Brand",
                  "Portfolio brand owner (HSBC Cards 51, HSBC Retail 85, First Direct 211, M&S Loans 947, M&S Current 662)."
                ],
                [
                  "Calculated Variable",
                  "Derived metrics produced specifically for CRA reporting by CU team (Balance, Status, Payment, Term, Frequency, Flags)."
                ],
                [
                  "Exclusion / Debt Sale Event",
                  "Event triggering suppression or debt collection marker assignment."
                ],
                [
                  "CAIS Extract Record",
                  "The standardized 44-field fixed-width record produced for each bureau."
                ],
                [
                  "Change",
                  "A logged regulatory or business amendment affecting requirements, rules, or schemas."
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "Key Relationships",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "A Customer may hold one or more Accounts/Arrangements; each Account/Arrangement is classified by exactly one Product, which determines Brand and applicable rules; an Account/Arrangement may be affected by zero or more Exclusion/Debt Sale Events and carries zero or more Calculated Variables; each eligible Account/Arrangement produces exactly one CAIS Extract Record per reporting month per bureau; a Change may affect one or more entities and is logged against this model before physical objects are amended."
            }
          }
        ]
      },
      {
        "heading": "Modelling Principles",
        "displayOrder": 4,
        "blocks": [
          {
            "type": "bullets",
            "payload": {
              "items": [
                "Brand rules are attributes/behaviours of Product and Brand, not separate rule tables.",
                "Calculated Variables are modelled distinctly from source-system attributes because they cannot be derived from a single system.",
                "A Change is assessed against the logical layer first, before physical tables are identified."
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.3",
    "title": "2.3 Physical Model",
    "displayOrder": 8,
    "subSections": [
      {
        "heading": "Core CRA Processing Tables",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Physical Table / View",
                "Purpose & Refresh Cadence"
              ],
              "rows": [
                [
                  "DWH_PDS_STAG",
                  "CRA Staging Data Mart (Monthly truncate/insert jobs run on 1st of month)"
                ],
                [
                  "DWH_IP_ARRG_CALC_V",
                  "CADS Calculation View (CU-populated from 6th/7th of month)"
                ],
                [
                  "DWH_CAIS_SMRY_SNAP",
                  "CRA Final Data Mart / Snapshot Repository"
                ],
                [
                  "DWH_CAIS_EXCEPTION",
                  "Automated Staging & Validation Exception Log Table"
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "DWC Source Tables \u2014 CRA Cards Staging Table",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Source Table",
                "Source File / Feed",
                "One-Line Purpose"
              ],
              "rows": [
                [
                  "DWC_ACCT_ARR_EOM_SNAP",
                  "AMBS Snapshot",
                  "Cards end-of-month arrangement snapshot master"
                ],
                [
                  "DWC_ACCT_ARR",
                  "AMBS Master",
                  "Cards account arrangement entity attributes"
                ],
                [
                  "DWC_CRD_ACCES_ARR_CRA",
                  "AMED Feed",
                  "CRA card access arrangement details"
                ],
                [
                  "DWC_CHAIN_ARR",
                  "AMBS Chain",
                  "Account chain and card re-issue linkages"
                ],
                [
                  "DWH_PTYP_CLAS_RELN",
                  "DWH Hierarchy",
                  "Product type classification relationship"
                ],
                [
                  "DWC_PROD",
                  "RAW_BCD_PROD_ITEM",
                  "Cards product master item repository"
                ],
                [
                  "DWC_ACCES_ACCT_CRD",
                  "AMBS Access",
                  "Card account access relationship"
                ],
                [
                  "DWC_ARR_WRF_HIST",
                  "Write-off Feed",
                  "Historical write-off tracking log"
                ],
                [
                  "DWH_CUST",
                  "RAW_CDU030_PERSCUST",
                  "Customer legal entity master table"
                ],
                [
                  "DWC_ACCT_ARR_BLK_HIST",
                  "Block History",
                  "Block code history (codes D, K, P, E, Z, F, L, R, O, B)"
                ],
                [
                  "DWH_INDV",
                  "Individual Feed",
                  "Individual customer demographic record"
                ],
                [
                  "DWC_CTA_COLL_TRACK",
                  "Collections Feed",
                  "Collections and recoveries tracking history"
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "DWH Source Tables \u2014 CRA Retail Staging Table",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Source Table",
                "Source System",
                "One-Line Purpose"
              ],
              "rows": [
                [
                  "DWH_IP_ARRG_RELN",
                  "PLM / BDRAS",
                  "Involved party arrangement relationship master"
                ],
                [
                  "DWH_IP_XREF",
                  "TSS Cross Ref",
                  "Customer cross-reference repository (TSS_CUST_ID)"
                ],
                [
                  "DWH_BD_ARRG",
                  "Brand Master",
                  "Brand arrangement mapping table"
                ],
                [
                  "DWH_ACCT_ARRG",
                  "PLM Core",
                  "Account arrangement master table"
                ],
                [
                  "DWH_PTYP_CLAS_RELN",
                  "DWH Class",
                  "Product type classification relationship table"
                ],
                [
                  "DWH_ARCL_RELN",
                  "Arrangement Class",
                  "Arrangement classification relationship table"
                ],
                [
                  "DWH_PTYP_XREF",
                  "Product Matrix",
                  "Product type cross-reference matrix"
                ],
                [
                  "DWH_PRAR",
                  "Product Link",
                  "Product arrangement link table"
                ],
                [
                  "DWH_CUST_CLAS_RELN",
                  "Customer Class",
                  "Customer classification relationship table"
                ],
                [
                  "DWH_INDV",
                  "Individual Master",
                  "Individual customer master table"
                ],
                [
                  "DWH_ARRG",
                  "Arrangement Core",
                  "Enterprise arrangement master table"
                ],
                [
                  "DWH_ARRG_XREF",
                  "RPS Cross Ref",
                  "Arrangement cross-reference table (RPS_ACCT_ID_14)"
                ],
                [
                  "DWH_CUST",
                  "Customer Core",
                  "Customer master repository (OWN_INSTT)"
                ]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.4",
    "title": "2.4 Mapping Spreadsheet",
    "displayOrder": 9,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Field-level source-to-target mapping is maintained as a separate, version-controlled spreadsheet rather than reproduced field-by-field here; this section records governance around it."
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.5",
    "title": "2.5 Report Layout",
    "displayOrder": 10,
    "subSections": [
      {
        "heading": "CAIS Field Layout (Retail Banking \u2014 44 Fields)",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "S No.",
                "UK Variable",
                "S No.",
                "UK Variable"
              ],
              "rows": [
                [
                  "1",
                  "Close Date",
                  "23",
                  "PreviousStatement Balance Indicator"
                ],
                [
                  "2",
                  "Monthly Payment (Derived)",
                  "24",
                  "Number of cash advances"
                ],
                [
                  "3",
                  "Repayment period (Derived)",
                  "25",
                  "Value of cash advances"
                ],
                [
                  "4",
                  "Current Balance (Derived)",
                  "26",
                  "Payment Code"
                ],
                [
                  "5",
                  "Account Status (Derived)",
                  "27",
                  "Promotion activity Flag"
                ],
                [
                  "6",
                  "Flag settings (Derived)",
                  "28",
                  "Filler 1"
                ],
                [
                  "7",
                  "Transaction Flag",
                  "29",
                  "Transient Association Flag"
                ],
                [
                  "8",
                  "Payment frequency",
                  "30",
                  "Air time Flag"
                ],
                [
                  "9",
                  "Account Number",
                  "31",
                  "Address1"
                ],
                [
                  "10",
                  "Sequence Number",
                  "32",
                  "Address2"
                ],
                [
                  "11",
                  "Account Type",
                  "33",
                  "Address3"
                ],
                [
                  "12",
                  "Start Date",
                  "34",
                  "Address4"
                ],
                [
                  "13",
                  "Credit Balance indicator (Derived)",
                  "35",
                  "Postcode"
                ],
                [
                  "14",
                  "Payment amount",
                  "36",
                  "Credit Limit"
                ],
                [
                  "15",
                  "Name",
                  "37",
                  "Filler2"
                ],
                [
                  "16",
                  "Date of Birth",
                  "38",
                  "Transferred to collection account"
                ],
                [
                  "17",
                  "Original Default Balance",
                  "39",
                  "Balance type"
                ],
                [
                  "18",
                  "New Sequence Number",
                  "40",
                  "Credit turnover"
                ],
                [
                  "19",
                  "Special instruction indicator",
                  "41",
                  "Primary Account indicator"
                ],
                [
                  "20",
                  "Experian Block",
                  "42",
                  "Default Satisfaction date"
                ],
                [
                  "21",
                  "Credit Payment indicator",
                  "43",
                  "Filler3"
                ],
                [
                  "22",
                  "PreviousStatement Balance",
                  "44",
                  "New Account Number"
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "Brand Identification Codes Governance",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Each brand is mapped to a unique bureau-recognized identification code used for brand identification at the UK BI side for Experian, Equifax, and TransUnion reporting purposes. Note: HSBC Harvey Nichols Store Card (Brand 331) is not currently reporting to the bureaus."
            }
          }
        ]
      },
      {
        "heading": "Notes on Key Derived Fields",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "bullets",
            "payload": {
              "items": [
                "Current Balance (Derived), Account Status (Derived), Flag Settings (Derived), Monthly Payment (Derived), Repayment period (Derived), Payment frequency (Derived) are CU-owned and dependent on CADS timing.",
                "Special instruction indicator carries forbearance/payment-holiday/debt-sale markers.",
                "Default Satisfaction date governs the 71-month rule.",
                "Credit Balance indicator (Derived) distinguishes credit vs debit balance."
              ]
            }
          },
          {
            "type": "pie-chart",
            "payload": {
              "title": "Data Variables Accountability (Final Data Mart)",
              "caption": "Figure 2.5(a) — Data Variables Accountability: split of the 44 CAIS report fields between BI and CU Team ownership.",
              "cuOwnedFields": [
                "Current Balance (Derived)",
                "Account Status (Derived)",
                "Flag Settings (Derived)",
                "Monthly Payment (Derived)",
                "Repayment period (Derived)",
                "Payment frequency (Derived)"
              ],
              "totalFields": 44
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.6",
    "title": "2.6 Data Examples",
    "displayOrder": 11,
    "subSections": [
      {
        "heading": null,
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Illustrative examples show, at summary level, how a subset of the 44 fields populate for typical scenarios \u2014 all identifiers fictitious, never live data."
            }
          }
        ]
      },
      {
        "heading": "Example 1 \u2014 Standard Performing Account",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Field Name",
                "Populated Test Value",
                "Description"
              ],
              "rows": [
                [
                  "ACC_NUM",
                  "4532XXXXXXXX1092",
                  "HSBC Retail Unsecured Loan"
                ],
                [
                  "ACC_TYPE",
                  "02",
                  "Unsecured Loan"
                ],
                [
                  "START_DATE",
                  "20180415",
                  "Open Date"
                ],
                [
                  "CURRENT_BAL",
                  "+000045000",
                  "\u00a3450.00 Debt Balance"
                ],
                [
                  "ACC_STATUS",
                  "0",
                  "Up to Date"
                ],
                [
                  "CREDIT_LIMIT",
                  "000500000",
                  "\u00a35,000.00 Limit"
                ],
                [
                  "PMT_FREQ",
                  "M",
                  "Monthly Payment"
                ],
                [
                  "TRANS_FLAG",
                  "U",
                  "Update Record"
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "Example 2 \u2014 Defaulted Account within the 71-Month Reporting Window",
        "displayOrder": 3,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Field Name",
                "Populated Test Value",
                "Description"
              ],
              "rows": [
                [
                  "ACC_NUM",
                  "8901XXXXXXXX4431",
                  "HSBC Credit Card Account"
                ],
                [
                  "ACC_TYPE",
                  "05",
                  "Credit Card"
                ],
                [
                  "START_DATE",
                  "20200110",
                  "Open Date"
                ],
                [
                  "ORIG_DEF_BAL",
                  "000240000",
                  "\u00a32,400.00 Balance at Default"
                ],
                [
                  "ACC_STATUS",
                  "8",
                  "Default Status"
                ],
                [
                  "DEF_SAT_DATE",
                  "20220615",
                  "18 of 71 months elapsed"
                ],
                [
                  "TRANSFER_COLL_ACC",
                  "N",
                  "Not yet transferred"
                ],
                [
                  "TRANS_FLAG",
                  "U",
                  "Update Record"
                ]
              ]
            }
          }
        ]
      },
      {
        "heading": "Example 3 \u2014 Debt Sale Record",
        "displayOrder": 4,
        "blocks": [
          {
            "type": "table",
            "payload": {
              "headers": [
                "Field Name",
                "Populated Test Value",
                "Description"
              ],
              "rows": [
                [
                  "ACC_NUM",
                  "5412XXXXXXXX8820",
                  "HSBC Retail Account Sold to Collection Agency"
                ],
                [
                  "ACC_TYPE",
                  "02",
                  "Unsecured Loan"
                ],
                [
                  "TRANSFER_COLL_ACC",
                  "Y",
                  "Transferred to Collection Account"
                ],
                [
                  "SPEC_INST_FLAG",
                  "D",
                  "Debt Sale / Delete Marker"
                ],
                [
                  "ACC_STATUS",
                  "D",
                  "Default Status"
                ],
                [
                  "TRANS_FLAG",
                  "D",
                  "Delete Record"
                ]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "sectionNumber": "2.7",
    "title": "2.7 Test Approach",
    "displayOrder": 12,
    "subSections": [
      {
        "heading": "Test Strategy and Environments",
        "displayOrder": 1,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Testing of CAIS monthly extract changes follows a structured multi-tier verification process: unit testing of transformation logic against simulated DWH staging tables, UAT dry-runs against full monthly staging schemas, and reconciliation against prior bureau submission files. Bureau test environments (Experian Test Gateway, Equifax Test Connect, TransUnion Test Gateway) are utilized to validate file formatting and checksum rules prior to production release."
            }
          }
        ]
      },
      {
        "heading": "Reconciliation and Control Total Verification",
        "displayOrder": 2,
        "blocks": [
          {
            "type": "paragraph",
            "payload": {
              "text": "Every test execution requires automated control-total reconciliation: total account counts, sum of current debt balances, default count totals, and brand-level record counts are verified before and after transformation rules execute. Any discrepancy outside agreed tolerance thresholds triggers an automatic investigation before sign-off is granted."
            }
          }
        ]
      }
    ]
  }
];

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
      const createdSub = await prisma.subSection.create({
        data: {
          documentSectionId: createdSection.id,
          heading: sub.heading,
          displayOrder: sub.displayOrder,
          contentBlocks: JSON.stringify(sub.blocks),
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
            blocks: sub.blocks,
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
