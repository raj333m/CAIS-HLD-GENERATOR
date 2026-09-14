export interface CAISItemDef {
  pos: number;
  code: string;
  name: string;
  category: string;
  definition: string;
}

export const STANDARD_CAIS_ITEMS: CAISItemDef[] = [
  { pos: 1, code: 'CLOSE_DATE', name: 'Close Date', category: 'Account Identification', definition: 'YYYYMMDD format when account closed; blank if active.' },
  { pos: 2, code: 'MONTHLY_PMT', name: 'Monthly Payment (Derived)', category: 'Balance & Limit', definition: 'CU Team derived monthly contractual payment amount in GBP.' },
  { pos: 3, code: 'REPAY_PER', name: 'Repayment period (Derived)', category: 'Account Identification', definition: 'CU Team derived total repayment term in months.' },
  { pos: 4, code: 'CURRENT_BAL', name: 'Current Balance (Derived)', category: 'Balance & Limit', definition: 'CU Team derived outstanding balance (+ for debt, - for credit balance).' },
  { pos: 5, code: 'ACC_STATUS', name: 'Account Status (Derived)', category: 'Status & Arrears', definition: 'CU Team derived status (0=Up to Date, 1-6=Months in Arrears, D=Default, S=Settled).' },
  { pos: 6, code: 'FLAG_SETTINGS', name: 'Flag settings (Derived)', category: 'Special Flags', definition: 'CU Team derived special arrangement indicator flag.' },
  { pos: 7, code: 'TRANS_FLAG', name: 'Transaction Flag', category: 'Account Identification', definition: 'N=New Account, U=Update Record, D=Delete Record.' },
  { pos: 8, code: 'PMT_FREQ', name: 'Payment frequency', category: 'Account Identification', definition: 'M=Monthly, W=Weekly, Q=Quarterly, A=Annual.' },
  { pos: 9, code: 'ACC_NUM', name: 'Account Number', category: 'Account Identification', definition: 'Primary account identifier (up to 18 characters).' },
  { pos: 10, code: 'SEQ_NUM', name: 'Sequence Number', category: 'Account Identification', definition: 'Joint customer sequence number (001=Primary, 002=Joint).' },
  { pos: 11, code: 'ACC_TYPE', name: 'Account Type', category: 'Account Identification', definition: '2-digit CAIS product type code (02=Loan, 05=Credit Card, 06=Overdraft).' },
  { pos: 12, code: 'START_DATE', name: 'Start Date', category: 'Account Identification', definition: 'Account open date (YYYYMMDD).' },
  { pos: 13, code: 'CREDIT_BAL_IND', name: 'Credit Balance indicator (Derived)', category: 'Balance & Limit', definition: 'Y if balance is in credit, blank otherwise.' },
  { pos: 14, code: 'PMT_AMT', name: 'Payment amount', category: 'Balance & Limit', definition: 'Actual cash payment received in reporting period.' },
  { pos: 15, code: 'CUST_NAME', name: 'Name', category: 'Account Identification', definition: 'Customer full legal title, forename, surname.' },
  { pos: 16, code: 'DOB', name: 'Date of Birth', category: 'Account Identification', definition: 'Customer DOB (YYYYMMDD format).' },
  { pos: 17, code: 'ORIG_DEF_BAL', name: 'Original Default Balance', category: 'Default & Recovery', definition: 'Outstanding balance at initial default notice date.' },
  { pos: 18, code: 'NEW_SEQ_NUM', name: 'New Sequence Number', category: 'Account Identification', definition: 'Updated joint customer sequence number.' },
  { pos: 19, code: 'SPEC_INST_FLAG', name: 'Special Instruction Indicator', category: 'Special Flags', definition: 'Flags for Deceased, Fraud, Forbearance, Payment Holiday.' },
  { pos: 20, code: 'EXP_BLOCK', name: 'Experian Block', category: 'Special Flags', definition: 'Experian-specific block code indicator.' },
  { pos: 21, code: 'CREDIT_PMT_IND', name: 'Credit Payment indicator', category: 'Balance & Limit', definition: 'Indicator for credit payment processing.' },
  { pos: 22, code: 'PREV_STMT_BAL', name: 'Previous Statement Balance', category: 'Balance & Limit', definition: 'Prior month closing statement balance.' },
  { pos: 23, code: 'PREV_STMT_BAL_IND', name: 'Previous Statement Balance Indicator', category: 'Balance & Limit', definition: 'Sign indicator (+/-) for previous statement balance.' },
  { pos: 24, code: 'NUM_CASH_ADV', name: 'Number of Cash Advances', category: 'Balance & Limit', definition: 'Cash advance transaction count in period.' },
  { pos: 25, code: 'VAL_CASH_ADV', name: 'Value of Cash Advances', category: 'Balance & Limit', definition: 'Total cash advance GBP monetary value.' },
  { pos: 26, code: 'PMT_CODE', name: 'Payment Code', category: 'Status & Arrears', definition: 'Payment method code (Direct Debit, Standing Order, Cheque).' },
  { pos: 27, code: 'PROMO_ACT_FLAG', name: 'Promotion Activity Flag', category: 'Special Flags', definition: 'Promotional 0% rate flag.' },
  { pos: 28, code: 'FILLER_1', name: 'Filler 1', category: 'Account Identification', definition: 'Reserved specification filler.' },
  { pos: 29, code: 'TRANSIENT_ASSOC_FLAG', name: 'Transient Association Flag', category: 'Special Flags', definition: 'Association linkage flag.' },
  { pos: 30, code: 'AIR_TIME_FLAG', name: 'Air time Flag', category: 'Special Flags', definition: 'Telecom/airtime flag.' },
  { pos: 31, code: 'ADDR_1', name: 'Address1', category: 'Account Identification', definition: 'Residential address line 1.' },
  { pos: 32, code: 'ADDR_2', name: 'Address2', category: 'Account Identification', definition: 'Residential address line 2.' },
  { pos: 33, code: 'ADDR_3', name: 'Address3', category: 'Account Identification', definition: 'Residential address line 3.' },
  { pos: 34, code: 'ADDR_4', name: 'Address4', category: 'Account Identification', definition: 'Residential address line 4.' },
  { pos: 35, code: 'POSTCODE', name: 'Postcode', category: 'Account Identification', definition: 'Valid UK Postcode.' },
  { pos: 36, code: 'CREDIT_LIMIT', name: 'Credit Limit', category: 'Balance & Limit', definition: 'Sanctioned credit facility limit.' },
  { pos: 37, code: 'FILLER_2', name: 'Filler 2', category: 'Account Identification', definition: 'Reserved specification filler.' },
  { pos: 38, code: 'TRANSFER_COLL_ACC', name: 'Transferred to collection account', category: 'Default & Recovery', definition: 'Y if assigned to Debt Collection Agency (DCA).' },
  { pos: 39, code: 'BAL_TYPE', name: 'Balance type', category: 'Balance & Limit', definition: 'D=Debt balance, C=Credit balance.' },
  { pos: 40, code: 'CREDIT_TURNOVER', name: 'Credit turnover', category: 'Balance & Limit', definition: 'Total credit turn-over applied in month.' },
  { pos: 41, code: 'PRIMARY_ACC_IND', name: 'Primary Account indicator', category: 'Account Identification', definition: 'Y=Primary account holder, N=Secondary holder.' },
  { pos: 42, code: 'DEF_SAT_DATE', name: 'Default Satisfaction Date', category: 'Default & Recovery', definition: 'Date defaulted debt was fully settled (YYYYMMDD).' },
  { pos: 43, code: 'FILLER_3', name: 'Filler 3', category: 'Account Identification', definition: 'Reserved specification filler.' },
  { pos: 44, code: 'NEW_ACC_NUM', name: 'New Account Number', category: 'Account Identification', definition: 'Replacement account number if re-issued.' },
];

