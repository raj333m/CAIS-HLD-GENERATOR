import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { MASTER_SECTIONS } from '@/lib/sectionsData';

const prisma = new PrismaClient();

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

    if (!sections || sections.length === 0) {
      sections = MASTER_SECTIONS;
    }

    const secMap: Record<string, any> = {};
    sections.forEach((s) => {
      secMap[s.sectionNumber] = s;
    });

    // Helper to convert block JSON to clean HTML
    const renderBlocksToHtml = (blocksJsonStr: string) => {
      try {
        const blocks = typeof blocksJsonStr === 'string' ? JSON.parse(blocksJsonStr) : blocksJsonStr || [];
        return blocks
          .map((b: any) => {
            if (b.type === 'paragraph') {
              return `<p class="body-p">${b.payload.text || ''}</p>`;
            }
            if (b.type === 'bullets') {
              const items = (b.payload.items || [])
                .map((item: string) => `<li>${item}</li>`)
                .join('');
              return `<ul class="bullet-list">${items}</ul>`;
            }
            if (b.type === 'table') {
              const headers = (b.payload.headers || [])
                .map((h: string) => `<th>${h}</th>`)
                .join('');
              const rows = (b.payload.rows || [])
                .map(
                  (r: string[], rIdx: number) =>
                    `<tr class="${rIdx % 2 === 1 ? 'alt-row' : ''}">${r
                      .map((cell: string) => `<td>${cell}</td>`)
                      .join('')}</tr>`
                )
                .join('');
              return `<div class="table-container"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
            }
            if (b.type === 'diagram') {
              const key = b.payload.imageKey || 'conceptual';
              const caption = b.payload.caption || 'CAIS Process Flow Diagram';
              return `<div class="diagram-container">
                <div class="diagram-box">
                  <img src="/diagrams/${key}.png" alt="${caption}" />
                </div>
                ${caption ? `<p class="caption">${caption}</p>` : ''}
              </div>`;
            }
            if (b.type === 'pie-chart') {
              const total = b.payload?.totalFields || 44;
              const cuCount = (b.payload?.cuOwnedFields || []).length || 6;
              const biCount = total - cuCount;
              const cuPct = Math.round((cuCount / total) * 100);
              const biPct = 100 - cuPct;
              const biRad = (biCount / total) * 2 * Math.PI;
              const caption = b.payload?.caption || 'Figure 2.5(a) — Data Variables Accountability';
              const xEnd = 120 + 90 * Math.sin(biRad);
              const yEnd = 120 - 90 * Math.cos(biRad);

              return `<div class="diagram-container" style="margin: 24px 0;">
                <div class="diagram-box" style="padding: 20px; text-align: center; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFF; max-width: 500px; margin: 0 auto;">
                  <h4 style="margin-top:0; font-size: 11pt; font-weight: bold; color: #1E293B; text-transform: uppercase;">${b.payload?.title || 'Data Variables Accountability (Final Data Mart)'}</h4>
                  <div style="display: flex; justify-content: center; align-items: center; margin: 16px 0;">
                    <svg width="200" height="200" viewBox="0 0 240 240">
                      <path d="M 120 120 L 120 30 A 90 90 0 1 1 ${xEnd} ${yEnd} Z" fill="#2563EB" />
                      <path d="M 120 120 L ${xEnd} ${yEnd} A 90 90 0 0 1 120 30 Z" fill="#C0272D" />
                      <text x="100" y="140" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle">${biPct}%</text>
                      <text x="155" y="75" fill="#FFFFFF" font-size="11" font-weight="bold" text-anchor="middle">${cuPct}%</text>
                    </svg>
                  </div>
                  <div style="font-size: 9.5pt; font-weight: bold; margin-top: 10px; display: flex; justify-content: center; gap: 15px;">
                    <span style="color: #2563EB;">■ BI Scope — ${biCount}, ${biPct}%</span>
                    <span style="color: #C0272D;">■ CU Team Scope — ${cuCount}, ${cuPct}%</span>
                  </div>
                </div>
                ${caption ? `<p class="caption">${caption}</p>` : ''}
              </div>`;
            }
            return '';
          })
          .join('');
      } catch (e) {
        return `<p class="body-p">${blocksJsonStr}</p>`;
      }
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CRA CAIS Reporting High Level Design - PDF Export</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      color: #1A1A1A;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .header-rule {
      border-bottom: 2px solid #C0272D;
      padding-bottom: 6px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      color: #606060;
    }
    .footer-rule {
      border-top: 1px solid #C0272D;
      padding-top: 6px;
      margin-top: 30px;
      text-align: center;
      font-size: 8pt;
      color: #808080;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
      color: #C0272D;
      border-bottom: 1px solid #E0E0E0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
    }
    h2 {
      font-size: 13pt;
      font-weight: bold;
      color: #202020;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 11.5pt;
      font-weight: bold;
      font-style: italic;
      color: #202020;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    .body-p {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 11pt;
      color: #1A1A1A;
    }
    .bullet-list {
      margin-top: 4px;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    .bullet-list li {
      margin-bottom: 4px;
      font-size: 11pt;
      color: #1A1A1A;
    }
    .table-container {
      margin: 14px 0;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-bottom: 12px;
    }
    th {
      background-color: #C0272D;
      color: #FFFFFF;
      font-weight: bold;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #A01B20;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #E0E0E0;
      color: #1A1A1A;
    }
    tr.alt-row {
      background-color: #F8F9FA;
    }
    .note-box {
      background-color: #F4F5F7;
      border: 1px solid #D1D5DB;
      border-left: 4px solid #C0272D;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 16px 0;
      font-style: italic;
      font-size: 10pt;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: bold;
      color: #1A1A1A;
      margin-top: 40px;
      margin-bottom: 10px;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #404040;
      margin-bottom: 30px;
    }
    .cover-meta {
      font-size: 11pt;
      color: #1A1A1A;
      margin-bottom: 20px;
    }
    .diagram-container {
      margin: 20px 0;
      text-align: center;
    }
    .diagram-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display: inline-block;
      max-width: 100%;
    }
    .diagram-box img {
      max-width: 100%;
      height: auto;
    }
    .caption {
      font-size: 9.5pt;
      font-style: italic;
      color: #606060;
      margin-top: 6px;
    }
    @media print {
      .no-print { display: none; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: fixed; top: 12px; right: 20px; z-index: 1000; background: #1E293B; padding: 10px 16px; border-radius: 12px; color: white; display: flex; gap: 12px; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
    <span style="font-size: 12px; font-weight: bold;">Document PDF Generation</span>
    <button onclick="window.print()" style="background: #C0272D; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Save / Print as PDF</button>
  </div>

  <!-- HEADER -->
  <div class="header-rule">
    <span>Data Engineering | Data Services</span>
    <span>Consolidated HLD Specification</span>
  </div>

  <!-- COVER PAGE -->
  <div class="cover-title">CRA CAIS Reporting High Level Design</div>
  <div class="cover-subtitle">High Level Design — Consolidated Document</div>
  <div class="cover-meta">
    <p>Author: [Author Name]</p>
    <p>Date: [DD Month YYYY]</p>
    <p>Version: [x.x]</p>
  </div>
  <p class="body-p" style="font-style: italic; color: #404040; margin-top: 40px; margin-bottom: 60px;">
    This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.
  </p>

  <div class="footer-rule" style="margin-top: 100px;">
    Restricted — for internal company use only. Replace bracketed placeholders before circulating.
  </div>

  <!-- DOCUMENT INFORMATION PAGE -->
  <div class="page-break"></div>
  <h1>Document Information</h1>
  
  <h2>Involved Parties</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr><th>Name</th><th>Role</th></tr>
      </thead>
      <tbody>
        <tr><td>[Name]</td><td>Design Manager / POD Lead</td></tr>
        <tr class="alt-row"><td>[Name]</td><td>Technical Lead</td></tr>
        <tr><td>[Name]</td><td>Senior Developer</td></tr>
        <tr class="alt-row"><td>[Name]</td><td>IT Project Manager</td></tr>
        <tr><td>[Name]</td><td>Business Analyst</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Revision History</h2>
  <p class="body-p">This tracks revisions to the document as a whole (structure, ownership, scope). Individual CAIS changes are logged in Section 3 — CAIS Change Register, not here.</p>
  <div class="table-container">
    <table>
      <thead>
        <tr><th>Version</th><th>Date</th><th>Updated By</th><th>Reason for Issue</th></tr>
      </thead>
      <tbody>
        <tr><td>0.1</td><td>[Date]</td><td>[Name]</td><td>Initial consolidated HLD created</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Reviewed By</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr><th>Reviewer</th><th>Role or Business Unit</th><th>Date</th></tr>
      </thead>
      <tbody>
        <tr><td>[Name]</td><td>Product Owner — Risk CRA</td><td>[Date]</td></tr>
        <tr class="alt-row"><td>[Name]</td><td>CBM Lead UK</td><td>[Date]</td></tr>
        <tr><td>[Name]</td><td>Technical Lead</td><td>[Date]</td></tr>
        <tr class="alt-row"><td>[Name]</td><td>Senior Developer</td><td>[Date]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page-break"></div>
  <h1>Table of Contents</h1>
  <p class="body-p" style="font-style: italic; color: #606060;">(Consolidated Document Navigation Summary)</p>
  <ul style="list-style: none; padding-left: 0; line-height: 2;">
    <li><strong>Document Information</strong></li>
    <li><strong>1 Requirements and Data</strong></li>
    <li style="padding-left: 20px;">1.1 Business Overview and Requirements Summary</li>
    <li style="padding-left: 20px;">1.2 Data Requirements</li>
    <li style="padding-left: 20px;">1.3 Data Analysis</li>
    <li style="padding-left: 20px;">1.4 SOX Impacts</li>
    <li style="padding-left: 20px;">1.5 Analysis Risks and Assumptions</li>
    <li><strong>2 Approach, Modelling and Mappings</strong></li>
    <li style="padding-left: 20px;">2.1 Approach Summary and Overview Diagram</li>
    <li style="padding-left: 20px;">2.2 Logical Modelling</li>
    <li style="padding-left: 20px;">2.3 Physical Model</li>
    <li style="padding-left: 20px;">2.4 Mapping Spreadsheet</li>
    <li style="padding-left: 20px;">2.5 Report Layout</li>
    <li style="padding-left: 20px;">2.6 Data Examples</li>
    <li><strong>3 CAIS Change Register</strong></li>
    <li><strong>4 Attached Reference Files & Governance</strong></li>
  </ul>

  <div class="note-box">
    <strong>NOTE:</strong> This template is used for all levels of CAIS change — major projects and small enhancements alike. Sections 1 (Requirements and Data) and 2 (Approach, Modelling and Mappings) are the living, current-state reference design.
  </div>

  <!-- SECTIONS 1 & 2 -->
  ${sections
    .map((sec) => {
      let secHtml = `<div class="page-break"></div>`;
      if (sec.sectionNumber === '1.1') {
        secHtml += `<h1>1 Requirements and Data</h1>`;
      } else if (sec.sectionNumber === '2.1') {
        secHtml += `<h1>2 Approach, Modelling and Mappings</h1>`;
      }
      secHtml += `<h2>${sec.title}</h2>`;

      if (sec.subSections) {
        for (const sub of sec.subSections) {
          if (sub.heading) {
            secHtml += `<h3>${sub.heading}</h3>`;
          }
          secHtml += renderBlocksToHtml(sub.contentBlocks);
        }
      }
      return secHtml;
    })
    .join('')}

  <!-- SECTION 3: CAIS CHANGE REGISTER -->
  <div class="page-break"></div>
  <h1>3 CAIS Change Register</h1>
  <p class="body-p">This section is an append-only historical register of all approved CAIS changes. The latest changes appear at the top. Earlier entries are never overwritten or deleted.</p>

  <h2>Master Change Log</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>CR Reference</th><th>Title</th><th>Change Type</th><th>Impacted Bureaus</th><th>Target Month</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${changes
          .map(
            (c, idx) => `
          <tr class="${idx % 2 === 1 ? 'alt-row' : ''}">
            <td><strong>${c.crReference}</strong></td>
            <td>${c.title}</td>
            <td>${c.changeType}</td>
            <td>${c.impactedBureaus}</td>
            <td>${c.targetMonth}</td>
            <td>${c.status}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <h2>Detailed Change Entries</h2>
  ${changes
    .map(
      (c) => `
    <h3>${c.crReference} — ${c.title}</h3>
    <div class="table-container">
      <table>
        <thead>
          <tr><th style="width: 30%;">Field</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Business / Regulatory Driver</strong></td><td>${c.businessDriver || ' '}</td></tr>
          <tr class="alt-row"><td><strong>Description of Change</strong></td><td>${c.description || ' '}</td></tr>
          <tr><td><strong>Section(s) Updated</strong></td><td>${c.sectionsUpdated || ' '}</td></tr>
          <tr class="alt-row"><td><strong>Before Logic</strong></td><td>${c.beforeText || ' '}</td></tr>
          <tr><td><strong>After Logic</strong></td><td>${c.afterText || ' '}</td></tr>
          <tr class="alt-row"><td><strong>Impacted Bureaus</strong></td><td>${c.impactedBureaus || ' '}</td></tr>
          <tr><td><strong>Impacted CAIS Fields</strong></td><td>${c.impactedDataItems || ' '}</td></tr>
          <tr class="alt-row"><td><strong>Target Month</strong></td><td>${c.targetMonth || ' '}</td></tr>
          <tr><td><strong>Status</strong></td><td>${c.status}</td></tr>
        </tbody>
      </table>
    </div>`
    )
    .join('')}

  <!-- SECTION 4: ATTACHED REFERENCE FILES & GOVERNANCE -->
  <div class="page-break"></div>
  <h1>4 Attached Reference Files & Governance</h1>
  <p class="body-p">This section lists reference files, spreadsheets, and specifications attached to this High Level Design document.</p>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>File Name</th><th>Format</th><th>Size</th><th>Uploaded Date</th><th>Uploaded By</th>
        </tr>
      </thead>
      <tbody>
        ${attachments.length > 0
          ? attachments
              .map(
                (att, idx) => `
          <tr class="${idx % 2 === 1 ? 'alt-row' : ''}">
            <td><strong>${att.fileName}</strong></td>
            <td>.${att.fileType}</td>
            <td>${(att.fileSize / 1024).toFixed(1)} KB</td>
            <td>${new Date(att.uploadedAt).toLocaleDateString()}</td>
            <td>${att.uploadedBy || 'System User'}</td>
          </tr>`
              )
              .join('')
          : '<tr><td colspan="5" style="text-align: center; color: #808080; font-style: italic;">No reference files currently uploaded.</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer-rule">
    RESTRICTED — Internal Use Only &nbsp;&nbsp;&nbsp;&nbsp; CRA CAIS Living Document Specification
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
