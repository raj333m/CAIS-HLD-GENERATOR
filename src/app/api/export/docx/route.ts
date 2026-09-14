import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
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
  TableOfContents,
} from 'docx';

const prisma = new PrismaClient();

// Helper styling functions per spec exact values
const COLOR_PRIMARY_RED = 'C0272D';
const COLOR_DARK_GREY = '202020';
const COLOR_BODY_TEXT = '1A1A1A';
const COLOR_MID_GREY = '404040';
const COLOR_HEADER_GREY = '606060';
const COLOR_FOOTER_GREY = '808080';
const COLOR_ALT_BG = 'F2F2F2';
const COLOR_BORDER = 'CCCCCC';

function cleanText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '') // Strip inline HTML tags (<u>, </u>, <b>, </i>)
    .replace(/\[u\]/gi, '') // Strip BBCode underline tags
    .replace(/\[\/u\]/gi, '')
    .replace(/\uFFFD/g, '—')
    .replace(/\0/g, '');
}

function makeH1(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    spacing: { before: 240, after: 120 }, // 12pt before, 6pt after
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
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
    spacing: { before: 180, after: 80 }, // 9pt before, 4pt after
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
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
    spacing: { before: 120, after: 60 }, // 6pt before, 3pt after
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
        size: 23, // 11.5pt
        bold: true,
        italics: true,
        color: COLOR_DARK_GREY,
      }),
    ],
  });
}

function makeH4(text: string, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    pageBreakBefore,
    spacing: { before: 80, after: 40 }, // 4pt before, 2pt after
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
        size: 22, // 11pt
        bold: true,
        color: COLOR_MID_GREY,
      }),
    ],
  });
}

function makeP(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 120, line: 276 }, // 1.15 line spacing, 6pt space after
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
        size: 22, // 11pt
        color: COLOR_BODY_TEXT,
        underline: undefined,
      }),
    ],
  });
}

function makeBullet(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 60, line: 276 },
    indent: { left: 360 },
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: '•  ',
        font: 'Calibri',
        size: 22,
        bold: true,
        color: COLOR_PRIMARY_RED,
      }),
      new TextRun({
        text: cleanText(text),
        font: 'Calibri',
        size: 22, // 11pt
        color: COLOR_BODY_TEXT,
        underline: undefined,
      }),
    ],
  });
}

