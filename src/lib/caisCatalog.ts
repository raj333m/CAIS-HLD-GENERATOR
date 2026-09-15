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

/**
 * Strict matching between a CAIS catalog item and a change record's `impactedDataItems`.
 * Evaluates EXCLUSIVELY the `impactedDataItems` field (never title, description, or sectionsUpdated).
 */
export function isItemMatchedInChange(item: CAISItemDef, change: any): boolean {
  const rawItems = change?.impactedDataItems;
  if (!rawItems || typeof rawItems !== 'string' && !Array.isArray(rawItems)) return false;

  const chips: string[] = Array.isArray(rawItems)
    ? rawItems.map((c) => String(c))
    : String(rawItems).split(/[,;]+/);

  const itemNameLower = item.name.toLowerCase();
  const itemCodeLower = item.code.toLowerCase();

  for (let chip of chips) {
    chip = chip.trim();
    if (!chip) continue;
    const chipLower = chip.toLowerCase();

    // 1. Match by Item Name substring e.g. "account type", "special instruction indicator", "original default balance"
    if (chipLower.includes(itemNameLower)) return true;

    // 2. Match by Item Field Code e.g. ACC_TYPE, SPEC_INST_FLAG, ORIG_DEF_BAL, DEF_SAT_DATE, CREDIT_LIMIT, ACC_STATUS
    if (chipLower.includes(itemCodeLower)) return true;

    // 3. Match by Position Number if chip specifies prefix e.g. "19.", "05.", "11.", "17.", "36.", "42."
    const posPadded = item.pos < 10 ? `0${item.pos}` : `${item.pos}`;
    const posStr = `${item.pos}`;

    // Ensure position matches at start of token (e.g. "19. Special...", "05. Account...")
    const matchPosPrefix = chipLower.startsWith(`${posPadded}.`) || chipLower.startsWith(`${posStr}.`) || chipLower.startsWith(`${posPadded} `) || chipLower.startsWith(`${posStr} `);

    if (matchPosPrefix) {
      // Check that the token does not explicitly state a DIFFERENT catalog item's name
      // e.g. If token is "02. Account Type", it starts with "02." but names "Account Type" (Pos 11).
      // So Pos 2 ("Monthly Payment") should NOT match.
      const hasDifferentCatalogName = STANDARD_CAIS_ITEMS.some((other) => {
        if (other.pos === item.pos) return false;
        return chipLower.includes(other.name.toLowerCase());
      });

      if (!hasDifferentCatalogName) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Strict matching between a Brand/Bureau name and a change record's `impactedBureaus`.
 * Evaluates EXCLUSIVELY the `impactedBureaus` field.
 */
export function isBrandMatchedInChange(brand: string, change: any): boolean {
  const rawBureaus = change?.impactedBureaus;
  if (!rawBureaus || (typeof rawBureaus !== 'string' && !Array.isArray(rawBureaus))) return false;

  const text = Array.isArray(rawBureaus) ? rawBureaus.join(' ') : String(rawBureaus);
  const textLower = text.toLowerCase();
  const brandLower = brand.toLowerCase();

  // Universal / default bureau matching: "all", "experian", "equifax", "transunion", "all 3 bureaus", "all bureaus"
  // since requirements apply to all credit reference agencies universally.
  if (
    textLower.includes('all') ||
    textLower.includes('experian') ||
    textLower.includes('equifax') ||
    textLower.includes('transunion')
  ) {
    return true;
  }

  // Portfolio specific matching
  if (brandLower.includes('cards') && (textLower.includes('cards') || textLower.includes('51'))) return true;
  if (brandLower.includes('retail') && (textLower.includes('retail') || textLower.includes('85'))) return true;
  if (brandLower.includes('first direct') && (textLower.includes('first direct') || textLower.includes('211') || textLower.includes('fd'))) return true;
  if (brandLower.includes('loans') && (textLower.includes('loans') || textLower.includes('947'))) return true;
  if (brandLower.includes('current accounts') && (textLower.includes('current accounts') || textLower.includes('662'))) return true;

  // Brand group level matching
  if (brandLower.startsWith('hsbc') && textLower.includes('hsbc')) return true;
  if (brandLower.startsWith('m&s') && (textLower.includes('m&s') || textLower.includes('m & s'))) return true;

  return textLower.includes(brandLower);
}
