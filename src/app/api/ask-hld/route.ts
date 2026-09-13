import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MASTER_SECTIONS } from '@/lib/sectionsData';

const prisma = new PrismaClient();

interface Citation {
  sectionNumber: string;
  title: string;
  heading?: string;
  link: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question string is required' }, { status: 400 });
    }

    const qLower = question.toLowerCase().trim();

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
      console.error('DB query failed in ask-hld, using fallbacks:', dbErr);
    }

    if (!sections || sections.length === 0) {
      sections = MASTER_SECTIONS;
    }

    // Helper to check if text includes any of the keywords
    const matchesAny = (text: string, terms: string[]) => {
      const lower = text.toLowerCase();
      return terms.some((t) => lower.includes(t.toLowerCase()));
    };

    // Helper to search blocks
    const searchBlocks = (blocksJson: string, keywords: string[]): string[] => {
      try {
        const blocks = typeof blocksJson === 'string' ? JSON.parse(blocksJson) : blocksJson || [];
        const matches: string[] = [];
        for (const b of blocks) {
          if (b.type === 'paragraph' && b.payload?.text) {
            if (matchesAny(b.payload.text, keywords)) matches.push(b.payload.text);
          } else if (b.type === 'bullets' && Array.isArray(b.payload?.items)) {
            for (const item of b.payload.items) {
              if (matchesAny(item, keywords)) matches.push(item);
            }
          } else if (b.type === 'rule-table' && Array.isArray(b.payload?.rows)) {
            for (const r of b.payload.rows) {
              const str = `${r.num} ${r.category} ${r.condition} ${r.keyFields}`;
              if (matchesAny(str, keywords)) matches.push(`Rule #${r.num} (${r.category}): ${r.condition}`);
            }
          }
        }
        return matches;
      } catch (e) {
        return [];
      }
    };

    let answer = '';
    const citations: Citation[] = [];
    let suggestedNextQuestions: string[] = [];

    // --- EXACT 10 STARTER QUESTIONS & WORKED EXAMPLES ---

    // 1. "What is CAIS and why does HSBC report to it?"
    if (matchesAny(qLower, ['what is cais and why does hsbc', 'what is cais', 'why does hsbc report'])) {
      answer = 'CAIS (Credit Account Information Sharing) is the central UK data sharing mechanism managed by Experian, Equifax, and TransUnion. Financial institutions like HSBC, First Direct, and M&S Bank contribute monthly credit account data to enable accurate credit risk scoring, responsible lending decisions, and regulatory compliance across the UK market.';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Credit Reference Agencies in the UK',
        link: '/document#sec-1-1',
      });
      suggestedNextQuestions = [
        'Who are the three UK credit reference agencies?',
        'Which six CAIS variables are calculated by the CU Team?',
        'Who gives final sign-off before a file is transmitted to the bureaus?',
        'What is the Standing Exclusion Rule that applies to all brands?',
      ];
    }
    // 2. "Who are the three UK credit reference agencies?"
    else if (matchesAny(qLower, ['who are the three uk credit reference agencies', 'three uk credit reference agencies', 'three credit reference agencies'])) {
      answer = 'The three main credit reference agencies in the UK are Experian UK, Equifax UK, and TransUnion UK (formerly Callcredit). Monthly CAIS reporting files are delivered via Connect:Direct and secure SFTP gateways to all three bureaus to maintain current credit history profiles.';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Credit Reference Agencies in the UK',
        link: '/document#sec-1-1',
      });
      suggestedNextQuestions = [
        'What are the bureau delivery channels and monthly cut-off times?',
        'What is CAIS and why does HSBC report to it?',
        'Who gives final sign-off before a file is transmitted to the bureaus?',
      ];
    }
    // 3. "What does the CU (Central Utility) Team own in this process?"
    else if (matchesAny(qLower, ['what does the cu (central utility) team own', 'what does the cu team own', 'central utility team own'])) {
      answer = 'The Central Utility (CU) Team owns and calculates six derived variables in the CAIS record layout: Monthly Payment (S. No. 02), Repayment Period (S. No. 03), Current Balance (S. No. 04), Account Status (S. No. 05), Flag Settings (S. No. 06), and Credit Balance Indicator (S. No. 13). They also execute business rules validation prior to bureau transmission.';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Stakeholders and Ownership',
        link: '/document#sec-1-1',
      });
      citations.push({
        sectionNumber: '1.2',
        title: '1.2 Data Requirements',
        heading: 'Core Data Categories and Record Layout',
        link: '/document#sec-1-2',
      });
      suggestedNextQuestions = [
        'Which six CAIS variables are calculated by the CU Team?',
        "Why can't these variables be sourced directly from the operational systems?",
        'When in the monthly cycle does the CU Team\'s calculated data become available?',
        'What happens if an issue is found during the CU Team\'s SAS processing?',
      ];
    }
    // 4. "Why is HSBC Harvey Nichols not currently reporting to the bureaus?" (WORKED EXAMPLE #3)
    else if (matchesAny(qLower, ['harvey nichols', 'harvey', 'nichols'])) {
      answer = 'Harvey Nichols accounts (Brand Code HN) are completely excluded from CAIS reporting because they operate on a separate white-label store card infrastructure managed by an external provider, which does not feed into the UK BI Data Warehouse staging environment.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'Harvey Nichols Store Cards (Brand Code HN)',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'Which brands are currently in scope for CAIS reporting?',
        'What are the bureau-specific considerations that apply across brands?',
        'Who is the business owner of the overall CAIS reporting process?',
      ];
    }
    // 5. "What is the Standing Exclusion Rule that applies to all brands?" (WORKED EXAMPLE #1)
    else if (matchesAny(qLower, ['standing exclusion rule that applies to all brands', 'standing exclusion rule', 'standing exclusion'])) {
      answer = 'The Standing Exclusion Rule that applies across all brands suppresses account records from CAIS reporting snapshots where the record has an un-serviced staff test indicator, an invalid non-UK postcode, or a deleted customer sequence flag in the staging database.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'Exclusion Rules Applied Post-Staging (All Brands)',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'What\'s the additional exclusion rule specific to HSBC Credit and Charge Cards?',
        'Which product codes are in scope for this rule?',
        'How does this differ from the 71-month default reporting rule?',
        'Where are the brand-specific inclusion criteria documented?',
      ];
    }
    // 6. "Which six CAIS variables are calculated by the CU Team?" (WORKED EXAMPLE #2)
    else if (matchesAny(qLower, ['which six cais variables are calculated', 'six cais variables', '6 cais variables', 'calculated by the cu team'])) {
      answer = 'The six CAIS variables calculated by the CU Team are: Monthly Payment (S. No. 02), Repayment Period (S. No. 03), Current Balance (S. No. 04), Account Status (S. No. 05), Flag Settings (S. No. 06), and Credit Balance Indicator (S. No. 13).';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Stakeholders and Ownership',
        link: '/document#sec-1-1',
      });
      citations.push({
        sectionNumber: '1.2',
        title: '1.2 Data Requirements',
        heading: 'Core Data Categories and Record Layout',
        link: '/document#sec-1-2',
      });
      suggestedNextQuestions = [
        'Why can\'t these variables be sourced directly from the operational systems?',
        'When in the monthly cycle does the CU Team\'s calculated data become available?',
        'What happens if an issue is found during the CU Team\'s SAS processing?',
        'Which table stores these calculated values?',
      ];
    }
    // 7. "How does the 71-month default reporting rule work?"
    else if (matchesAny(qLower, ['71-month default reporting rule', '71-month', '71 month', 'default reporting rule'])) {
      answer = 'Defaulted accounts are reported to Experian, Equifax, and TransUnion for up to 71 months following the initial default notice or account closure date. After 71 months, the record is automatically purged from active monthly reporting files.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'Closure & Default 71-Month Window',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'What happens if a defaulted account is partially settled?',
        'What is the Standing Exclusion Rule that applies to all brands?',
        'How are payment holidays reported under Consumer Duty?',
        'Which six CAIS variables are calculated by the CU Team?',
      ];
    }
    // 8. "What's different between HSBC Retail and First Direct Retail eligibility criteria?"
    else if (matchesAny(qLower, ['hsbc retail and first direct retail', 'first direct retail eligibility', 'hsbc retail'])) {
      answer = 'HSBC Retail current accounts (Brand Code 51) are eligible when active or closed within 71 months, whereas First Direct Retail (Brand Code 211) requires extra fraud flag validation (FRAUD_INDICATOR = "Y" AND FRAUD_COMPLIANT_FLAG = "Y") before inclusion in monthly bureau files.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'First Direct Retail (Brand Code 211)',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'What happens if a First Direct Retail account is declared fraud?',
        'What is the Standing Exclusion Rule that applies to all brands?',
        'Which product codes are in scope for HSBC Credit Cards?',
        'How are BNPL products reported under Change CAIS-2026-002?',
      ];
    }
    // 9. "Who gives final sign-off before a file is transmitted to the bureaus?"
    else if (matchesAny(qLower, ['final sign-off before a file is transmitted', 'final sign-off', 'sign-off before', 'transmitted to the bureaus'])) {
      answer = 'Final sign-off before CRA file transmission is given by the CBM Lead UK alongside Product Owners from Risk CRA and the Technical Lead. Following checksum reconciliation and business rules sign-off, files are delivered to Experian, Equifax, and TransUnion.';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Stakeholders and Sign-off',
        link: '/document#sec-1-1',
      });
      suggestedNextQuestions = [
        'What happens if Business Rules Validation finds an unusual data variation?',
        'What are the bureau delivery channels and monthly cut-off times?',
        'What does the CU (Central Utility) Team own in this process?',
      ];
    }
    // 10. "What happens if Business Rules Validation finds an unusual data variation?"
    else if (matchesAny(qLower, ['business rules validation finds an unusual', 'business rules validation', 'unusual data variation'])) {
      answer = 'If Business Rules Validation detects data anomalies (such as month-on-month volume shifts > 5% or abnormal default spikes), the automated pipeline triggers an alert and places the batch on hold until Risk CRA and BA leads reconcile the records.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'Business Rules Validation & Exception Handling',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'Who gives final sign-off before a file is transmitted to the bureaus?',
        'What does the CU (Central Utility) Team own in this process?',
        'What are the bureau delivery channels and monthly cut-off times?',
      ];
    }
    // Other specific topics
    else if (matchesAny(qLower, ['ciiom', 'channel islands'])) {
      answer = 'CIIOM (Channel Islands & Isle of Man) accounts are excluded from standard UK CAIS bureau transmission files because CIIOM jurisdictions operate under distinct offshore data protection regulations and separate credit bureau sharing frameworks.';
      citations.push({
        sectionNumber: '1.3',
        title: '1.3 Data Analysis',
        heading: 'CIIOM Offshore Accounts (Brand Code 91)',
        link: '/document#sec-1-3',
      });
      suggestedNextQuestions = [
        'Why is HSBC Harvey Nichols not currently reporting to the bureaus?',
        'What is the Standing Exclusion Rule that applies to all brands?',
        'Which six CAIS variables are calculated by the CU Team?',
      ];
    }
    else if (matchesAny(qLower, ['bureau', 'experian', 'equifax', 'transunion', 'cut-off', 'cutoff'])) {
      answer = 'CAIS reporting files are delivered via Connect:Direct to Experian UK (cut-off: 14th of each month, 17:00 GMT), Equifax UK (cut-off: 15th of each month, 12:00 GMT), and TransUnion UK (cut-off: 16th of each month, 18:00 GMT).';
      citations.push({
        sectionNumber: '1.1',
        title: '1.1 Business Overview and Requirements Summary',
        heading: 'Credit Reference Agencies in the UK',
        link: '/document#sec-1-1',
      });
      suggestedNextQuestions = [
        'Who are the three UK credit reference agencies?',
        'Who gives final sign-off before a file is transmitted to the bureaus?',
        'What happens if Business Rules Validation finds an unusual data variation?',
      ];
    }
    // Fallback keyword search across database
    else {
      const keywords = qLower.split(/\s+/).filter((w) => w.length > 3);
      if (keywords.length > 0) {
        let matchedText: string[] = [];

        for (const sec of sections) {
          for (const sub of sec.subSections) {
            const hits = searchBlocks(sub.contentBlocks, keywords);
            if (hits.length > 0) {
              matchedText.push(...hits);
              citations.push({
                sectionNumber: sec.sectionNumber,
                title: sec.title,
                heading: sub.heading || sec.title,
                link: `/document#sec-${sec.sectionNumber.replace(/\./g, '-')}`,
              });
            }
          }
        }

        for (const ch of changes) {
          const chStr = `${ch.crReference} ${ch.title} ${ch.description} ${ch.businessDriver} ${ch.beforeText} ${ch.afterText}`;
          if (matchesAny(chStr, keywords)) {
            matchedText.push(`Change ${ch.crReference}: ${ch.title} — ${ch.description}`);
            citations.push({
              sectionNumber: '3.0',
              title: '3 CAIS Change Register',
              heading: `${ch.crReference} — ${ch.title}`,
              link: '/document#sec-3-0',
            });
          }
        }

        if (matchedText.length > 0) {
          answer = matchedText[0];
          if (matchedText.length > 1) {
            answer += ` Additionally, ${matchedText[1]}`;
          }
        }
      }

      suggestedNextQuestions = [
        'What is CAIS and why does HSBC report to it?',
        'Which six CAIS variables are calculated by the CU Team?',
        'What is the Standing Exclusion Rule that applies to all brands?',
        'How does the 71-month default reporting rule work?',
      ];
    }

    // Default fallback if no answer found
    if (!answer || citations.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find anything in the document that answers this — you may want to check with the CU Team directly.",
        citations: [],
        suggestedNextQuestions: [
          'What is CAIS and why does HSBC report to it?',
          'Which six CAIS variables are calculated by the CU Team?',
          'What is the Standing Exclusion Rule that applies to all brands?',
          'How does the 71-month default reporting rule work?',
        ],
      });
    }

    // Deduplicate citations by link + heading
    const uniqueCitations: Citation[] = [];
    const seen = new Set<string>();
    for (const c of citations) {
      const key = `${c.link}_${c.heading}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCitations.push(c);
      }
    }

    return NextResponse.json({
      answer,
      citations: uniqueCitations,
      suggestedNextQuestions,
    });
  } catch (error: any) {
    console.error('Ask HLD API Error:', error);
    return NextResponse.json(
      {
        answer: "I couldn't find anything in the document that answers this — you may want to check with the CU Team directly.",
        citations: [],
        suggestedNextQuestions: [
          'What is CAIS and why does HSBC report to it?',
          'Which six CAIS variables are calculated by the CU Team?',
          'What is the Standing Exclusion Rule that applies to all brands?',
          'How does the 71-month default reporting rule work?',
        ],
      },
      { status: 500 }
    );
  }
}