function makeNoteBox(noteText: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_ALT_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'NOTE: ',
                    bold: true,
                    italics: true,
                    font: 'Calibri',
                    size: 20, // 10pt
                    color: COLOR_BODY_TEXT,
                  }),
                  new TextRun({
                    text: cleanText(noteText),
                    italics: true,
                    font: 'Calibri',
                    size: 20, // 10pt
                    color: COLOR_BODY_TEXT,
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

  // Header row
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
                    font: 'Calibri',
                    size: 22, // 11pt
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  // Body rows with alternating white / light grey
  (rows || []).forEach((r, idx) => {
    const isAlt = idx % 2 === 1;
    tableRows.push(
      new TableRow({
        children: (r || []).map(
          (cell) =>
            new TableCell({
              shading: isAlt ? { fill: COLOR_ALT_BG, type: ShadingType.CLEAR } : undefined,
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
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
                      font: 'Calibri',
                      size: 22, // 11pt
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

// Convert JSON blocks to docx elements (rendering diagrams as real embedded PNG images)
function renderBlocksToDocx(blocksJsonStr: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  try {
    const blocks = typeof blocksJsonStr === 'string' ? JSON.parse(blocksJsonStr) : blocksJsonStr || [];
    for (const b of blocks) {
      if (b.type === 'paragraph') {
        const lines = (b.payload.text || '').split('\n');
        for (const line of lines) {
          elements.push(makeP(line));
        }
      } else if (b.type === 'bullets') {
        for (const item of b.payload.items || []) {
          elements.push(makeBullet(item));
        }
      } else if (b.type === 'table') {
        elements.push(makeCustomTable(b.payload.headers || [], b.payload.rows || []));
      } else if (b.type === 'rule-table') {
        const rows = (b.payload?.rows || []).map((r: any) => [
          String(r.num || ''),
          r.category || '',
          r.condition || '',
          r.keyFields || '',
        ]);
        elements.push(makeCustomTable(['#', 'Category', 'Condition', 'Key Field(s)'], rows));
      } else if (b.type === 'diagram') {
        const key = b.payload.imageKey || 'conceptual';
        const imgPath = path.join(process.cwd(), 'public', 'diagrams', `${key}.png`);
        if (fs.existsSync(imgPath)) {
          const imgBuffer = fs.readFileSync(imgPath);
          const isConceptual = key === 'conceptual';
          elements.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 120 },
              children: [
                new ImageRun({
                  data: imgBuffer,
                  type: 'png',
                  transformation: {
                    width: 440,
                    height: isConceptual ? 348 : 312,
                  },
                  altText: {
                    title: 'Diagram',
                    description: b.payload.caption || 'Process Flow Diagram',
                    name: 'Diagram',
                  },
                }),
              ],
            })
          );
        }
        if (b.payload.caption) {
          elements.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 240 },
              children: [
                new TextRun({
                  text: cleanText(b.payload.caption),
                  font: 'Calibri',
                  size: 18, // 9pt
                  italics: true,
                  color: COLOR_HEADER_GREY,
                }),
              ],
            })
          );
        }
      } else if (b.type === 'pie-chart') {
        const total = b.payload?.totalFields || 44;
        const cuCount = (b.payload?.cuOwnedFields || []).length || 6;
        const biCount = total - cuCount;
        const cuPct = Math.round((cuCount / total) * 100);
        const biPct = 100 - cuPct;

        elements.push(makeH3(b.payload?.title || 'Data Variables Accountability (Final Data Mart)'));
        elements.push(
          makeCustomTable(
            ['Team / Scope', 'Field Count', 'Percentage of 44 Fields'],
            [
              ['BI Scope (Staging, Validation & File Generation)', String(biCount), `${biPct}%`],
              ['CU Team Scope (Exclusions & Derived Variables)', String(cuCount), `${cuPct}%`],
              ['Total CAIS Report Layout', String(total), '100%'],
            ]
          )
        );
        if (b.payload?.caption) {
          elements.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 240 },
              children: [
                new TextRun({
                  text: cleanText(b.payload.caption),
                  font: 'Calibri',
                  size: 18,
                  italics: true,
                  color: COLOR_HEADER_GREY,
                }),
              ],
            })
          );
        }
      }
    }
  } catch (e) {
    elements.push(makeP(String(blocksJsonStr)));
  }
  return elements;
}

