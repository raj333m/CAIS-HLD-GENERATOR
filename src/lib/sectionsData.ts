// Master Living Document Sections (1.1 - 2.7 & Appendix)
// Unified single source of truth for /document page UI and PDF/DOCX exports.

export const MASTER_SECTIONS: any[] = [
  {
    "id": "sec-1-1",
    "sectionNumber": "1.1",
    "title": "1.1 Business Overview and Requirements Summary",
    "displayOrder": 1,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-1-1-1",
        "documentSectionId": "sec-1-1",
        "heading": "Credit Reference Agencies in the UK",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"In the UK, there are three main credit reference agencies: Experian, Equifax, and TransUnion (formerly known as Callcredit). Each of these CRAs has slightly different ways of collecting and presenting information. Additionally, CRAs offer various services to help financial institutions manage credit risk, such as credit monitoring and risk management tools.\"}},{\"type\":\"paragraph\",\"payload\":{\"text\":\"Credit reference agencies (CRAs) collect and maintain information about businesses in addition to individuals' credit histories. The information provided by CRAs about corporate entities can include: credit accounts and outstanding debts; payment history and credit utilization; legal filings, such as bankruptcies, judgments, and liens; business registration information and ownership details; industry and business classification codes; financial data, such as revenue and number of employees; trade references and credit scores.\"}},{\"type\":\"paragraph\",\"payload\":{\"text\":\"CRAs provide credit reports to lenders and other authorized parties, including corporate and institutional customers, to help them make informed credit decisions. By providing information about an individual or businesses credit history, credit reference agencies help lenders assess creditworthiness and manage risk.\"}},{\"type\":\"paragraph\",\"payload\":{\"text\":\"Regulatory Report carries monthly data (previous month's) to bureaus which includes Red Brand, CIIOM, FD, M&S and Harvey Nichols. All products data which are eligible to be reported are shared with the bureaus on monthly basis including Loans, Mortgages, Credit Cards, Current Accounts.\"}}]"
      },
      {
        "id": "sub-1-1-2",
        "documentSectionId": "sec-1-1",
        "heading": "Purpose and Objectives of this Document",
        "displayOrder": 2,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"This document exists to provide a single, current-state High-Level Design of the CAIS monthly reporting process, covering the business requirements, the data reported, the technical approach and modelling used to produce it, and the mappings between source systems and the final regulatory output. Sections 1 and 2 are edited in place whenever a change affects a requirement, a data item, a rule, or an aspect of the technical approach. Section 3 (CAIS Change Register) preserves, in full, the history of every change that has led to the current state.\"}}]"
      },
      {
        "id": "sub-1-1-3",
        "documentSectionId": "sec-1-1",
        "heading": "Stakeholders and Ownership",
        "displayOrder": 3,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"Delivery of the CAIS monthly reporting process is shared across a small number of named teams, each with a distinct and non-overlapping area of ownership:\"}},{\"type\":\"bullets\",\"payload\":{\"items\":[\"UK BI Data Warehouse (BI) — Retail and Cards staging, staging validation, address processing, file generation, and loading to the CAIS snapshot.\",\"Central Utility (CU) Team — exclusions file and debt-sale file supplied to BI, CADS processing, the six CU-owned calculated variables, default/recoveries treatment.\",\"Transmission Team — final delivery via Connect:Direct to Experian, Equifax, and TransUnion.\",\"Product Owner — Risk CRA — business ownership and joint final sign-off.\",\"Business Analyst — translation of requirements into this design and impact assessment of each change.\"]}}]"
      },
      {
        "id": "sub-1-1-4",
        "documentSectionId": "sec-1-1",
        "heading": "1.1 Conceptual Data Flow Diagram",
        "displayOrder": 4,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"The diagram below illustrates the process of creating the extract. Input feeds (Retail + Cards) are staged -> exclusions applied -> debt sale logic applied -> staging validation performed -> downstream SAS/CADS processing updates core CRA reporting tables -> files are generated and loaded to CAIS snapshot structures -> final validations occur -> files are transmitted to CRAs.\"}}]"
      }
    ]
  },
  {
    "id": "sec-1-2",
    "sectionNumber": "1.2",
    "title": "1.2 Data Requirements",
    "displayOrder": 2,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-1-2-1",
        "documentSectionId": "sec-1-2",
        "heading": "Core Data Categories and Record Layout",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"The CAIS submission is built from a fixed, 44-field record layout common across the brands and products in scope (full layout in Section 2.5). Broadly the fields fall into: account/customer identification; balance and limit data; status and arrears data; default and recovery data; and a small number of derived/calculated fields produced specifically for CRA reporting.\"}}]"
      },
      {
        "id": "sub-1-2-2",
        "documentSectionId": "sec-1-2",
        "heading": "Source Systems Feeding CRA",
        "displayOrder": 2,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"Source systems feeding CRA (CAIS File Submission for Retail Banking): CDU, PLM, BDRAS, OHC, RMS, BCDU.\"}}]"
      },
      {
        "id": "sub-1-2-3",
        "documentSectionId": "sec-1-2",
        "heading": "CU Team-Owned Variables and Reporting Cadence Facts",
        "displayOrder": 3,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"CAIS File delivery for Retail is a joint effort from UKBIDWH and CU Team. Dependency lies with CU Team for 6 variables data: Current Balance, Account Status, Flag Settings, Monthly Payment, Repayment Period, Payment Frequency.\"}},{\"type\":\"table\",\"payload\":{\"headers\":[\"Cadence / System Fact\",\"Value\"],\"rows\":[[\"CRA Staging Data Mart for CAIS File (Retail Banking)\",\"DWH_PDS_STAG (Monthly Data Truncate/Insert)\"],[\"CRA Staging Jobs Execution\",\"01st of every month\"],[\"CADS Processing Table (Retail Banking)\",\"DWH_IP_ARRG_CALC_V\"],[\"CU Status Execution (Start Date)\",\"06th or 07th of every month\"],[\"CRA Final Data Mart for CAIS File (Retail Banking)\",\"DWH_CAIS_SMRY_SNAP\"],[\"CRA Validation Table (Retail Banking)\",\"DWH_CAIS_EXCEPTION\"],[\"Reporting Frequency\",\"Monthly\"],[\"Bureau File Sharing Timelines (TU, Experian and Equifax)\",\"Mid-Month Tentatively\"]]}}]"
      },
      {
        "id": "sub-1-2-4",
        "documentSectionId": "sec-1-2",
        "heading": "First Direct Retail (Brand Code 211)",
        "displayOrder": 4,
        "contentBlocks": "[{\"type\":\"rule-table\",\"payload\":{\"rows\":[{\"num\":1,\"category\":\"Ownership & Customer Mapping\",\"condition\":\"Customer accounts needs to be mapped with the primary account owners associated to account.\",\"keyFields\":\"Primary Account Owner\"},{\"num\":2,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.\",\"keyFields\":\"Product Hierarchy\"},{\"num\":3,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Customer age should be at least 18 years for getting reported to bureaus.\",\"keyFields\":\"Customer Age\"},{\"num\":4,\"category\":\"Product Range Included\",\"condition\":\"Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts get populated under First Direct Retail portfolio.\",\"keyFields\":\"Product Type\"}]}}]"
      },
      {
        "id": "sub-1-2-5",
        "documentSectionId": "sec-1-2",
        "heading": "M&S Loans (Brand Code 947)",
        "displayOrder": 5,
        "contentBlocks": "[{\"type\":\"rule-table\",\"payload\":{\"rows\":[{\"num\":1,\"category\":\"Ownership & Customer Mapping\",\"condition\":\"Customer accounts need to be mapped with the primary account owners associated with accounts.\",\"keyFields\":\"Primary Account Owner\"},{\"num\":2,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.\",\"keyFields\":\"Product Hierarchy\"},{\"num\":3,\"category\":\"Product Range Included\",\"condition\":\"Personal Loans and Debt Consolidated Loans are the specific products reported under PDS1 product hierarchy.\",\"keyFields\":\"Product Type\"}]}}]"
      },
      {
        "id": "sub-1-2-6",
        "documentSectionId": "sec-1-2",
        "heading": "HSBC Retail (Brand Code 85)",
        "displayOrder": 6,
        "contentBlocks": "[{\"type\":\"rule-table\",\"payload\":{\"rows\":[{\"num\":1,\"category\":\"Ownership & Customer Mapping\",\"condition\":\"Customer accounts need to be mapped with the primary account owners associated with accounts.\",\"keyFields\":\"Primary Account Owner\"},{\"num\":2,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.\",\"keyFields\":\"Product Hierarchy\"},{\"num\":3,\"category\":\"Product Range Included\",\"condition\":\"Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts and Basic Bank Accounts get populated under HSBC Retail portfolio.\",\"keyFields\":\"Product Type\"}]}}]"
      },
      {
        "id": "sub-1-2-7",
        "documentSectionId": "sec-1-2",
        "heading": "M&S Current Accounts (Brand Code 662)",
        "displayOrder": 7,
        "contentBlocks": "[{\"type\":\"rule-table\",\"payload\":{\"rows\":[{\"num\":1,\"category\":\"Ownership & Customer Mapping\",\"condition\":\"Customer accounts need to be mapped with the primary account owners associated with it.\",\"keyFields\":\"Primary Account Owner\"},{\"num\":2,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Product Hierarchy should be set up as Gleam (937) eligible to be reported in CRA Reporting.\",\"keyFields\":\"Product Hierarchy\"},{\"num\":3,\"category\":\"Eligibility & Product Scope\",\"condition\":\"Current accounts are the only product reported under Gleam product hierarchy.\",\"keyFields\":\"Product Hierarchy\"}]}}]"
      },
      {
        "id": "sub-1-2-8",
        "documentSectionId": "sec-1-2",
        "heading": "HSBC Cards (Brand Code 51)",
        "displayOrder": 8,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-1-3",
    "sectionNumber": "1.3",
    "title": "1.3 Data Analysis",
    "displayOrder": 3,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-1-3-1",
        "documentSectionId": "sec-1-3",
        "heading": "1.3 Data Analysis & Business Rules",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-1-4",
    "sectionNumber": "1.4",
    "title": "1.4 SOX Impacts",
    "displayOrder": 4,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-1-4-1",
        "documentSectionId": "sec-1-4",
        "heading": "1.4 SOX Controls",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-1-5",
    "sectionNumber": "1.5",
    "title": "1.5 Analysis Risks and Assumptions",
    "displayOrder": 5,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-1-5-1",
        "documentSectionId": "sec-1-5",
        "heading": "1.5 Risks and Assumptions",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-1",
    "sectionNumber": "2.1",
    "title": "2.1 Approach Summary and Overview Diagram",
    "displayOrder": 6,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-1-1",
        "documentSectionId": "sec-2-1",
        "heading": "2.1 Technical Approach Summary",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-2",
    "sectionNumber": "2.2",
    "title": "2.2 Logical Modelling",
    "displayOrder": 7,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-2-1",
        "documentSectionId": "sec-2-2",
        "heading": "2.2 Logical Data Models",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-3",
    "sectionNumber": "2.3",
    "title": "2.3 Physical Model",
    "displayOrder": 8,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-3-1",
        "documentSectionId": "sec-2-3",
        "heading": "2.3 Physical Data Schema",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-4",
    "sectionNumber": "2.4",
    "title": "2.4 Mapping Spreadsheet",
    "displayOrder": 9,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-4-1",
        "documentSectionId": "sec-2-4",
        "heading": "2.4 Source to Target Mappings",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-5",
    "sectionNumber": "2.5",
    "title": "2.5 Report Layout",
    "displayOrder": 10,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-5-1",
        "documentSectionId": "sec-2-5",
        "heading": "2.5 Bureau File Layout Specifications",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-6",
    "sectionNumber": "2.6",
    "title": "2.6 Data Examples",
    "displayOrder": 11,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-6-1",
        "documentSectionId": "sec-2-6",
        "heading": "2.6 Sample Record Outputs",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-2-7",
    "sectionNumber": "2.7",
    "title": "2.7 Test Approach",
    "displayOrder": 12,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-2-7-1",
        "documentSectionId": "sec-2-7",
        "heading": "2.7 UAT & Testing Plan",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"[Content to be confirmed by BA — no verified source provided yet]\"}}]"
      }
    ]
  },
  {
    "id": "sec-4-0",
    "sectionNumber": "4.0",
    "title": "4 Appendix",
    "displayOrder": 13,
    "lastUpdatedById": "user-ba",
    "lastUpdatedBy": {
      "id": "user-ba",
      "name": "Aishwarya Raj Singh",
      "email": "ba@cais.com",
      "role": "BA"
    },
    "subSections": [
      {
        "id": "sub-4-1-1",
        "documentSectionId": "sec-4-0",
        "heading": "4.1 Glossary & Abbreviations",
        "displayOrder": 1,
        "contentBlocks": "[{\"type\":\"table\",\"payload\":{\"headers\":[\"Term\",\"Definition\"],\"rows\":[[\"CAIS\",\"Credit Account Information Sharing — the UK reciprocal data-sharing scheme under which lenders submit account-level performance data to credit reference agencies on a monthly basis.\"],[\"CRA\",\"Credit Reference Agency — in the UK, principally Experian, Equifax, and TransUnion.\"],[\"CADS\",\"Credit Analysis and Decisioning System — the SAS-based processing that derives the six CU-owned calculated variables.\"],[\"BI\",\"Business Intelligence (UK BI Data Warehouse team) — owns staging, validation and file-generation for the CAIS pipeline.\"],[\"CU Team\",\"Central Utility Team — owns exclusions, debt-sale treatment, and the six CU-derived calculated variables.\"],[\"Connect:Direct\",\"The secure file-transfer mechanism used by the Transmission team to deliver CAIS extract files to the bureaus.\"]]}}]"
      },
      {
        "id": "sub-4-2-1",
        "documentSectionId": "sec-4-0",
        "heading": "4.2 Operational Support and Escalation",
        "displayOrder": 2,
        "contentBlocks": "[{\"type\":\"paragraph\",\"payload\":{\"text\":\"The following mailboxes provide first-line support for issues identified with the CAIS reporting process: bi.support mailbox and dataquality.cut mailbox.\"}}]"
      }
    ]
  }
];

export const BLANK_SECTIONS: any[] = MASTER_SECTIONS;
