import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { MASTER_SECTIONS } from '@/lib/sectionsData';
import { PREPOPULATED_CHANGES } from '@/app/api/changes/route';
import { getMergedChanges } from '@/lib/cloudStore';
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

function cleanText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/\[u\]/gi, '')
    .replace(/\[\/u\]/gi, '')
    .replace(/\uFFFD/g, '—')
    .replace(/\0/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'proj-alpha';

    let sections: any[] = [];
    let changes: any[] = [];

    try {
      sections = await prisma.documentSection.findMany({
        include: { subSections: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (dbErr) {
      console.error('DB query failed in PDF export, using fallbacks:', dbErr);
    }

    if (!sections || sections.length === 0) {
      sections = MASTER_SECTIONS;
    }

    // Retrieve merged live changes (Gist CloudStore + DB + Baseline)
    try {
      const allMerged = await getMergedChanges(prisma, PREPOPULATED_CHANGES);
      changes = allMerged.filter((c: any) => (c.projectId || 'proj-alpha') === projectId);
    } catch (err) {
      console.error('Failed to retrieve merged changes in PDF export:', err);
      changes = PREPOPULATED_CHANGES.filter((c: any) => (c.projectId || 'proj-alpha') === projectId);
    }

    // Pre-render diagram PNG buffers
    const diagramAPng = getDiagramAPngBuffer();
    const diagramBPng = getDiagramBPngBuffer();

    const primaryRed = '#C0272D';
    const darkGrey = '#111827';
    const bodyGrey = '#374151';

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: 'CRA CAIS Reporting High Level Design',
          Author: 'Aishwarya Raj Singh',
          Subject: 'UK CAIS Monthly Regulatory Reporting Process High Level Design',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const addPageBreak = () => {
        doc.addPage();
      };

      const renderMaroonSectionHeading = (title: string) => {
        doc.fontSize(16).fillColor(primaryRed).font('Times-Bold').text(title);
        doc.moveDown(0.4);
      };

      const renderSubHeading = (text: string) => {
        doc.fontSize(12).fillColor(darkGrey).font('Times-Bold').text(text);
        doc.moveDown(0.3);
      };

      const renderParagraph = (text: string) => {
        doc.fontSize(9.5).fillColor(bodyGrey).font('Times-Roman').text(cleanText(text), { align: 'justify', lineGap: 2 });
        doc.moveDown(0.4);
      };

      const renderBullet = (text: string) => {
        doc.fontSize(9.5).fillColor(bodyGrey).font('Times-Roman').text(`▸  ${cleanText(text)}`, { indent: 12, lineGap: 1.5 });
        doc.moveDown(0.2);
      };

      // --- COVER PAGE ---
      doc.moveDown(3);
      doc.fontSize(24).fillColor(primaryRed).font('Times-Bold').text('CRA CAIS Reporting High Level Design');
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor(darkGrey).font('Times-Roman').text('High Level Design — Regulatory Template Document');
      doc.moveDown(2);

      doc.fontSize(10).fillColor(bodyGrey).font('Times-Bold').text('Author: Aishwarya Raj Singh (Business Analyst)');
      doc.text('Organization: HSBC Operations, Services and Technology');
      doc.text('Classification: RESTRICTED');
      doc.text('Date: 14 September 2026');
      doc.text(`Project ID: ${projectId}`);
      doc.text('Version: 1.0 (Regulatory Consolidated)');
      doc.moveDown(2);

      doc.fontSize(9).font('Times-Italic').fillColor('#4B5563').text(
        'This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.',
        { width: 515, align: 'justify' }
      );

      doc.moveDown(4);
      doc.fontSize(9).font('Times-Bold').fillColor(primaryRed).text('RESTRICTED — For Internal Company Use Only.');

      // --- DOCUMENT INFORMATION PAGE ---
      addPageBreak();
      renderMaroonSectionHeading('Document Information');
      doc.strokeColor(primaryRed).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      renderSubHeading('Involved Parties');
      const parties = [
        ['Manash R Chanda', 'UKBI POD Lead'],
        ['Swapnil Kalidas Sankpal', 'Tech Lead'],
        ['Vishnu Vardhan', 'Senior Developer'],
        ['Aishwarya Raj Singh', 'Business Analyst'],
        ['Narsimha Chary', 'UKBI ITPM'],
      ];

      doc.fontSize(9).font('Times-Bold').fillColor(darkGrey);
      doc.text('Name', 45, doc.y, { width: 220, continued: true });
      doc.text('Role', { width: 290 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const [name, role] of parties) {
        doc.moveDown(0.25);
        doc.text(name, 45, doc.y, { width: 220, continued: true });
        doc.text(role, { width: 290 });
      }

      doc.moveDown(1.5);
      renderSubHeading('Revision History');
      doc.fontSize(9).font('Times-Roman').fillColor(bodyGrey).text('Tracks revisions to document structure. Individual CAIS changes are logged in Section 3.');
      doc.moveDown(0.4);
      doc.fontSize(9).font('Times-Bold').fillColor(darkGrey).text('Version 1.0  |  14/09/2026  |  Aishwarya Raj Singh  |  Initial consolidated HLD created');

      doc.moveDown(1.5);
      renderSubHeading('Reviewed By');
      doc.fontSize(9).font('Times-Roman').fillColor(bodyGrey);
      doc.text('• Stuart H Lindsay — Product Owner UK Bureau (14/09/2026)');
      doc.text('• Suranjita Saha — CU Team Lead (14/09/2026)');
      doc.text('• Manash R Chanda — UKBI Design Manager (14/09/2026)');

      // --- TABLE OF CONTENTS PAGE ---
      addPageBreak();
      renderMaroonSectionHeading('Table of Contents');
      doc.moveDown(0.5);

      for (const item of REGULATORY_TOC) {
        doc.fontSize(10).font('Times-Roman').fillColor(darkGrey);
        doc.text(`${item.num.padEnd(8)}${item.title}`, 45, doc.y, { width: 440, continued: true });
        const dots = ' .'.repeat(25);
        doc.text(` ${dots} ${item.page}`, { width: 70, align: 'right' });
        doc.moveDown(0.4);
      }

      doc.moveDown(1.5);
      doc.fontSize(9).font('Times-Italic').fillColor('#374151').text(REGULATORY_TOC_NOTE, { width: 515, align: 'justify' });

      // --- SECTION 1: BUSINESS OVERVIEW AND REQUIREMENTS SUMMARY ---
      addPageBreak();
      renderMaroonSectionHeading('1. Business Overview and Requirements Summary');

      // Green highlighted background band for Business Overview
      const startY = doc.y;
      doc.rect(40, startY, 515, 24).fill('#DCFCE7');
      doc.fontSize(12).font('Times-Bold').fillColor('#15803D').text('Business Overview', 48, startY + 5);
      doc.y = startY + 30;
      doc.moveDown(0.3);

      renderParagraph("In the UK, there are three main credit reference agencies: Experian, Equifax, and TransUnion (formerly known as Callcredit). Each of these CRAs has slightly different ways of collecting and presenting information. Additionally, CRAs offer various services to help financial institutions manage credit risk, such as credit monitoring and risk management tools.");
      renderParagraph("Credit reference agencies (CRAs) collect and maintain information about businesses in addition to individuals' credit histories. The information provided by CRAs about corporate entities can include:");

      const overviewBullets = [
        'Credit accounts and outstanding debts',
        'Payment history and credit utilization',
        'Legal filings, such as bankruptcies, judgments, and liens',
        'Business registration information and ownership details',
        'Industry and business classification codes',
        'Financial data, such as revenue and number of employees',
        'Trade references and credit scores',
      ];
      for (const b of overviewBullets) renderBullet(b);
      doc.moveDown(0.4);

      renderParagraph("CRAs provide credit reports to lenders and other authorized parties, including corporate and institutional customers, to help them make informed credit decisions. By providing information about an individual or businesses' credit history, credit reference agencies help lenders assess creditworthiness and manage risk. For example, a lender may use a credit report to determine whether to approve a loan application, set the terms of a loan, or monitor the creditworthiness of an existing borrower.");
      renderParagraph("All of this information is used to create a credit report that provides a snapshot of a business's creditworthiness and financial history. Corporate and institutional customers can use this information to make informed credit decisions, such as whether to approve a loan application or set the terms of a loan. In addition, CRAs may offer various services to help corporate and institutional customers manage credit risk, such as credit monitoring and risk management tools.");
      renderParagraph("Regulatory Report carries monthly data (previous month's) to bureaus which includes Red Brand, CIIOM, FD, M&S and Harvey Nicholas. All products data which are eligible to be reported are shared with the bureaus on monthly basis including Loans, Mortgages, Credit Cards, Current Accounts.");

      doc.moveDown(0.5);
      doc.fontSize(11).font('Times-Bold').fillColor(darkGrey).text('Credit Rating Agencies Reporting Process', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Times-Italic').fillColor('#6B7280').text('[Structure-only placeholder for BA process details]');
      doc.moveDown(0.8);

      renderSubHeading('CRA Reporting – Process Workflow & Key Milestones');
      renderSubHeading('Purpose');
      renderParagraph('This document describes the end-to-end CRA Reporting / CAIS extract process, from staging data preparation through validations and final transmission to Credit Reference Agencies (CRAs). It clarifies the sequence of steps, ownership (BI/CUT/Transmission), and the key tables/outputs produced.');

      renderSubHeading('Scope');
      renderParagraph('Covers the monthly processing flow shown in the design diagram, including:');
      renderBullet('Retail and Cards staging preparation');
      renderBullet('Exclusions and Debt Sale handling');
      renderBullet('Staging validations and Address Processing');
      renderBullet('SAS/CADS processing and updates to key calculation views');
      renderBullet('Creation of CAIS outputs and loading to CAIS snapshot structures');
      renderBullet('Final validations, ad-hoc processing (if needed), and transmission to CRAs');
      doc.moveDown(0.4);

      renderSubHeading('Process Overview (High Level)');
      renderParagraph('Input feeds (Retail + Cards) are staged → exclusions applied → debt sale logic applied → staging validation performed → downstream SAS/CADS (Credit Analysis and Decisioning System) processing updates core CRA reporting tables → files are generated and loaded to CAIS snapshot structures → final validations occur → files are transmitted to CRAs.');

      // --- SECTION 1.1: CONCEPTUAL DATA FLOW DIAGRAM ---
      addPageBreak();
      renderMaroonSectionHeading('1.1 Conceptual Data Flow Diagram');
      renderParagraph('The diagram below illustrates the process of creating the extract.');
      doc.moveDown(0.4);

      // Embed Diagram A Image
      if (diagramAPng) {
        try {
          doc.image(diagramAPng, 40, doc.y, { fit: [515, 450], align: 'center' });
          doc.y += 455;
        } catch (e) {
          console.error('Error embedding Diagram A in PDF:', e);
        }
      }
      doc.moveDown(1);

      addPageBreak();
      renderSubHeading('Operational Swimlane & Manual Intervention Map (Diagram B)');
      if (diagramBPng) {
        try {
          doc.image(diagramBPng, 40, doc.y, { fit: [515, 480], align: 'center' });
          doc.y += 485;
        } catch (e) {
          console.error('Error embedding Diagram B in PDF:', e);
        }
      }
      doc.moveDown(1);

      addPageBreak();
      renderSubHeading('Detailed Process Steps (as per data flow)');

      const processSteps = [
        ['Step 1 — Retail Staging Table (Input preparation)', 'Description: Load/prepare retail staging dataset from upstream DWH/source feeds.\nOutput: Retail staging table ready for downstream exclusion and validation steps.\nOwner: BI'],
        ['Step 2 — Cards Staging Table (Input preparation)', 'Description: Load/prepare Cards staging dataset from upstream DWH/source feeds.\nOutput: Cards staging table ready for downstream exclusion and validation steps.\nOwner: BI'],
        ['Step 3 — Exclusions', 'Description: Apply exclusion rules (e.g., products/accounts not eligible for bureau reporting, policy-driven removals).\nDependency: Requires Retail/Cards staging prepared.\nOutput: Exclusion-adjusted datasets.\nOwner: CU team shares the exclusion file with BI'],
        ['Step 4 — Debt Sale', 'Description: Apply debt sale identification/treatment rules to ensure correct reporting of sold debts.\nDependency: Executes after exclusions.\nOutput: Dataset updated to reflect debt sale logic.\nOwner: CU team shares the debt sale file with BI'],
        ['Step 5 — Staging Table Validation', 'Description: Run validation checks on staging outputs (completeness, formats, key fields, reconciliation controls).\nDependency: After exclusions and debt sale.\nOutput: Validated staging dataset and/or exception reports.\nOwner: BI'],
        ['Step 6 — Address Processing', 'Description: Standardize and/or validate address-related fields used for bureau reporting.\nDependency: Triggered from staging validation step.\nOutput: Address-enriched dataset for downstream reporting.\nOwner: BI'],
      ];

      for (const [title, desc] of processSteps) {
        renderSubHeading(title);
        renderParagraph(desc);
      }

      renderSubHeading('Core Processing (SAS block)');
      renderParagraph('• Data Loaded to DWH_PDS_STAG for CADS (Credit Analysis and Decisioning System)\n  Description: Load validated/transformed data into DWH_PDS_STAG (CRA Staging Table) which becomes the base for subsequent processing.\n  Dependency: Staging validation complete.\n  Output: DWH_PDS_STAG populated for the processing month.\n  Owner: BI');
      renderParagraph('• CADS Processing\n  Description: Execute CADS processing logic using DWH_PDS_STAG as the base (as shown in the flow).\n  Output: CADS-derived outputs used downstream (and/or feeds into calculation updates).\n  Owner: CU Team');
      renderParagraph('• Update DWH_IP_ARRG_CALC_V\n  Description: Update calculation view/table DWH_IP_ARRG_CALC_V (includes CRA-relevant calculated variables; diagram indicates it is updated within the SAS processing block).\n  Dependency: Inputs from staging/CADS outputs.\n  Output: Updated DWH_IP_ARRG_CALC_V for the month.\n  Owner: CU team runs SAS datasets to populate DWH_IP_ARRG_CALC_V table.');

      renderSubHeading('File Creation and Loading to CAIS Final Data Mart');
      renderParagraph('• Create File from DWH_IP_ARRG_CALC_V\n  Description: Generate CRA extract file(s) based on the updated DWH_IP_ARRG_CALC_V.\n  Output: Intermediate CRA/CAIS-format file(s).\n  Owner: BI (file generation job)');
      renderParagraph('• Load CARDS data to CAIS Snap-Shot\n  Description: Load Cards-specific output into the CAIS snapshot structure (as per diagram label).\n  Output: CAIS snapshot populated with Cards.\n  Owner: BI');
      renderParagraph('• Load RETAIL data to CAIS Snap-Shot\n  Description: Load Retail-specific output into the CAIS snapshot structure.\n  Output: CAIS snapshot populated for Retail.\n  Owner: BI');

      renderSubHeading('Business Rules Validations');
      renderParagraph('Description: Perform final end to end validations prior to submission:\nOutput: Validation sign-off or exception list for remediation.\nOwner: BI & CU Team');
      renderParagraph('Validation Rules (Business Rules) are applied on the data at the end post all data load jobs of staging and snap are executed from BI perspective so that the data shared with bureaus is as per business acceptability standards. These Rules are applied on the CRA final data mart. Final validation on data volume for each and all exceptions are carried out by Stuart Lindsay and CU team. Any unusual variation/hike in the data found (if any) would allow for investigation from BI and CU side. The reasons for unusual data behavior would be analyzed and then concluded accordingly.');

      renderSubHeading('Ad-hoc File Processing (if required)');
      renderParagraph('Description: Non-standard intervention step used only when required (e.g., reruns, fixes for data issues, regeneration due to late changes).\nTrigger: Exceptions identified in validations or business sign-off requirements.\nOwner: BI / CUT (depending on the issue type)');

      renderSubHeading('File Transmitted to CRAs');
      renderParagraph('Description: Final files transmitted to bureaus/CRAs via Transmission route.\nMethod: BI pushes files to Transmission team server; Transmission sends via Connect:Direct.');

      // Yellow highlighted target path
      const pathY = doc.y;
      doc.rect(40, pathY, 515, 20).fill('#FEF08A');
      doc.fontSize(9.5).font('Times-Bold').fillColor('#854D0E').text('Target path (intermediate): /int2liv/feeds/CRP00006/data/', 48, pathY + 4);
      doc.y = pathY + 24;
      doc.moveDown(0.3);

      renderParagraph('Output: Files delivered to CRAs.\nOwner: Transmission team (with BI providing the files)');

      renderSubHeading('Operational Support / Escalation');
      renderParagraph('BI data issues: bi.live.support@hsbc.com\nCUT data quality issues: dataquality.cut@hsbc.co.in\nMailboxes are monitored daily');
      renderParagraph("BI Team does not directly send the file to bureaus, rather they are being routed to bureaus via connect direct (transmission team's server), BI team places/pushes the file on transmission team's server, post which they are sent to bureaus via UK Transmission team.");

      doc.moveDown(0.5);
      renderSubHeading('EXPERIAN EQUIFAX TU (Data Scope for Retail – Experian Recognized Codes for brand identification at UKBI Side)');

      // Table for Brand Identification Codes
      doc.fontSize(8.5).font('Times-Bold').fillColor(primaryRed);
      doc.text('Brand', 45, doc.y, { width: 180, continued: true });
      doc.text('Code', { width: 60, continued: true });
      doc.text('Identifier 1', { width: 110, continued: true });
      doc.text('Identifier 2', { width: 160 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const row of BRAND_IDENTIFICATION_CODES) {
        doc.moveDown(0.25);
        doc.text(row[0], 45, doc.y, { width: 180, continued: true });
        doc.text(row[1], { width: 60, continued: true });
        doc.text(row[2], { width: 110, continued: true });
        doc.text(row[3], { width: 160 });
      }

      // --- SECTION 1.2: RETAIL BRANDS STAGING ELEGIBILITY & EXCLUSION CRITERIA ---
      addPageBreak();
      renderMaroonSectionHeading('1.2 Retail Brands Staging Elegibility & Exclusion Criteria');

      renderSubHeading('DWH Source Tables for Loading Data into (CRA Retail Staging Table)');
      doc.fontSize(8.5).font('Times-Bold').fillColor(primaryRed);
      doc.text('DWH Core Tables', 45, doc.y, { width: 180, continued: true });
      doc.text('Source File', { width: 200, continued: true });
      doc.text('Source ITSO Name', { width: 130 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const row of DWH_SOURCE_TABLES) {
        doc.moveDown(0.25);
        doc.text(row[0], 45, doc.y, { width: 180, continued: true });
        doc.text(row[1], { width: 200, continued: true });
        doc.text(row[2], { width: 130 });
      }

      doc.moveDown(1);
      for (const block of BRAND_CRITERIA_BLOCKS) {
        renderSubHeading(`Pre-Requisite Inclusion Criteria for Data loading in CRA Staging Table (${block.brandName})`);
        for (const b of block.bullets) {
          renderBullet(b);
        }
        doc.moveDown(0.5);
      }

      renderSubHeading('Supported Products for CRA Data Reporting (Retail Banking)');
      doc.fontSize(8.5).font('Times-Bold').fillColor(primaryRed);
      doc.text('PDS (Product Codes)', 45, doc.y, { width: 160, continued: true });
      doc.text('Description', { width: 350 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const row of SUPPORTED_PRODUCTS) {
        doc.moveDown(0.25);
        doc.text(row[0], 45, doc.y, { width: 160, continued: true });
        doc.text(row[1], { width: 350 });
      }

      doc.moveDown(1);
      renderParagraph('Below mentioned are the source systems from which CRA (CAIS File Submission for Retail Banking) utilizes the data for reporting purpose: -');
      renderParagraph('CDU, PLM, BDRAS, OHC, RMS, BCDU');
      renderParagraph('CAIS File delivery for Retail is a joint effort from UKBIDWH and CUT Team. Dependency lies with CUT Team for 6 variable\'s data.');
      renderSubHeading('Listed below are the CUT Team Variables');
      const cutVars = ['Current Balance', 'Account Status', 'Flag Settings', 'Monthly Payment', 'Repayment Period', 'Payment Frequency'];
      for (const v of cutVars) renderBullet(v);

      doc.moveDown(0.8);
      renderSubHeading('Reference & Job Schedule Metadata');
      renderParagraph('CRA Staging Data Mart for CAIS File (Retail Banking): DWH_PDS_STAG (Monthly Data Truncate/Insert)\nCRA Staging Jobs Execution: 01st of every month\nCADS Processing Table (Retail Banking): DWH_IP_ARRG_CALC_V\nCU Status Execution (Start Date): 06th or 07th of every month\nCRA Final Data Mart for CAIS File (Retail Banking): DWH_CAIS_SMRY_SNAP\nCRA Validation Table (Retail Banking): DWH_CAIS_EXCEPTION\nReporting Frequency: Monthly\nBureau File Sharing Timelines (TU, Experian and Equifax): Mid-Month Tentatively');

      doc.moveDown(0.8);
      renderSubHeading('CAIS Variables (Retail Banking)');
      doc.fontSize(8.5).font('Times-Bold').fillColor(primaryRed);
      doc.text('S No.', 45, doc.y, { width: 60, continued: true });
      doc.text('UK Variables', { width: 450 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const row of CAIS_44_VARIABLES) {
        doc.moveDown(0.2);
        doc.text(row[0], 45, doc.y, { width: 60, continued: true });
        doc.text(row[1], { width: 450 });
      }

      // --- SECTION 1.3: VALIDATION RULES ---
      addPageBreak();
      renderMaroonSectionHeading('1.3 Validation Rules on snap prior to extract file is sent to the CRAs');
      renderParagraph('[Business rule content to be confirmed by BA]');

      // --- SECTIONS 3 THROUGH 14 (EXISTING APP SECTIONS) ---
      for (const sec of sections) {
        if (['1.1', '1.2', '1.3'].includes(sec.sectionNumber)) continue;

        addPageBreak();
        renderMaroonSectionHeading(`${sec.sectionNumber} ${sec.title || ''}`);

        if (sec.subSections) {
          for (const sub of sec.subSections) {
            if (sub.heading) {
              renderSubHeading(sub.heading);
            }
            let blocks: any[] = [];
            try {
              blocks = typeof sub.contentBlocks === 'string' ? JSON.parse(sub.contentBlocks) : sub.contentBlocks || [];
            } catch (e) {}

            for (const b of blocks) {
              if (b.type === 'paragraph') {
                renderParagraph(b.payload?.text || '');
              } else if (b.type === 'bullets') {
                for (const item of b.payload?.items || []) {
                  renderBullet(item);
                }
              }
            }
          }
        }
      }

      // --- SECTION 3 (CAIS CHANGE REGISTER) ---
      addPageBreak();
      renderMaroonSectionHeading('3 CAIS Change Register');
      renderParagraph('This section is an append-only historical register of all approved CAIS changes. The latest changes appear at the top. Earlier entries are never overwritten or deleted.');
      doc.moveDown(0.5);

      renderSubHeading('Master Change Log');
      doc.fontSize(8.5).font('Times-Bold').fillColor(primaryRed);
      doc.text('CR Ref', 40, doc.y, { width: 90, continued: true });
      doc.text('Title', { width: 180, continued: true });
      doc.text('Target Month', { width: 100, continued: true });
      doc.text('Status', { width: 100 });
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.3);

      doc.font('Times-Roman').fillColor(bodyGrey);
      for (const c of changes) {
        const displayStatus = c.status === 'REVISION_REQUESTED' ? 'SENT_BACK' : (c.status || 'DRAFT');
        doc.font('Times-Bold').text(c.crReference || ' ', 40, doc.y, { width: 90, continued: true });
        doc.font('Times-Roman').text(c.title || ' ', { width: 180, continued: true });
        doc.text(c.targetMonth || ' ', { width: 100, continued: true });

        if (displayStatus === 'APPROVED') doc.fillColor('#047857');
        else if (displayStatus === 'SENT_BACK') doc.fillColor('#B91C1C');
        else doc.fillColor('#6B21A8');

        doc.font('Times-Bold').text(displayStatus, { width: 100 });
        doc.fillColor(bodyGrey);
        doc.moveDown(0.25);
      }

      doc.moveDown(1);
      renderSubHeading('Detailed Change Entries');
      for (const c of changes) {
        const displayStatus = c.status === 'REVISION_REQUESTED' ? 'SENT_BACK' : (c.status || 'DRAFT');
        doc.fontSize(11).fillColor(primaryRed).font('Times-Bold').text(`${c.crReference} — ${c.title}`);
        doc.moveDown(0.3);

        const fields = [
          ['Status', displayStatus],
          ['Business Driver', c.businessDriver || ' '],
          ['Description', c.description || ' '],
          ['Sections Updated', c.sectionsUpdated || ' '],
          ['Before Logic', c.beforeText || ' '],
          ['After Logic', c.afterText || ' '],
          ['Impacted Bureaus', c.impactedBureaus || ' '],
          ['Impacted Fields', c.impactedDataItems || ' '],
          ['Target Month', c.targetMonth || ' '],
        ];

        for (const [k, v] of fields) {
          doc.fontSize(8.5).font('Times-Bold').fillColor(darkGrey).text(`${k}: `, 45, doc.y, { continued: true });
          doc.font('Times-Roman').fillColor(bodyGrey).text(cleanText(v));
        }
        doc.moveDown(0.8);
      }

      // --- DRAW DYNAMIC PAGE FURNITURE (HEADERS & FOOTERS) ON ALL PAGES ---
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Header (Content pages only, i >= 1)
        if (i >= 1) {
          doc.fontSize(8.5).font('Times-Bold').fillColor('#64748B').text('Data Engineering | Data Services', 40, 20, { lineBreak: false });
          // Header Rule
          doc.strokeColor('#CBD5E1').lineWidth(0.75).moveTo(40, 32).lineTo(555, 32).stroke();
          // Small Maroon Accent Block
          doc.rect(540, 29, 15, 5).fill(primaryRed);
        }

        // Footer (Every page including cover)
        doc.strokeColor('#CBD5E1').lineWidth(0.75).moveTo(40, 805).lineTo(555, 805).stroke();
        doc.rect(540, 802, 15, 5).fill(primaryRed);

        doc.fontSize(8).font('Times-Roman').fillColor('#64748B').text('© HSBC Operations, Services and Technology', 40, 812, { width: 300, align: 'left', lineBreak: false });
        doc.text(`Page ${i + 1} of ${totalPages}`, 350, 812, { width: 205, align: 'right', lineBreak: false });
        doc.fontSize(7.5).font('Times-Bold').fillColor('#94A3B8').text('RESTRICTED', 40, 824, { width: 515, align: 'center', lineBreak: false });
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="CRA_CAIS_Reporting_High_Level_Design.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
