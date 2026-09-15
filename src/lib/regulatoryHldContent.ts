// Regulatory HLD Reference Content & Structure Module for HSBC CAIS HLD Exports

export interface RegulatoryBrandCriteria {
  brandName: string;
  brandCode: string;
  bullets: string[];
}

export const REGULATORY_TOC = [
  { num: '1.', title: 'Business Overview and Requirements Summary', page: '4' },
  { num: '1.1', title: 'Conceptual Data Flow Diagram', page: '6' },
  { num: '1.2', title: 'Retail Brands Staging Elegibility & Exclusion Criteria', page: '15' },
  { num: '1.3', title: 'Validation Rules on snap prior to extract file is sent to the CRAs', page: '24' },
];

export const REGULATORY_TOC_NOTE =
  'NOTE: This template should be used for all levels of change, major projects and small enhancements. Depending on the level of the change all or some of the sections will be populated. N/A could be entered for some sections with an accompanying reason.';

export const BRAND_IDENTIFICATION_CODES = [
  ['HSBC Credit Card', '51', '11130020', '3816-11'],
  ['HSBC PLC', '85', '13140017', '3815-58'],
  ['First Direct', '211', '11130036', '6237-17'],
  ['HSBC Harvey Nichols Store Card', '331', '11130071', '3817-24 (Not Reporting to the bureaus now)'],
  ['M&S Current Accounts', '662', '10890541', '8029-88'],
  ['M&S Loans', '947', '10890606', '8029-99'],
];

