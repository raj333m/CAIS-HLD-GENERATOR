import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { MASTER_SECTIONS } from '@/lib/sectionsData';
import { PREPOPULATED_CHANGES } from '@/app/api/changes/route';
import { getCloudChangeState, deletedIds, getCreatedChanges } from '@/lib/cloudStore';

const prisma = new PrismaClient();

// Helper to strip HTML tags and format text for PDFKit
function cleanText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/\[u\]/gi, '')
    .replace(/\[\/u\]/gi, '')
    .replace(/\uFFFD/g, '—')
    .replace(/\0/g, '');
}

export async function GET() {
  try {
    let sections: any[] = [];
    let changes: any[] = [];
    let attachments: any[] = [];

    try {
      sections = await prisma.documentSection.findMany({
        include: {
          subSections: { orderBy: { displayOrder: 'asc' } },
        },
        orderBy: { displayOrder: 'asc' },
      });
      changes = await prisma.caisChange.findMany({
        orderBy: { createdAt: 'desc' },
      });
      attachments = await prisma.documentAttachment.findMany({
        orderBy: { uploadedAt: 'desc' },
      });
    } catch (dbErr) {
      console.error('DB query failed in PDF export, using fallbacks:', dbErr);
    }

    if (!changes || changes.length === 0) {
      changes = PREPOPULATED_CHANGES;
    }

    // Merge cloud-created changes
    try {
      const cloudCreated = await getCreatedChanges();
      if (cloudCreated.length > 0) {
        const existingRefs = new Set(changes.map((c: any) => c.crReference));
        const newItems = cloudCreated.filter((c: any) => !existingRefs.has(c.crReference));
        changes = [...newItems, ...changes];
      }
    } catch (e) {}

    // Enrich with CloudStore state (status, review comments, approval date)
    const enrichedChanges = await Promise.all(
      changes.map(async (c: any) => {
        try {
          const cloudStateByRef = c.crReference ? await getCloudChangeState(c.crReference) : null;
          const cloudStateById = c.id ? await getCloudChangeState(c.id) : null;
          const isDeleted = (cloudStateByRef && cloudStateByRef.deleted) || (cloudStateById && cloudStateById.deleted) || deletedIds.has(c.id) || deletedIds.has(c.crReference);
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

    // Build PDFDocument
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: 'CRA CAIS Reporting High Level Design',
          Author: 'CAIS HLD Generator',
          Subject: 'UK CAIS Monthly Regulatory Reporting Process High Level Design',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Page Header / Rule Helper
      const primaryRed = '#C0272D';
      const darkGrey = '#202020';
      const midGrey = '#404040';

      // --- COVER PAGE ---
      doc.moveDown(4);
      doc.fontSize(22).fillColor(primaryRed).font('Helvetica-Bold').text('CRA CAIS Reporting High Level Design');
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor(darkGrey).font('Helvetica').text('High Level Design — Consolidated Document');
      doc.moveDown(2);

      doc.fontSize(10).fillColor(midGrey).text('Author: Aishwarya Raj Singh (Business Analyst)');
      doc.text('Date: 14 September 2026');
      doc.text('Version: 1.0 (Consolidated)');
      doc.moveDown(2);

      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#555555').text(
        'This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.',
        { width: 500, align: 'left' }
      );

      doc.moveDown(4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryRed).text('RESTRICTED — For Internal Company Use Only.');

      // --- DOCUMENT INFORMATION PAGE ---
      doc.addPage();
      doc.fontSize(16).fillColor(primaryRed).font('Helvetica-Bold').text('Document Information');
      doc.moveDown(0.5);
      doc.strokeColor(primaryRed).lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(12).fillColor(darkGrey).font('Helvetica-Bold').text('Involved Parties');
      doc.moveDown(0.5);

      const parties = [
        ['Manash R Chanda', 'UKBI POD Lead'],
        ['Swapnil Kalidas Sankpal', 'Tech Lead'],
        ['Vishnu Vardhan', 'Senior Developer'],
        ['Aishwarya Raj Singh', 'Business Analyst'],
        ['Narsimha Chary', 'UKBI ITPM'],
      ];

      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkGrey);
      doc.text('Name', 45, doc.y, { width: 200, continued: true });
      doc.text('Role', { width: 300 });
      doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();

      doc.font('Helvetica').fillColor('#333333');
      for (const [name, role] of parties) {
        doc.moveDown(0.3);
        doc.text(name, 45, doc.y, { width: 200, continued: true });
        doc.text(role, { width: 300 });
      }

      doc.moveDown(1.5);
      doc.fontSize(12).fillColor(darkGrey).font('Helvetica-Bold').text('Revision History');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#555555').text('Tracks revisions to document structure. Individual CAIS changes are logged in Section 3.');
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').fillColor(darkGrey);
      doc.text('Version 1.0  |  14/09/2026  |  Aishwarya Raj Singh  |  Initial consolidated HLD created');
      doc.moveDown(1.5);

      doc.fontSize(12).fillColor(darkGrey).font('Helvetica-Bold').text('Reviewed By');
      doc.moveDown(0.5);
      doc.font('Helvetica').fillColor('#333333');
      doc.text('• Stuart H Lindsay — Product Owner UK Bureau (14/09/2026)');
      doc.text('• Suranjita Saha — CU Team Lead (14/09/2026)');
      doc.text('• Manash R Chanda — UKBI Design Manager (14/09/2026)');

      // --- SECTIONS 1 & 2 CONTENT ---
      for (const sec of sections) {
        doc.addPage();
        if (sec.sectionNumber === '1.1') {
          doc.fontSize(18).fillColor(primaryRed).font('Helvetica-Bold').text('1 Requirements and Data');
          doc.moveDown(0.5);
        } else if (sec.sectionNumber === '2.1') {
          doc.fontSize(18).fillColor(primaryRed).font('Helvetica-Bold').text('2 Approach, Modelling and Mappings');
          doc.moveDown(0.5);
        }

        doc.fontSize(13).fillColor(darkGrey).font('Helvetica-Bold').text(sec.title || `Section ${sec.sectionNumber}`);
        doc.moveDown(0.5);

        if (sec.subSections) {
          for (const sub of sec.subSections) {
            if (sub.heading) {
              doc.fontSize(11).fillColor(primaryRed).font('Helvetica-Bold').text(sub.heading);
              doc.moveDown(0.3);
            }

            let blocks: any[] = [];
            try {
              blocks = typeof sub.contentBlocks === 'string' ? JSON.parse(sub.contentBlocks) : sub.contentBlocks || [];
            } catch (e) {}

            for (const b of blocks) {
              if (b.type === 'paragraph') {
                doc.fontSize(9.5).font('Helvetica').fillColor('#1A1A1A').text(cleanText(b.payload?.text || ''), { align: 'left', lineGap: 2 });
                doc.moveDown(0.4);
              } else if (b.type === 'bullets') {
                for (const item of b.payload?.items || []) {
                  doc.fontSize(9.5).font('Helvetica').fillColor('#1A1A1A').text(`•  ${cleanText(item)}`, { indent: 10, lineGap: 2 });
                }
                doc.moveDown(0.4);
              } else if (b.type === 'table' || b.type === 'rule-table') {
                doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#666666').text('[Structured Specification Table — see live HLD document viewer / DOCX download for interactive layout]');
                doc.moveDown(0.4);
              }
            }
          }
        }
      }

      // --- SECTION 3: CAIS CHANGE REGISTER ---
      doc.addPage();
      doc.fontSize(18).fillColor(primaryRed).font('Helvetica-Bold').text('3 CAIS Change Register');
      doc.moveDown(0.5);
      doc.strokeColor(primaryRed).lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      doc.fontSize(9.5).font('Helvetica').fillColor('#333333').text('This section is an append-only historical register of all approved CAIS changes. The latest changes appear at the top. Earlier entries are never overwritten or deleted.');
      doc.moveDown(1);

      doc.fontSize(13).fillColor(darkGrey).font('Helvetica-Bold').text('Master Change Log');
      doc.moveDown(0.5);

      // Table Header
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryRed);
      doc.text('CR Ref', 40, doc.y, { width: 90, continued: true });
      doc.text('Title', { width: 180, continued: true });
      doc.text('Target Month', { width: 100, continued: true });
      doc.text('Status', { width: 100 });
      doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
      doc.moveDown(0.4);

      doc.fontSize(8.5).font('Helvetica').fillColor('#1A1A1A');
      for (const c of changes) {
        const displayStatus = c.status === 'REVISION_REQUESTED' ? 'SENT_BACK' : (c.status || 'DRAFT');
        doc.font('Helvetica-Bold').text(c.crReference || ' ', 40, doc.y, { width: 90, continued: true });
        doc.font('Helvetica').text(c.title || ' ', { width: 180, continued: true });
        doc.text(c.targetMonth || ' ', { width: 100, continued: true });
        
        if (displayStatus === 'APPROVED') doc.fillColor('#047857');
        else if (displayStatus === 'SENT_BACK') doc.fillColor('#B91C1C');
        else doc.fillColor('#6B21A8');
        
        doc.font('Helvetica-Bold').text(displayStatus, { width: 100 });
        doc.fillColor('#1A1A1A');
        doc.moveDown(0.3);
      }

      doc.moveDown(1.5);
      doc.fontSize(13).fillColor(darkGrey).font('Helvetica-Bold').text('Detailed Change Entries');
      doc.moveDown(0.5);

      for (const c of changes) {
        const displayStatus = c.status === 'REVISION_REQUESTED' ? 'SENT_BACK' : (c.status || 'DRAFT');
        doc.fontSize(11).fillColor(primaryRed).font('Helvetica-Bold').text(`${c.crReference} — ${c.title}`);
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
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor(darkGrey).text(`${k}: `, 45, doc.y, { continued: true });
          doc.font('Helvetica').fillColor('#333333').text(cleanText(v));
        }
        doc.moveDown(0.8);
      }

      // --- SECTION 4: APPENDIX ---
      doc.addPage();
      doc.fontSize(18).fillColor(primaryRed).font('Helvetica-Bold').text('4 Appendix & Glossary');
      doc.moveDown(0.5);
      doc.fontSize(9.5).font('Helvetica').fillColor('#333333').text('Standard reference terms for UK Credit Account Information Sharing (CAIS) regulatory reporting.');
      doc.moveDown(1);

      const glossary = [
        ['CAIS', 'Credit Account Information Sharing scheme under UK CRA reciprocal reporting.'],
        ['CRA', 'Credit Reference Agency (Experian, Equifax, TransUnion).'],
        ['CADS', 'Credit Analysis and Decisioning System (SAS derived calculated variables).'],
        ['BI Team', 'Business Intelligence / Data Warehouse team (owns staging, validation, snapshot).'],
        ['CU Team', 'Central Utility Team (owns exclusions, debt sale, 6 derived variables).'],
      ];

      for (const [term, def] of glossary) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryRed).text(`${term}: `, 40, doc.y, { continued: true });
        doc.font('Helvetica').fillColor('#333333').text(def);
        doc.moveDown(0.3);
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
