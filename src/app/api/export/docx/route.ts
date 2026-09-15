import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ShadingType,
  ImageRun,
} from 'docx';
import { MASTER_SECTIONS } from '@/lib/sectionsData';
import { PREPOPULATED_CHANGES } from '@/app/api/changes/route';
import { getCloudChangeState, deletedIds, getCreatedChanges } from '@/lib/cloudStore';
import { getDiagramAPngBuffer, getDiagramBPngBuffer } from '@/lib/exportDiagrams';
import {
  REGULATORY_TOC,
  REGULATORY_TOC_NOTE,
  BRAND_IDENTIFICATION_CODES,
  DWH_SOURCE_TABLES,
  BRAND_CRITERIA_BLOCKS,
  SUPPORTED_PRODUCTS,
  CAIS_44_VARIABLES,
} from '@/lib/regulatoryHldContent';

const prisma = new PrismaClient();

const COLOR_PRIMARY_RED = 'C0272D';
const COLOR_DARK_GREY = '111827';
const COLOR_BODY_TEXT = '374151';
const COLOR_MID_GREY = '4B5563';
const COLOR_BORDER = 'CBD5E1';
const COLOR_ALT_BG = 'F8FAFC';

function cleanText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/\[u\]/gi, '')
    .replace(/\[\/u\]/gi, '')
    .replace(/\uFFFD/g, '—')
    .replace(/\0/g, '');
}

function makeH1(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Times New Roman',
        size: 32, // 16pt
        bold: true,
        color: COLOR_PRIMARY_RED,
      }),
    ],
  });
}

function makeH2(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    pageBreakBefore,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Times New Roman',
        size: 26, // 13pt
        bold: true,
        color: COLOR_DARK_GREY,
      }),
    ],
  });
}

function makeH3(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    pageBreakBefore,
    spacing: { before: 120, after: 60 },
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Times New Roman',
        size: 23, // 11.5pt
        bold: true,
        color: COLOR_DARK_GREY,
      }),
    ],
  });
}

function makeP(text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFY) {
  return new Paragraph({
    spacing: { before: 0, after: 120, line: 276 },
    alignment: align,
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Times New Roman',
        size: 21, // 10.5pt
        color: COLOR_BODY_TEXT,
      }),
    ],
  });
}

function makeBullet(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 60, line: 276 },
    indent: { left: 360 },
    alignment: AlignmentType.JUSTIFY,
    children: [
      new TextRun({
        text: '▸  ',
        font: 'Times New Roman',
        size: 21,
        bold: true,
        color: COLOR_PRIMARY_RED,
      }),
      new TextRun({
        text: cleanText(text),
        font: 'Times New Roman',
        size: 21,
        color: COLOR_BODY_TEXT,
      }),
    ],
  });
}

