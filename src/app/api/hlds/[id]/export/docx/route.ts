import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  ShadingType,
  AlignmentType,
  PageNumber,
  Header,
  Footer,
  BorderStyle,
  TableOfContents,
} from 'docx';

function cleanText(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '') // Strip inline HTML tags (<u>, </u>, <b>, </i>)
    .replace(/\[u\]/gi, '') // Strip BBCode underline tags
    .replace(/\[\/u\]/gi, '')
    .replace(/\uFFFD/g, '—')
    .replace(/\0/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hld = await db.hldDocument.findUnique({
      where: { id },
      include: {
        createdBy: true,
        reviewedBy: true,
        dataItemImpacts: { include: { dataItem: true } },
        bureauNotes: { include: { bureau: true } },
        risks: true,
        stakeholders: true,
      },
    });

    if (!hld) {
      return NextResponse.json({ error: 'HLD not found' }, { status: 404 });
    }

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(hld.content);
    } catch (e) {
      // fallback
    }

    // Helper styling functions
    const h1 = (text: string, pageBreakBefore = false) =>
      new Paragraph({
        pageBreakBefore,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: cleanText(text), bold: true, color: 'C0272D', size: 32, font: 'Calibri' })],
      });

    const h2 = (text: string, pageBreakBefore = false) =>
      new Paragraph({
        pageBreakBefore,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
        children: [new TextRun({ text: cleanText(text), bold: true, color: '202020', size: 26, font: 'Calibri' })],
      });

    const p = (text: string) =>
      new Paragraph({
        spacing: { before: 0, after: 120, line: 276 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: cleanText(text), size: 22, font: 'Calibri', color: '1A1A1A', underline: undefined })],
      });

    const bullet = (text: string) =>
      new Paragraph({
        spacing: { before: 0, after: 60, line: 276 },
        indent: { left: 360 },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: '•  ', font: 'Calibri', size: 22, bold: true, color: 'C0272D' }),
          new TextRun({ text: cleanText(text), font: 'Calibri', size: 22, color: '1A1A1A', underline: undefined }),
        ],
      });

    // 1. Title & Header
    const titleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: cleanText(hld.title),
          bold: true,
          size: 32,
          font: 'Calibri',
          color: 'C0272D',
        }),
      ],
    });

    const subTitleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `High-Level Design Document | ${cleanText(hld.changeReference)}`,
          italics: true,
          size: 24,
          font: 'Calibri',
          color: '404040',
        }),
      ],
    });

    // 2. Document Control Table
    const docControlTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'C0272D', type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: 'Field', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })],
            }),
            new TableCell({
              shading: { fill: 'C0272D', type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })],
            }),
          ],
        }),
        new TableRow({ children: [new TableCell({ children: [p('Document Title')] }), new TableCell({ children: [p(hld.title)] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Change Reference')] }), new TableCell({ children: [p(hld.changeReference)] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Status')] }), new TableCell({ children: [p(hld.status)] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Author / BA')] }), new TableCell({ children: [p(hld.createdBy?.name || 'BA Author')] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Reviewer')] }), new TableCell({ children: [p(hld.reviewedBy?.name || 'Unassigned')] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Target Implementation Month')] }), new TableCell({ children: [p(hld.targetMonth)] })] }),
        new TableRow({ children: [new TableCell({ children: [p('Document Version')] }), new TableCell({ children: [p(`v${hld.version}.0`)] })] }),
      ],
    });

    // 3. Data Item Impact Table
    const impactRows = [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'CAIS Item', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Current Definition', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'New / Changed Definition', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Source System', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Bureaus', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
        ],
      }),
    ];

    hld.dataItemImpacts.forEach((imp: any) => {
      const name = imp.dataItem?.itemName || imp.customItemName || 'Data Item';
      const bureaus = [
        imp.appliesToExperian ? 'EXP' : null,
        imp.appliesToEquifax ? 'EQF' : null,
        imp.appliesToTransunion ? 'TU' : null,
      ].filter(Boolean).join(', ');

      impactRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [p(name)] }),
            new TableCell({ children: [p(imp.currentDefinition || '-')] }),
            new TableCell({ children: [p(imp.newDefinition || '-')] }),
            new TableCell({ children: [p(imp.sourceSystem || '-')] }),
            new TableCell({ children: [p(bureaus || 'All')] }),
          ],
        })
      );
    });

    const dataItemTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: impactRows,
    });

    // 4. Bureau Considerations Table
    const bureauRows = [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Bureau', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Format / Spec Version', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Cut-off Date', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Target Go-Live Date', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Bureau Notes', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
        ],
      }),
    ];

    hld.bureauNotes.forEach((bn: any) => {
      bureauRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [p(bn.bureau.name)] }),
            new TableCell({ children: [p(`${bn.bureau.fileFormat} (${bn.bureau.fileSpecVersion})`)] }),
            new TableCell({ children: [p(bn.bureau.cutoffDate)] }),
            new TableCell({ children: [p(bn.targetDate || hld.targetMonth)] }),
            new TableCell({ children: [p(bn.notes || 'Standard compliance')] }),
          ],
        })
      );
    });

    const bureauTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: bureauRows,
    });

    // 5. Risks Table
    const riskRows = [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Risk Description', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Impact', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
          new TableCell({ shading: { fill: 'C0272D', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Mitigation Plan', bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })] })] }),
        ],
      }),
    ];

    hld.risks.forEach((r: any) => {
      riskRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [p(r.risk)] }),
            new TableCell({ children: [p(r.impact)] }),
            new TableCell({ children: [p(r.mitigation)] }),
          ],
        })
      );
    });

    const riskTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: riskRows,
    });

    // Diagram Box
    const diagramBox = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: '📊 SOURCE-TO-BUREAU DATA FLOW DIAGRAM', bold: true, color: 'C0272D', size: 22, font: 'Calibri' }),
                  ],
                  spacing: { before: 100, after: 100 },
                }),
                p(parsedContent.dataFlow?.diagramSpecification || hld.sourceToBureauFlow || 'Data flow diagram specification.'),
              ],
            }),
          ],
        }),
      ],
    });

    // Assemble Document
    const doc = new Document({
      features: {
        updateFields: true,
      },
      title: cleanText(hld.title),
      subject: cleanText(hld.changeReference),
      creator: 'CAIS HLD Generator',
      description: cleanText(hld.description),
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  border: { bottom: { color: 'C0272D', space: 4, style: BorderStyle.SINGLE, size: 8 } },
                  children: [new TextRun({ text: 'Data Engineering | Data Services', font: 'Calibri', size: 18, color: '606060' })],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: { top: { color: 'C0272D', space: 4, style: BorderStyle.SINGLE, size: 8 } },
                  children: [
                    new TextRun({ text: 'RESTRICTED — Internal Use Only    Page ', font: 'Calibri', size: 16, color: '808080' }),
                    new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '808080' }),
                    new TextRun({ text: ' of ', font: 'Calibri', size: 16, color: '808080' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '808080' }),
                  ],
                }),
              ],
            }),
          },
          children: [
            titleParagraph,
            subTitleParagraph,
            h1('1. Document Control'),
            docControlTable,

            h1('2. Executive Summary', true),
            p(parsedContent.execSummary || hld.description),

            h1('3. Regulatory & Business Driver', true),
            p(hld.regulatoryDriver),

            h1('4. Scope', true),
            h2('4.1 In-Scope'),
            p(parsedContent.scope?.inScope || `CAIS change implementation for ${hld.title}`),
            h2('4.2 Out-of-Scope'),
            p(parsedContent.scope?.outOfScope || 'Non-CAIS reporting and low-level code scripts.'),

            h1('5. Change Type & Overview', true),
            p(`Selected Change Types: ${hld.changeTypes}`),
            p(`Business Owner / Requester: ${hld.requestedBy}`),

            h1('6. Current State (As-Is Process)', true),
            p(parsedContent.currentState || 'Baseline CAIS reporting process.'),

            h1('7. Proposed Solution (To-Be Process)', true),
            p(parsedContent.proposedSolution || 'Updated CAIS transformation logic.'),

            h1('8. High-Level Source-to-Bureau Data Flow', true),
            p(parsedContent.dataFlow?.narrative || hld.sourceToBureauFlow || 'Source -> ETL -> Bureau SFTP'),
            diagramBox,

            h1('9. Data Item Impact Summary', true),
            dataItemTable,

            h1('10. Bureau-Specific Considerations', true),
            bureauTable,

            h1('11. Non-Functional & Regulatory Considerations', true),
            h2('11.1 Data Quality & Reconciliation'),
            p(hld.dataQualityChecks || 'Automated reconciliation rules.'),
            h2('11.2 Error & Rejection File Handling'),
            p(hld.errorHandling || 'Exception queue processing.'),
            h2('11.3 Audit Trail Requirements'),
            p(hld.auditTrail || 'Audit log retention in Data Warehouse.'),
            h2('11.4 Data Protection & Security'),
            p(hld.dataProtection || 'AES-256 and PGP Encryption.'),
            h2('11.5 Consumer Impact'),
            p(hld.consumerImpact || 'Accurate credit file reporting.'),

            h1('12. Testing & UAT Approach', true),
            p(hld.uatApproach || 'Parallel batch testing and bureau sandbox sign-off.'),

            h1('13. Implementation & Rollout Plan', true),
            p(`Target Implementation Date: ${hld.implementationDate || hld.targetMonth}`),
            p(`Rollback Approach: ${hld.rollbackApproach || 'Revert ETL configuration flag.'}`),

            h1('14. Assumptions, Constraints & Dependencies', true),
            h2('14.1 Assumptions'),
            p(hld.assumptions || 'Bureaus ready for schema updates.'),
            h2('14.2 Constraints'),
            p(hld.constraints || 'Monthly cut-off date compliance.'),
            h2('14.3 Dependencies'),
            p(hld.dependencies || 'Upstream core banking release.'),

            h1('15. Risks & Mitigations', true),
            riskTable,

            h1('16. Glossary of Terms', true),
            bullet('CAIS: Credit Account Information Sharing standard format for UK CRAs.'),
            bullet('CRA: Credit Reference Agency (Experian, Equifax, TransUnion).'),

            h1('17. Appendix & References', true),
            p(parsedContent.appendix || 'Refer to CAIS Data Reporting Guidelines for detailed field layouts.'),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${hld.changeReference}_HLD.docx"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Docx export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