export const STANDARD_BRANDS = [
  'Experian',
  'Equifax',
  'TransUnion',
  'HSBC Cards (51)',
  'First Direct (211)',
  'M&S Loans (947)',
];

export function isItemMatchedInText(item: CAISItemDef, rawText: string): boolean {
  if (!rawText) return false;
  const lower = rawText.toLowerCase();
  const nameLower = item.name.toLowerCase();
  const codeLower = item.code.toLowerCase();
  const posFormatted = `${item.pos < 10 ? '0' + item.pos : item.pos}`;
  
  // Check exact position number e.g. "19. Special Instruction Indicator" or "05. Account Status" or "02. Account Type"
  if (lower.includes(`${posFormatted}.`) || lower.includes(`${item.pos}.`)) return true;
  // Check code e.g. SPEC_INST_FLAG or ACC_STATUS
  if (lower.includes(codeLower)) return true;
  // Check key words in name e.g. "special instruction", "account status", "default satisfaction", "original default balance"
  if (lower.includes(nameLower)) return true;

  // Custom alias mappings for common wording in change forms
  if (item.code === 'SPEC_INST_FLAG' && (lower.includes('special instruction') || lower.includes('forbearance') || lower.includes('payment holiday'))) return true;
  if (item.code === 'ACC_STATUS' && (lower.includes('account status') || lower.includes('status code'))) return true;
  if (item.code === 'ACC_TYPE' && (lower.includes('account type') || lower.includes('bnpl') || lower.includes('product type'))) return true;
  if (item.code === 'CREDIT_LIMIT' && (lower.includes('credit limit') || lower.includes('loan amount'))) return true;
  if (item.code === 'ORIG_DEF_BAL' && (lower.includes('original default balance') || lower.includes('default balance'))) return true;
  if (item.code === 'DEF_SAT_DATE' && (lower.includes('default satisfaction date') || lower.includes('satisfaction date'))) return true;

  return false;
}

export function isBrandMatchedInText(brand: string, rawText: string): boolean {
  if (!rawText) return false;
  const lower = rawText.toLowerCase();
  const brandLower = brand.toLowerCase();

  // If change states "all bureaus" or "all 3 bureaus", match Experian, Equifax, TransUnion
  if ((lower.includes('all bureaus') || lower.includes('all 3 bureaus')) && ['experian', 'equifax', 'transunion'].some(b => brandLower.includes(b))) {
    return true;
  }

  // General brand substring match
  const brandBaseName = brand.split(' ')[0].toLowerCase(); // e.g. "experian", "hsbc", "first", "m&s"
  return lower.includes(brandBaseName);
}