import { MASTER_SECTIONS } from '@/lib/sectionsData';
import { PREPOPULATED_CHANGES } from '@/app/api/changes/route';
import { getCloudChangeState, deletedIds, getCreatedChanges } from '@/lib/cloudStore';

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
      console.error('DB query failed in DOCX export, using fallbacks:', dbErr);
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

    const secMap: Record<string, any> = {};
    sections.forEach((s) => {
      secMap[s.sectionNumber] = s;
    });

    const docChildren: any[] = [];

    // --- 1. COVER PAGE ---
    for (let i = 0; i < 4; i++) {
      docChildren.push(new Paragraph({ text: '' }));
    }

    docChildren.push(
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: 'CRA CAIS Reporting High Level Design',
            bold: true,
            size: 48, // 24pt
            font: 'Calibri',
            color: COLOR_BODY_TEXT,
          }),
        ],
      })
    );

    docChildren.push(
      new Paragraph({
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: 'High Level Design — Consolidated Document',
            size: 24, // 12pt
            font: 'Calibri',
            color: COLOR_MID_GREY,
          }),
        ],
      })
    );

    docChildren.push(makeP('Author: [Author Name]'));
    docChildren.push(makeP('Date: [DD Month YYYY]'));
    docChildren.push(makeP('Version: [x.x]'));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      new Paragraph({
        spacing: { after: 480 },
        children: [
          new TextRun({
            text: 'This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.',
            italics: true,
            size: 20, // 10pt
            font: 'Calibri',
            color: COLOR_MID_GREY,
          }),
        ],
      })
    );

    for (let i = 0; i < 4; i++) {
      docChildren.push(new Paragraph({ text: '' }));
    }

    docChildren.push(
      new Paragraph({
        border: {
          top: { color: COLOR_PRIMARY_RED, space: 6, style: BorderStyle.SINGLE, size: 8 },
        },
        spacing: { before: 160, after: 0 },
        children: [
          new TextRun({
            text: 'Restricted — for internal company use only. Replace bracketed placeholders before circulating.',
            italics: true,
            size: 18, // 9pt
            font: 'Calibri',
            color: COLOR_FOOTER_GREY,
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
      makeP('This tracks revisions to the document as a whole (structure, ownership, scope). Individual CAIS changes are logged in Section 3 — CAIS Change Register, not here.')
    );
    docChildren.push(
      makeCustomTable(
        ['Version', 'Date', 'Updated By', 'Reason for Issue'],
        [
          ['1.0', '14/09/2026', 'Aishwarya Raj Singh', 'Initial consolidated HLD created'],
          [' ', ' ', ' ', ' '],
        ]
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
    docChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: '(Right-click below and choose "Update Field" — or press Ctrl+A then F9 — to update this Table of Contents in Word.)',
            italics: true,
            size: 18, // 9pt
            font: 'Calibri',
            color: COLOR_FOOTER_GREY,
          }),
        ],
      })
    );

    docChildren.push(
      new TableOfContents('Table of Contents', {
        hyperlink: true,
        headingStyleRange: '1-3',
      })
    );

    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(
      makeNoteBox(
        'This template is used for all levels of CAIS change — major projects and small enhancements alike. Sections 1 (Requirements and Data) and 2 (Approach, Modelling and Mappings) are the living, current-state reference design: when a change modifies a requirement, a rule, a data item, or an aspect of the approach or modelling, the relevant sub-section is updated in place so the document always reflects current-state truth. Section 3 (CAIS Change Register) is the append-only historical record of every change ever made — newest first — and is never overwritten. N/A may be entered for sub-sections not applicable to a given change, with an accompanying reason.'
      )
    );

    // --- 4. SECTIONS 1 & 2 LIVING SECTIONS ---
    const sectionConfigs = [
      { num: '1.1', parent: '1 Requirements and Data', parentNum: '1' },
      { num: '1.2' },
      { num: '1.3' },
      { num: '1.4' },
      { num: '1.5' },
      { num: '2.1', parent: '2 Approach, Modelling and Mappings', parentNum: '2' },
      { num: '2.2' },
      { num: '2.3' },
      { num: '2.4' },
      { num: '2.5' },
      { num: '2.6' },
    ];

    let currentParentNum = '';

    for (const cfg of sectionConfigs) {
      if (cfg.parentNum && cfg.parentNum !== currentParentNum) {
        currentParentNum = cfg.parentNum;
        docChildren.push(makeH1(cfg.parent, true));
        const secObj = secMap[cfg.num];
        if (secObj) {
          docChildren.push(makeH2(secObj.title));

          if (secObj.subSections) {
            for (const sub of secObj.subSections) {
              if (sub.heading) {
                docChildren.push(makeH3(sub.heading));
              }
              const subElements = renderBlocksToDocx(sub.contentBlocks);
              docChildren.push(...subElements);
            }
          }
        }
      } else {
        const secObj = secMap[cfg.num];
        if (secObj) {
          docChildren.push(makeH2(secObj.title, true));

          if (secObj.subSections) {
            for (const sub of secObj.subSections) {
              if (sub.heading) {
                docChildren.push(makeH3(sub.heading));
              }
              const subElements = renderBlocksToDocx(sub.contentBlocks);
              docChildren.push(...subElements);
            }
          }
        }
      }
    }

    // --- 5. SECTION 3: CAIS CHANGE REGISTER ---
    docChildren.push(makeH1('3 CAIS Change Register', true));
    docChildren.push(
      makeP('This section is an append-only historical register of all approved CAIS changes. The latest changes appear at the top. Earlier entries are never overwritten or deleted.')
    );
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

    // Template row
    changeLogRows.push(['[Next Reference]', '[Change Title]', '[Change Type]', '[Bureaus]', '[Target Month]', 'Draft']);

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
            ['Reviewed / Approved By', '[Name]'],
          ]
        )
      );
      docChildren.push(new Paragraph({ text: '' }));
    }

    // Template entry for next change
    docChildren.push(makeH3('[Next Change Reference] — [Change Title]', true));
    docChildren.push(
      makeCustomTable(
        ['Field', 'Value'],
        [
          ['Business / Regulatory Driver', '[CAIS standard update, FCA requirement, internal remediation, new product scope, etc.]'],
          ['Description of Change', '[Detailed summary of the proposed modification]'],
          ['Section(s) Updated', '[e.g. 1.3, 2.5]'],
          ['Before Logic', '[Current state baseline processing logic]'],
          ['After Logic', '[Proposed to-be processing logic]'],
          ['Impacted Bureaus', '[Experian, Equifax, TransUnion]'],
          ['Impacted CAIS Fields', '[List of impacted S. No. fields]'],
          ['Target Month', '[Target Month YYYY]'],
          ['Status', 'Draft'],
          ['Reviewed / Approved By', '[Name]'],
        ]
      )
    );
    docChildren.push(new Paragraph({ text: '' }));

    // --- 6. SECTION 4: APPENDIX ---
    docChildren.push(makeH1('4 Appendix', true));
    docChildren.push(
      makeP('This section provides supporting reference materials, technical definitions, glossary terms, and operational contact points for the CRA CAIS monthly reporting process.')
    );
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('4.1 Glossary & Abbreviations'));
    const glossaryHeaders = ['Term', 'Definition'];
    const glossaryRows = [
      ['CAIS', 'Credit Account Information Sharing — the UK reciprocal data-sharing scheme under which lenders submit account-level performance data to credit reference agencies on a monthly basis.'],
      ['CRA', 'Credit Reference Agency — in the UK, principally Experian, Equifax, and TransUnion.'],
      ['CADS', 'Credit Analysis and Decisioning System — the SAS-based processing that derives the six CU-owned calculated variables.'],
      ['BI', 'Business Intelligence (UK BI Data Warehouse team) — owns staging, validation and file-generation for the CAIS pipeline.'],
      ['CU Team', 'Central Utility Team — owns exclusions, debt-sale treatment, and the six CU-derived calculated variables.'],
      ['Forbearance', "A temporary arrangement (such as a payment holiday) that varies a customer's contractual repayment obligations, typically in response to financial difficulty."],
      ['Debt Sale', "The sale of a defaulted account's outstanding debt to a third-party collection agency; reported to bureaus as a Debt Sale record, typically with a Delete marker."],
      ['Positive Data Sharing Indicator', "A flag controlling whether a given account's data is eligible for reciprocal (positive) reporting to the bureaus, as distinct from default-only reporting."],
      ['PDS1 / Gleam', 'The two product hierarchy codes (938 and 937 respectively) used to classify Retail Banking products as eligible for CRA reporting.'],
      ['Connect:Direct', 'The secure file-transfer mechanism used by the Transmission team to deliver CAIS extract files to the bureaus.'],
      ['PLM', 'Product Ledger Management.'],
      ['BDRAS', 'Bad Debt Reporting and Accounting System.'],
      ['RMS', 'Risk Management System.'],
      ['PDS (Product Code)', 'The CAIS product type code used in the Supported Products for CRA Data Reporting table (e.g. 02, 05, 15) — distinct from PDS1 / Gleam above, which refers to the product hierarchy classification, not the product code itself.'],
      ['DWH_PDS_STAG', 'CRA Staging Table for Retail Banking.'],
      ['DWH_CAIS_SMRY_SNAP', 'CRA Final Data Mart for Retail Banking.'],
      ['BCDU', 'Bank Cards Data Utility.'],
      ['CDU', 'Customer Data Utility.'],
      ['OHC', 'Cards Source File.'],
      ['FD', 'First Direct.'],
      ['M&S', 'Marks and Spencer.'],
    ];
    docChildren.push(makeCustomTable(glossaryHeaders, glossaryRows));
    docChildren.push(new Paragraph({ text: '' }));

    docChildren.push(makeH2('4.2 Operational & Support Enquiries'));
    docChildren.push(makeP('For operational enquiries, data quality exceptions, or technical escalations, contact:'));
    docChildren.push(makeBullet('BI Data Warehouse Support: [bi.support mailbox]'));
    docChildren.push(makeBullet('CU Data Quality & CADS Team: [dataquality.cut mailbox]'));
    docChildren.push(
      makeP('Escalation path: Where an issue cannot be resolved at first line, or where a regulatory deadline is at risk, escalation should be raised to the Product Owner (Risk CRA) and the Transmission team in parallel.')
    );

    // Assemble Document with single continuous section, header, and footer
    const doc = new Document({
      title: 'CRA CAIS Reporting High Level Design',
      subject: 'Consolidated High Level Design Document',
      creator: 'CAIS HLD Generator',
      description: 'UK CAIS Monthly Regulatory Reporting Process High Level Design',
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: {
              font: 'Calibri',
              size: 22,
              color: COLOR_BODY_TEXT,
            },
            paragraph: {
              spacing: { before: 0, after: 120, line: 276 },
            },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            run: {
              font: 'Calibri',
              size: 32,
              bold: true,
              color: COLOR_PRIMARY_RED,
            },
            paragraph: {
              spacing: { before: 240, after: 120 },
            },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            run: {
              font: 'Calibri',
              size: 26,
              bold: true,
              color: COLOR_DARK_GREY,
            },
            paragraph: {
              spacing: { before: 180, after: 80 },
            },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            run: {
              font: 'Calibri',
              size: 23,
              bold: true,
              italics: true,
              color: COLOR_DARK_GREY,
            },
            paragraph: {
              spacing: { before: 120, after: 60 },
            },
          },
          {
            id: 'Heading4',
            name: 'Heading 4',
            run: {
              font: 'Calibri',
              size: 22,
              bold: true,
              color: COLOR_MID_GREY,
            },
            paragraph: {
              spacing: { before: 80, after: 40 },
            },
          },
          {
            id: 'TOC1',
            name: 'toc 1',
            run: {
              font: 'Calibri',
              size: 22,
              bold: true,
              color: COLOR_BODY_TEXT,
            },
            paragraph: {
              spacing: { before: 120, after: 60 },
            },
          },
          {
            id: 'TOC2',
            name: 'toc 2',
            run: {
              font: 'Calibri',
              size: 22,
              bold: false,
              color: COLOR_BODY_TEXT,
            },
            paragraph: {
              indent: { left: 360 },
              spacing: { before: 60, after: 60 },
            },
          },
          {
            id: 'TOC3',
            name: 'toc 3',
            run: {
              font: 'Calibri',
              size: 22,
              bold: false,
              color: COLOR_BODY_TEXT,
            },
            paragraph: {
              indent: { left: 720 },
              spacing: { before: 60, after: 60 },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906, // A4 width DXA
                height: 16838, // A4 height DXA
              },
              margin: {
                top: 994, // ~0.69 inches
                bottom: 994,
                left: 907, // ~0.63 inches
                right: 907,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  border: {
                    bottom: { color: COLOR_PRIMARY_RED, space: 4, style: BorderStyle.SINGLE, size: 8 },
                  },
                  spacing: { after: 120 },
                  children: [
                    new TextRun({
                      text: 'Data Engineering | Data Services',
                      font: 'Calibri',
                      size: 18, // 9pt
                      color: COLOR_HEADER_GREY,
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
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: { color: COLOR_PRIMARY_RED, space: 4, style: BorderStyle.SINGLE, size: 8 },
                  },
                  spacing: { before: 120 },
                  children: [
                    new TextRun({
                      text: 'RESTRICTED — Internal Use Only    Page ',
                      font: 'Calibri',
                      size: 16, // 8pt
                      color: COLOR_FOOTER_GREY,
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: 'Calibri',
                      size: 16, // 8pt
                      color: COLOR_FOOTER_GREY,
                    }),
                    new TextRun({
                      text: ' of ',
                      font: 'Calibri',
                      size: 16,
                      color: COLOR_FOOTER_GREY,
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      font: 'Calibri',
                      size: 16,
                      color: COLOR_FOOTER_GREY,
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
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="CRA_CAIS_Reporting_High_Level_Design.docx"',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Word Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