export const DWH_SOURCE_TABLES = [
  ['DWH_IP_ARRG_RELN', 'RAW_CDU010_CPREL', 'Supriyo Debnath'],
  ['DWH_IP_XREF', 'RAW_CDU010_CPREL', 'Supriyo Debnath'],
  ['DWH_BD_ARRG', 'BDS_DFLT_ACCT', 'Ekta Bansal'],
  ['DWH_ACCT_ARRG', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_PTYP_CLAS_RELN', 'RAW_BCD_PROD_ITEM', 'Rushni Wijesena'],
  ['DWH_ARCL_RELN', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_PTYP_XREF', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_PRAR', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_CUST_CLAS_RELN', 'RAW_CDU030_PERSCUST', 'Supriyo Debnath'],
  ['DWH_INDV', 'RAW_CDU030_PERSCUST', 'Supriyo Debnath'],
  ['DWH_ARRG', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_ARRG_XREF', 'RAW_PLM_ACCOUNTSTREAM01–64', 'William Blackwood'],
  ['DWH_CUST', 'RAW_CDU030_PERSCUST', 'Supriyo Debnath'],
];

export const BRAND_CRITERIA_BLOCKS: RegulatoryBrandCriteria[] = [
  {
    brandName: 'M&S Loans Brand Code 947',
    brandCode: '947',
    bullets: [
      'Customer accounts need to be mapped with the primary account owners associated with accounts. (In other words, Customer fully owns the account).',
      'Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.',
      'Customer age should be at least 18 years for getting reported to bureaus.',
      'Own Institution (OWN_INSTT =1) indicator should be set up as 1 for identifying M&S customers in DWH_CUST Table',
      'For a non-default account: Positive data sharing indicator should not be set as "N" and if the account is closed then it should have closed in the reporting month OR if it is a default account then it should get reported for ~ 6 years (71 months).',
      'RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null',
      'Personal Loans and Debt Consolidated Loans are the spesefic products reported under PDS1 product hierarchy.',
      'PDS1 product hierarchy is not designed for mortgages, basic bank accounts and current accounts.',
      'Product classification cannot be null, or BDRAS date of default cannot be null',
    ],
  },
  {
    brandName: 'First Direct Cards Brand Code 211',
    brandCode: '211',
    bullets: [
      'Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.',
      'Customer age should be at least 18 years, or the start date should be before 01st June 2005 for getting reported to bureaus',
      'Virtual Cards are not reported',
      'Secondary Cards are not reported',
      'Cards organization Code 900 is only reported. (First Direct)',
      'Primary Cards Indicator CRA_CDE inclusive of (0 (non-defaulters), 1 Collections, 2 Recoveries) are reported whereas X are not reported to the bureaus.',
      'Account number cannot be shared to the bureaus as null value',
      'Positive data sharing indicators should be set as Y or blank for data reporting',
      'TSS CUST ID (DWH_IP_XREF Table) cannot be null, it should have non null value too for data reporting',
      'For Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date refers to the last delinquent date which should be valid (not null) and should fall in the reporting month for reporting to bureaus OR For Default accounts (CRA_CDE in 1 Collections, 2 Recoveries), account closure date follows the 6 years logic for default reporting. default card holder account continues to get reported to the bureaus for 71 months from the account closure date',
      "For Non Default accounts (CRA_CDE = 0), when the current balance becomes 0 and eligible closure block codes are applied ('D','K','P','E','Z','F','L','R','O','B') in block code 1 or block code 2 then it extracts the most recent date amongst block 1 date, block 2 date, gross active last date and ambs last activity date which should fall in the reporting month period for data reporting to bureaus or else there should be a non-zero outstanding balance.",
      'Charge cards (6) and credit cards (5) are the only spesefic products falling under brand code 51 (HSBC Cards)',
    ],
  },
  {
    brandName: 'First Direct Retail Brand Code 211',
    brandCode: '211',
    bullets: [
      'Customer accounts needs to be mapped with the primary account owners associated to account. (In other words, Customer fully owns the account).',
      'Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.',
      "Product relation end date should be either '0001-01-01' or null or it should be greater than the reporting date",
      'Customer age should be at least 18 years for getting reported to bureaus.',
      'OWN_GRP_TYCD (DWH_ARRG_XREF table) = "FD" OR OWN_GRP_TYCD (DWH_ARRG_XREF table) is not blank.',
      'TSS_CUST_ID (DWH_IP_XREF table) should not be null.',
      'For all accounts, Positive data sharing indicator should not be set as "Y" for data reporting OR For non-default accounts, if Positive data sharing indicator is set as <> "N" and Temporary scheme for initial positive data load is set \'Y\' And if the account is closed then it should have closed within the reporting period or else if the account is declared as "Fraud" if compliant with condition, then account will get reported else drop the accounts ELSE IF For default accounts, it should be reported to the bureaus for 71 months from the account closure date irrespective of the positive data sharing indicator value.',
      'RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null',
      'Product classification cannot be null, or BDRAS date of default cannot be null or if the account belongs to First Direct Everyday Saving Account and the account is in collections.',
      'Default accounts which are settled with no outstanding balance and valid default satisfaction date are not produced again in snap reporting with exception of them being reported as with Debt Sales records with Delete marker.',
      'Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts get populated under First Direct Retail portfolio.',
    ],
  },
  {
    brandName: 'HSBC Retail Brand Code 85',
    brandCode: '85',
    bullets: [
      'Customer accounts need to be mapped with the primary account owners associated with accounts. (In other words, Customer fully owns the account).',
      'Product Hierarchy should be set up as PDS1 (938) eligible to be reported in CRA Reporting.',
      "Product relation end date should be either '0001-01-01' or null or it should be greater than the reporting date",
      'Customer age should be at least 18 years for getting reported to bureaus.',
      'Own Institution (OWN_INSTT <>1) indicator and OWN_GRP_TYCD (DWH_ARRG_XREF table) <> "FD" OR OWN_GRP_TYCD (DWH_ARRG_XREF table) is not blank.',
      'TSS_CUST_ID (DWH_IP_XREF table) should be null.',
      'For all accounts, Positive data sharing indicator should not be set as "Y" for data reporting OR For non-default accounts, if Positive data sharing indicator is set as <> "N" and for mortgages and second mortgages products account opening date should be greater than 15th September 2003, rest for all other products the account opening date should be greater than 29th November 2002. If the account is closed then it should have closed within the reporting period, if compliant with condition, then account will get reported else drop the accounts ELSE IF For default accounts, it should be reported to the bureaus for 71 months from the account closure date irrespective of the positive data sharing indicator value.',
      'RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null',
      'Product classification cannot be null, or BDRAS date of default cannot be null',
      'Default accounts which are settled with no outstanding balance and valid default satisfaction date are not produced again in snap reporting with exception of them being reported as with Debt Sales records with Delete marker.',
      'Unsecured Loans, Debt Consolidated Loans, Current Accounts, Mortgages, Second Mortgages, Flexible Mortgages, Revolving Accounts and Basic Bank Accounts gets populated under HSBC Retail portfolio.',
    ],
  },
  {
    brandName: 'M&S Current Accounts Brand Code 662',
    brandCode: '662',
    bullets: [
      'Customer accounts need to be mapped with the primary account owners associated with it. (In other words, Customer fully owns the account).',
      'Product Hierarchy should be set up as Gleam (937) eligible to be reported in CRA Reporting.',
      'Customer age should be at least 18 years for getting reported to bureaus.',
      'Own Institution (OWN_INSTT =1) indicator should be set up as 1 for identifying M&S customers in DWH_CUST Table',
      'For a non-default account: Positive data sharing indicator should not be set as "N" and if the account is closed then it should have closed in the reporting month OR if it is a default account then it should get reported for ~ 6 years (71 months).',
      'RPS_ACCT_ID_14 (14-digit RPS Customer account number) should not be null',
      'Product category is inclusive of MC and MI',
      'Current accounts are the only product reported under Gleam product Hierarchy.',
      'Product classification cannot be null, or BDRAS date of default cannot be null',
    ],
  },
  {
    brandName: 'HSBC Cards Brand Code 51',
    brandCode: '51',
    bullets: ['[Business rule content to be confirmed by BA]'],
  },
];

export const SUPPORTED_PRODUCTS = [
  ['02', 'Unsecured Loan'],
  ['03', 'Mortgage'],
  ['04', 'Revolving Account'],
  ['05', 'Credit Card'],
  ['06', 'Charge Card'],
  ['15', 'Current Account'],
  ['16', 'Second Mortgage'],
  ['19', 'Fixed Term Deferred Payment'],
  ['25', 'Flexible Mortgage'],
  ['26', 'Debt Consolidated Loan'],
  ['71', 'Basic Bank Account'],
];

export const CAIS_44_VARIABLES = [
  ['1', 'Close Date'],
  ['2', 'Monthly Payment (Derived)'],
  ['3', 'Repayment period (Derived)'],
  ['4', 'Current Balance (Derived)'],
  ['5', 'Account Status (Derived)'],
  ['6', 'Flag settings (Derived)'],
  ['7', 'Transaction Flag'],
  ['8', 'Payment frequency'],
  ['9', 'Account Number'],
  ['10', 'Sequence Number'],
  ['11', 'Account Type'],
  ['12', 'Start Date'],
  ['13', 'Credit Balance indicator (Derived)'],
  ['14', 'Payment amount'],
  ['15', 'Name'],
  ['16', 'Date of Birth'],
  ['17', 'Original Default Balance'],
  ['18', 'New Sequence Number'],
  ['19', 'Special instruction indicator'],
  ['20', 'Experian Block'],
  ['21', 'Credit Payment indicator'],
  ['22', 'Previous Statement Balance'],
  ['23', 'Previous Statement Balance Indicator'],
  ['24', 'Number of cash advances'],
  ['25', 'Value of cash advances'],
  ['26', 'Payment Code'],
  ['27', 'Promotion activity Flag'],
  ['28', 'Filler 1'],
  ['29', 'Transient Association Flag'],
  ['30', 'Air time Flag'],
  ['31', 'Address1'],
  ['32', 'Address2'],
  ['33', 'Address3'],
  ['34', 'Address4'],
  ['35', 'Postcode'],
  ['36', 'Credit Limit'],
  ['37', 'Filler2'],
  ['38', 'Transferred to collection account'],
  ['39', 'Balance type'],
  ['40', 'Credit turnover'],
  ['41', 'Primary Account indicator'],
  ['42', 'Default Satisfaction date'],
  ['43', 'Filler3'],
  ['44', 'New Account Number'],
];