function makeHighlightBox(text: string, bgHex = 'DCFCE7', textHex = '15803D') {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgHex, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.SINGLE, size: 12, color: textHex },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: cleanText(text),
                    bold: true,
                    font: 'Times New Roman',
                    size: 22,
                    color: textHex,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeCustomTable(headers: string[], rows: string[][]) {
  const tableRows: TableRow[] = [];

  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: (headers || []).map(
        (h) =>
          new TableCell({
            shading: { fill: COLOR_PRIMARY_RED, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY_RED },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY_RED },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY_RED },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY_RED },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cleanText(h) || ' ',
                    bold: true,
                    font: 'Times New Roman',
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  (rows || []).forEach((r, idx) => {
    const isAlt = idx % 2 === 1;
    tableRows.push(
      new TableRow({
        children: (r || []).map(
          (cell) =>
            new TableCell({
              shading: isAlt ? { fill: COLOR_ALT_BG, type: ShadingType.CLEAR } : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanText(cell) || ' ',
                      font: 'Times New Roman',
                      size: 20,
                      color: COLOR_BODY_TEXT,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

export async function GET() {
  try {
    let sections: any[] = [];
    let changes: any[] = [];

    try {
      sections = await prisma.documentSection.findMany({
        include: { subSections: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { displayOrder: 'asc' },
      });
      changes = await prisma.caisChange.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.error('DB query failed in DOCX export, using fallbacks:', dbErr);
    }

    if (!changes || changes.length === 0) {
      changes = PREPOPULATED_CHANGES;
    }

    try {
      const cloudCreated = await getCreatedChanges();
      if (cloudCreated.length > 0) {
        const existingRefs = new Set(changes.map((c: any) => c.crReference));
        const newItems = cloudCreated.filter((c: any) => !existingRefs.has(c.crReference));
        changes = [...newItems, ...changes];
      }
    } catch (e) {}

    const enrichedChanges = await Promise.all(
      changes.map(async (c: any) => {
        try {
          const cloudStateByRef = c.crReference ? await getCloudChangeState(c.crReference) : null;
          const cloudStateById = c.id ? await getCloudChangeState(c.id) : null;
          const isDeleted =
            (cloudStateByRef && cloudStateByRef.deleted) ||
            (cloudStateById && cloudStateById.deleted) ||
            deletedIds.has(c.id) ||
            deletedIds.has(c.crReference);
          if (isDeleted) return null;

          const cloudState = cloudStateByRef || cloudStateById;
          if (cloudState) {
            return {
              ...c,
              status: cloudState.status || c.status,
              versionNumber: cloudState.versionNumber || c.versionNumber,
              reviewComments: cloudState.reviewComments || c.reviewComments,
              reviewedByName: cloudState.reviewedByName || c.reviewedByName,
              approvalDate: cloudState.approvalDate || c.approvalDate,
            };
          }
        } catch (e) {}
        return c;
      })
    );

    changes = enrichedChanges.filter(Boolean);

    if (!sections || sections.length === 0) {
      sections = MASTER_SECTIONS;
    }

    const diagramAPng = getDiagramAPngBuffer();
    const diagramBPng = getDiagramBPngBuffer();

    const docChildren: any[] = [];

    // --- 1. COVER PAGE ---
    for (let i = 0; i < 3; i++) docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: 'CRA CAIS Reporting High Level Design',
            bold: true,
            size: 48, // 24pt
            font: 'Times New Roman',
            color: COLOR_PRIMARY_RED,
          }),
        ],
      })
    );

    docChildren.push(
      new Paragraph({
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: 'High Level Design — Regulatory Template Document',
            size: 24, // 12pt
            font: 'Times New Roman',
            color: COLOR_MID_GREY,
          }),
        ],
      })
    );

    docChildren.push(makeP('Author: Aishwarya Raj Singh (Business Analyst)'));
    docChildren.push(makeP('Organization: HSBC Operations, Services and Technology'));
    docChildren.push(makeP('Classification: RESTRICTED'));
    docChildren.push(makeP('Date: 14 September 2026'));
    docChildren.push(makeP('Version: 1.0 (Regulatory Consolidated)'));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      new Paragraph({
        spacing: { after: 480 },
        children: [
          new TextRun({
            text: 'This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.',
            italics: true,
            size: 20, // 10pt
            font: 'Times New Roman',
            color: COLOR_MID_GREY,
          }),
        ],
      })
    );

    for (let i = 0; i < 3; i++) docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      new Paragraph({
        border: { top: { color: COLOR_PRIMARY_RED, space: 6, style: BorderStyle.SINGLE, size: 8 } },
        spacing: { before: 160, after: 0 },
        children: [
          new TextRun({
            text: 'RESTRICTED — For Internal Company Use Only.',
            bold: true,
            size: 18,
            font: 'Times New Roman',
            color: COLOR_PRIMARY_RED,
          }),
        ],
      })
    );

    // --- 2. DOCUMENT INFORMATION PAGE ---
    docChildren.push(makeH1('Document Information', true));
    docChildren.push(makeH2('Involved Parties'));
    docChildren.push(
      makeCustomTable(
        ['Name', 'Role'],
        [
          ['Manash R Chanda', 'UKBI POD Lead'],
          ['Swapnil Kalidas Sankpal', 'Tech Lead'],
          ['Vishnu Vardhan', 'Senior Developer'],
          ['Aishwarya Raj Singh', 'Business Analyst'],
          ['Narsimha Chary', 'UKBI ITPM'],
        ]
      )
    );
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('Revision History'));
    docChildren.push(
      makeP('Tracks revisions to document structure. Individual CAIS changes are logged in Section 3.')
    );
    docChildren.push(
      makeCustomTable(
        ['Version', 'Date', 'Updated By', 'Reason for Issue'],
        [['1.0', '14/09/2026', 'Aishwarya Raj Singh', 'Initial consolidated HLD created']]
      )
    );
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('Reviewed By'));
    docChildren.push(
      makeCustomTable(
        ['Reviewer', 'Role or Business Unit', 'Date'],
        [
          ['Stuart H Lindsay', 'Product Owner UK Bureau', '14/09/2026'],
          ['Suranjita Saha', 'CU Team Lead', '14/09/2026'],
          ['Manash R Chanda', 'UKBI Design Manager', '14/09/2026'],
        ]
      )
    );

    // --- 3. TABLE OF CONTENTS PAGE ---
    docChildren.push(makeH1('Table of Contents', true));
    const tocRows = REGULATORY_TOC.map((t) => [
      `${t.num} ${t.title}`,
      `....................................................................................`,
      t.page,
    ]);
    docChildren.push(makeCustomTable(['Section Title', 'Dot Leader', 'Page'], tocRows));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: REGULATORY_TOC_NOTE,
            italics: true,
            font: 'Times New Roman',
            size: 20,
            color: COLOR_BODY_TEXT,
          }),
        ],
      })
    );

    // --- 4. SECTION 1: BUSINESS OVERVIEW AND REQUIREMENTS SUMMARY ---
    docChildren.push(makeH1('1. Business Overview and Requirements Summary', true));
    docChildren.push(makeHighlightBox('Business Overview'));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeP('In the UK, there are three main credit reference agencies: Experian, Equifax, and TransUnion (formerly known as Callcredit). Each of these CRAs has slightly different ways of collecting and presenting information. Additionally, CRAs offer various services to help financial institutions manage credit risk, such as credit monitoring and risk management tools.'));
    docChildren.push(makeP("Credit reference agencies (CRAs) collect and maintain information about businesses in addition to individuals' credit histories. The information provided by CRAs about corporate entities can include:"));

    const overviewBullets = [
      'Credit accounts and outstanding debts',
      'Payment history and credit utilization',
      'Legal filings, such as bankruptcies, judgments, and liens',
      'Business registration information and ownership details',
      'Industry and business classification codes',
      'Financial data, such as revenue and number of employees',
      'Trade references and credit scores',
    ];
    for (const b of overviewBullets) docChildren.push(makeBullet(b));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeP("CRAs provide credit reports to lenders and other authorized parties, including corporate and institutional customers, to help them make informed credit decisions. By providing information about an individual or businesses' credit history, credit reference agencies help lenders assess creditworthiness and manage risk. For example, a lender may use a credit report to determine whether to approve a loan application, set the terms of a loan, or monitor the creditworthiness of an existing borrower."));
    docChildren.push(makeP("All of this information is used to create a credit report that provides a snapshot of a business's creditworthiness and financial history. Corporate and institutional customers can use this information to make informed credit decisions, such as whether to approve a loan application or set the terms of a loan. In addition, CRAs may offer various services to help corporate and institutional customers manage credit risk, such as credit monitoring and risk management tools."));
    docChildren.push(makeP("Regulatory Report carries monthly data (previous month's) to bureaus which includes Red Brand, CIIOM, FD, M&S and Harvey Nicholas. All products data which are eligible to be reported are shared with the bureaus on monthly basis including Loans, Mortgages, Credit Cards, Current Accounts."));

    docChildren.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: 'Credit Rating Agencies Reporting Process',
            bold: true,
            underline: {},
            font: 'Times New Roman',
            size: 22,
            color: COLOR_DARK_GREY,
          }),
        ],
      })
    );
    docChildren.push(makeP('[Structure-only placeholder for BA process details]'));

    docChildren.push(makeH2('CRA Reporting – Process Workflow & Key Milestones'));
    docChildren.push(makeH3('Purpose'));
    docChildren.push(makeP('This document describes the end-to-end CRA Reporting / CAIS extract process, from staging data preparation through validations and final transmission to Credit Reference Agencies (CRAs). It clarifies the sequence of steps, ownership (BI/CUT/Transmission), and the key tables/outputs produced.'));

    docChildren.push(makeH3('Scope'));
    docChildren.push(makeP('Covers the monthly processing flow shown in the design diagram, including:'));
    docChildren.push(makeBullet('Retail and Cards staging preparation'));
    docChildren.push(makeBullet('Exclusions and Debt Sale handling'));
    docChildren.push(makeBullet('Staging validations and Address Processing'));
    docChildren.push(makeBullet('SAS/CADS processing and updates to key calculation views'));
    docChildren.push(makeBullet('Creation of CAIS outputs and loading to CAIS snapshot structures'));
    docChildren.push(makeBullet('Final validations, ad-hoc processing (if needed), and transmission to CRAs'));

    docChildren.push(makeH3('Process Overview (High Level)'));
    docChildren.push(makeP('Input feeds (Retail + Cards) are staged → exclusions applied → debt sale logic applied → staging validation performed → downstream SAS/CADS (Credit Analysis and Decisioning System) processing updates core CRA reporting tables → files are generated and loaded to CAIS snapshot structures → final validations occur → files are transmitted to CRAs.'));

    // --- SECTION 1.1: CONCEPTUAL DATA FLOW DIAGRAM ---
    docChildren.push(makeH1('1.1 Conceptual Data Flow Diagram', true));
    docChildren.push(makeP('The diagram below illustrates the process of creating the extract.'));
    docChildren.push(new Paragraph({ text: '' }));

    // Diagram A Image
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new ImageRun({
            data: diagramAPng,
            type: 'png',
            transformation: { width: 500, height: 575 },
            altText: { title: 'Diagram A', description: 'Primary Process Flow', name: 'Diagram A' },
          }),
        ],
      })
    );

    docChildren.push(makeH2('Operational Swimlane & Manual Intervention Map (Diagram B)', true));
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new ImageRun({
            data: diagramBPng,
            type: 'png',
            transformation: { width: 500, height: 583 },
            altText: { title: 'Diagram B', description: 'Operational Swimlane Diagram', name: 'Diagram B' },
          }),
        ],
      })
    );

    docChildren.push(makeH2('Detailed Process Steps (as per data flow)', true));

    const processSteps = [
      ['Step 1 — Retail Staging Table (Input preparation)', 'Description: Load/prepare retail staging dataset from upstream DWH/source feeds.\nOutput: Retail staging table ready for downstream exclusion and validation steps.\nOwner: BI'],
      ['Step 2 — Cards Staging Table (Input preparation)', 'Description: Load/prepare Cards staging dataset from upstream DWH/source feeds.\nOutput: Cards staging table ready for downstream exclusion and validation steps.\nOwner: BI'],
      ['Step 3 — Exclusions', 'Description: Apply exclusion rules (e.g., products/accounts not eligible for bureau reporting, policy-driven removals).\nDependency: Requires Retail/Cards staging prepared.\nOutput: Exclusion-adjusted datasets.\nOwner: CU team shares the exclusion file with BI'],
      ['Step 4 — Debt Sale', 'Description: Apply debt sale identification/treatment rules to ensure correct reporting of sold debts.\nDependency: Executes after exclusions.\nOutput: Dataset updated to reflect debt sale logic.\nOwner: CU team shares the debt sale file with BI'],
      ['Step 5 — Staging Table Validation', 'Description: Run validation checks on staging outputs (completeness, formats, key fields, reconciliation controls).\nDependency: After exclusions and debt sale.\nOutput: Validated staging dataset and/or exception reports.\nOwner: BI'],
      ['Step 6 — Address Processing', 'Description: Standardize and/or validate address-related fields used for bureau reporting.\nDependency: Triggered from staging validation step.\nOutput: Address-enriched dataset for downstream reporting.\nOwner: BI'],
    ];

    for (const [title, desc] of processSteps) {
      docChildren.push(makeH3(title));
      docChildren.push(makeP(desc));
    }

    docChildren.push(makeH3('Core Processing (SAS block)'));
    docChildren.push(makeP('• Data Loaded to DWH_PDS_STAG for CADS (Credit Analysis and Decisioning System)\n  Description: Load validated/transformed data into DWH_PDS_STAG (CRA Staging Table) which becomes the base for subsequent processing.\n  Dependency: Staging validation complete.\n  Output: DWH_PDS_STAG populated for the processing month.\n  Owner: BI'));
    docChildren.push(makeP('• CADS Processing\n  Description: Execute CADS processing logic using DWH_PDS_STAG as the base (as shown in the flow).\n  Output: CADS-derived outputs used downstream (and/or feeds into calculation updates).\n  Owner: CU Team'));
    docChildren.push(makeP('• Update DWH_IP_ARRG_CALC_V\n  Description: Update calculation view/table DWH_IP_ARRG_CALC_V (includes CRA-relevant calculated variables; diagram indicates it is updated within the SAS processing block).\n  Dependency: Inputs from staging/CADS outputs.\n  Output: Updated DWH_IP_ARRG_CALC_V for the month.\n  Owner: CU team runs SAS datasets to populate DWH_IP_ARRG_CALC_V table.'));

    docChildren.push(makeH3('File Creation and Loading to CAIS Final Data Mart'));
    docChildren.push(makeP('• Create File from DWH_IP_ARRG_CALC_V\n  Description: Generate CRA extract file(s) based on the updated DWH_IP_ARRG_CALC_V.\n  Output: Intermediate CRA/CAIS-format file(s).\n  Owner: BI (file generation job)'));
    docChildren.push(makeP('• Load CARDS data to CAIS Snap-Shot\n  Description: Load Cards-specific output into the CAIS snapshot structure (as per diagram label).\n  Output: CAIS snapshot populated with Cards.\n  Owner: BI'));
    docChildren.push(makeP('• Load RETAIL data to CAIS Snap-Shot\n  Description: Load Retail-specific output into the CAIS snapshot structure.\n  Output: CAIS snapshot populated for Retail.\n  Owner: BI'));

    docChildren.push(makeH3('Business Rules Validations'));
    docChildren.push(makeP('Description: Perform final end to end validations prior to submission:\nOutput: Validation sign-off or exception list for remediation.\nOwner: BI & CU Team'));
    docChildren.push(makeP('Validation Rules (Business Rules) are applied on the data at the end post all data load jobs of staging and snap are executed from BI perspective so that the data shared with bureaus is as per business acceptability standards. These Rules are applied on the CRA final data mart. Final validation on data volume for each and all exceptions are carried out by Stuart Lindsay and CU team. Any unusual variation/hike in the data found (if any) would allow for investigation from BI and CU side. The reasons for unusual data behavior would be analyzed and then concluded accordingly.'));

    docChildren.push(makeH3('Ad-hoc File Processing (if required)'));
    docChildren.push(makeP('Description: Non-standard intervention step used only when required (e.g., reruns, fixes for data issues, regeneration due to late changes).\nTrigger: Exceptions identified in validations or business sign-off requirements.\nOwner: BI / CUT (depending on the issue type)'));

    docChildren.push(makeH3('File Transmitted to CRAs'));
    docChildren.push(makeP('Description: Final files transmitted to bureaus/CRAs via Transmission route.\nMethod: BI pushes files to Transmission team server; Transmission sends via Connect:Direct.'));
    docChildren.push(makeHighlightBox('Target path (intermediate): /int2liv/feeds/CRP00006/data/', 'FEF08A', '854D0E'));
    docChildren.push(makeP('Output: Files delivered to CRAs.\nOwner: Transmission team (with BI providing the files)'));

    docChildren.push(makeH3('Operational Support / Escalation'));
    docChildren.push(makeP('BI data issues: bi.live.support@hsbc.com\nCUT data quality issues: dataquality.cut@hsbc.co.in\nMailboxes are monitored daily'));
    docChildren.push(makeP("BI Team does not directly send the file to bureaus, rather they are being routed to bureaus via connect direct (transmission team's server), BI team places/pushes the file on transmission team's server, post which they are sent to bureaus via UK Transmission team."));

    docChildren.push(makeH3('EXPERIAN EQUIFAX TU (Data Scope for Retail – Experian Recognized Codes for brand identification at UKBI Side)'));
    docChildren.push(makeCustomTable(['Brand', 'Code', 'Identifier 1', 'Identifier 2'], BRAND_IDENTIFICATION_CODES));
    docChildren.push(new Paragraph({ text: '' }));

    // --- SECTION 1.2: RETAIL BRANDS STAGING ELEGIBILITY & EXCLUSION CRITERIA ---
    docChildren.push(makeH1('1.2 Retail Brands Staging Elegibility & Exclusion Criteria', true));
    docChildren.push(makeH2('DWH Source Tables for Loading Data into (CRA Retail Staging Table)'));
    docChildren.push(makeCustomTable(['DWH Core Tables', 'Source File', 'Source ITSO Name'], DWH_SOURCE_TABLES));
    docChildren.push(new Paragraph({ text: '' }));

    for (const block of BRAND_CRITERIA_BLOCKS) {
      docChildren.push(makeH3(`Pre-Requisite Inclusion Criteria for Data loading in CRA Staging Table (${block.brandName})`));
      for (const b of block.bullets) {
        docChildren.push(makeBullet(b));
      }
      docChildren.push(new Paragraph({ text: '' }));
    }

    docChildren.push(makeH2('Supported Products for CRA Data Reporting (Retail Banking)'));
    docChildren.push(makeCustomTable(['PDS (Product Codes)', 'Description'], SUPPORTED_PRODUCTS));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeP('Below mentioned are the source systems from which CRA (CAIS File Submission for Retail Banking) utilizes the data for reporting purpose: -'));
    docChildren.push(makeP('CDU, PLM, BDRAS, OHC, RMS, BCDU'));
    docChildren.push(makeP('CAIS File delivery for Retail is a joint effort from UKBIDWH and CUT Team. Dependency lies with CUT Team for 6 variable\'s data.'));
    docChildren.push(makeH3('Listed below are the CUT Team Variables'));
    const cutVars = ['Current Balance', 'Account Status', 'Flag Settings', 'Monthly Payment', 'Repayment Period', 'Payment Frequency'];
    for (const v of cutVars) docChildren.push(makeBullet(v));

    docChildren.push(makeH2('Reference & Job Schedule Metadata'));
    docChildren.push(makeP('CRA Staging Data Mart for CAIS File (Retail Banking): DWH_PDS_STAG (Monthly Data Truncate/Insert)\nCRA Staging Jobs Execution: 01st of every month\nCADS Processing Table (Retail Banking): DWH_IP_ARRG_CALC_V\nCU Status Execution (Start Date): 06th or 07th of every month\nCRA Final Data Mart for CAIS File (Retail Banking): DWH_CAIS_SMRY_SNAP\nCRA Validation Table (Retail Banking): DWH_CAIS_EXCEPTION\nReporting Frequency: Monthly\nBureau File Sharing Timelines (TU, Experian and Equifax): Mid-Month Tentatively'));

    docChildren.push(makeH2('CAIS Variables (Retail Banking)'));
    docChildren.push(makeCustomTable(['S No.', 'UK Variables'], CAIS_44_VARIABLES));
    docChildren.push(new Paragraph({ text: '' }));

    // --- SECTION 1.3: VALIDATION RULES ---
    docChildren.push(makeH1('1.3 Validation Rules on snap prior to extract file is sent to the CRAs', true));
    docChildren.push(makeP('[Business rule content to be confirmed by BA]'));

    // --- SECTIONS 3 THROUGH 14 (EXISTING APP SECTIONS) ---
    for (const sec of sections) {
      if (['1.1', '1.2', '1.3'].includes(sec.sectionNumber)) continue;

      docChildren.push(makeH1(`${sec.sectionNumber} ${sec.title || ''}`, true));
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          if (sub.heading) {
            docChildren.push(makeH2(sub.heading));
          }
          let blocks: any[] = [];
          try {
            blocks = typeof sub.contentBlocks === 'string' ? JSON.parse(sub.contentBlocks) : sub.contentBlocks || [];
          } catch (e) {}

          for (const b of blocks) {
            if (b.type === 'paragraph') {
              docChildren.push(makeP(b.payload?.text || ''));
            } else if (b.type === 'bullets') {
              for (const item of b.payload?.items || []) {
                docChildren.push(makeBullet(item));
              }
            }
          }
        }
      }
    }

    // --- SECTION 3: CAIS CHANGE REGISTER ---
    docChildren.push(makeH1('3 CAIS Change Register', true));
    docChildren.push(makeP('This section is an append-only historical register of all approved CAIS changes. The latest changes appear at the top. Earlier entries are never overwritten or deleted.'));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('Master Change Log'));
    const changeLogHeaders = ['CR Reference', 'Title', 'Change Type', 'Impacted Bureaus', 'Target Month', 'Status'];
    const changeLogRows = changes.map((c) => [
      c.crReference || ' ',
      c.title || ' ',
      c.changeType || ' ',
      c.impactedBureaus || ' ',
      c.targetMonth || ' ',
      c.status || ' ',
    ]);
    docChildren.push(makeCustomTable(changeLogHeaders, changeLogRows));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('Detailed Change Entries'));
    for (const c of changes) {
      docChildren.push(makeH3(`${c.crReference} — ${c.title}`, true));
      docChildren.push(
        makeCustomTable(
          ['Field', 'Value'],
          [
            ['Business / Regulatory Driver', c.businessDriver || ' '],
            ['Description of Change', c.description || ' '],
            ['Section(s) Updated', c.sectionsUpdated || ' '],
            ['Before Logic', c.beforeText || ' '],
            ['After Logic', c.afterText || ' '],
            ['Impacted Bureaus', c.impactedBureaus || ' '],
            ['Impacted CAIS Fields', c.impactedDataItems || ' '],
            ['Target Month', c.targetMonth || ' '],
            ['Status', c.status || ' '],
            ['Reviewed / Approved By', c.reviewedByName || 'Stuart H Lindsay'],
          ]
        )
      );
      docChildren.push(new Paragraph({ text: '' }));
    }

    // Assemble Document with Header & Footer
    const doc = new Document({
      title: 'CRA CAIS Reporting High Level Design',
      subject: 'Regulatory High Level Design Document',
      creator: 'Aishwarya Raj Singh',
      description: 'UK CAIS Monthly Regulatory Reporting Process High Level Design',
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1152, bottom: 1152, left: 1152, right: 1152 }, // 0.8 inch margins
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  border: { bottom: { color: COLOR_PRIMARY_RED, space: 4, style: BorderStyle.SINGLE, size: 6 } },
                  children: [
                    new TextRun({
                      text: 'Data Engineering | Data Services',
                      bold: true,
                      size: 18, // 9pt
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  border: { top: { color: COLOR_PRIMARY_RED, space: 4, style: BorderStyle.SINGLE, size: 6 } },
                  alignment: AlignmentType.JUSTIFY,
                  children: [
                    new TextRun({
                      text: '© HSBC Operations, Services and Technology',
                      size: 16, // 8pt
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                    new TextRun({
                      text: '\t\tPage ',
                      size: 16,
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 16,
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                    new TextRun({
                      text: ' of ',
                      size: 16,
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 16,
                      font: 'Times New Roman',
                      color: COLOR_MID_GREY,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'RESTRICTED',
                      bold: true,
                      size: 15,
                      font: 'Times New Roman',
                      color: COLOR_PRIMARY_RED,
                    }),
                  ],
                }),
              ],
            }),
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="CRA_CAIS_Reporting_High_Level_Design.docx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('DOCX Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
