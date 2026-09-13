export interface IntakeFormData {
  title: string;
  changeReference: string;
  description: string;
  regulatoryDriver: string;
  requestedBy: string;
  targetMonth: string;
  changeTypes: string[];
  
  // Data Item Impact
  dataItemImpacts: Array<{
    dataItemId?: string;
    itemCode?: string;
    itemName?: string;
    customItemName?: string;
    currentDefinition: string;
    newDefinition: string;
    sourceSystem: string;
    mappingNotes: string;
    appliesToExperian: boolean;
    appliesToEquifax: boolean;
    appliesToTransunion: boolean;
  }>;

  // Bureau Impact
  bureauNotes: Array<{
    bureauId?: string;
    bureauName: string;
    applies: boolean;
    targetDate: string;
    notes: string;
  }>;

  // Data flow
  sourceToBureauFlow: string;

  // Non functional
  dataQualityChecks: string;
  errorHandling: string;
  auditTrail: string;
  dataProtection: string;
  consumerImpact: string;

  // Testing & Rollout
  uatApproach: string;
  implementationDate: string;
  rollbackApproach: string;

  // Risk, assumptions, constraints, dependencies
  assumptions: string;
  constraints: string;
  dependencies: string;
  risks: Array<{ risk: string; impact: string; mitigation: string }>;
  stakeholders: Array<{ name: string; team: string; role: string }>;

  // Optional Current State
  currentStateNotes?: string;
}

export function generateStructuredHldContent(intake: IntakeFormData, authorName: string) {
  // Generate Glossary based on terms present
  const standardGlossary = [
    { term: 'CAIS', definition: 'Credit Account Information Sharing — the monthly credit data submission format shared among UK Credit Reference Agencies (Experian, Equifax, TransUnion).' },
    { term: 'CRA', definition: 'Credit Reference Agency — organizations licensed to collect and hold consumer credit performance records (Experian, Equifax, TransUnion).' },
    { term: 'Arrears Status Code', definition: 'Numerical flag (0 to 6) indicating the exact payment delinquency stage of an account in months.' },
    { term: 'Default Date / Balance', definition: 'The official date and outstanding balance registered when a credit agreement is formally defaulted under regulatory guidelines.' },
    { term: 'Forbearance / Arrangement', definition: 'Concessionary payment arrangement granted to customers experiencing temporary financial distress.' },
  ];

  const content = {
    docControl: {
      title: intake.title,
      changeRef: intake.changeReference,
      version: '1.0',
      author: authorName,
      reviewer: 'Unassigned',
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0],
      targetMonth: intake.targetMonth,
    },
    execSummary: `This High-Level Design (HLD) document outlines the required architectural, ETL transformation, and regulatory reporting changes for "${intake.title}" (${intake.changeReference}) scheduled for implementation in ${intake.targetMonth}. The change addresses: ${intake.description}`,
    regulatoryDriver: intake.regulatoryDriver || 'CAIS standard update and internal data quality governance.',
    scope: {
      inScope: `1. Reporting changes for: ${intake.changeTypes.join(', ')}.\n2. Applicable Credit Reference Agencies: Experian, Equifax, and TransUnion (Standard Scope).\n3. Impacted CAIS data items: ${intake.dataItemImpacts.map(i => i.itemName || i.customItemName || i.itemCode).join(', ')}.`,
      outOfScope: 'Technical low-level database column indexing, low-level SQL script optimization, and non-CAIS external reporting systems.',
    },
    changeTypeSummary: `The proposed modification falls under the following change categories:\n- ${intake.changeTypes.join('\n- ')}\n\nPrimary requested by: ${intake.requestedBy}.`,
    stakeholders: intake.stakeholders || [],
    currentState: intake.currentStateNotes || 'Currently, monthly CAIS extracts process account records according to baseline CAIS specifications without the specialized business rules defined in this change document.',
    proposedSolution: `To fulfill the requirements, the CAIS ETL pipeline will be updated to transform input feeds from source systems (${Array.from(new Set(intake.dataItemImpacts.map(i => i.sourceSystem))).join(', ') || 'Core Banking Engine'}). The system will apply updated validation, formatting, and bureau-specific serialization before transmitting files to Experian, Equifax, and TransUnion.`,
    dataFlow: {
      narrative: intake.sourceToBureauFlow || 'Source Systems -> Data Staging Layer -> CAIS ETL Transformation Rules -> Per-Bureau Formatting Engine -> Secure Transmission -> Bureau Response Processing.',
      diagramSpecification: `Data Pipeline: Source System (${Array.from(new Set(intake.dataItemImpacts.map(i => i.sourceSystem))).join(', ') || 'Core System'}) -> Staging & Validation Engine -> Parallel Bureau Generators (Experian, Equifax, TransUnion) -> SFTP Delivery.`,
    },
    dataItemImpacts: intake.dataItemImpacts || [],
    bureauNotes: intake.bureauNotes || [],
    nonFunctional: {
      dataQuality: intake.dataQualityChecks || 'Pre-flight reconciliation checks comparing total record count and aggregate balances between source staging and extract files.',
      errorHandling: intake.errorHandling || 'Failed or malformed records routed to an exception handling queue with automated alert notification to Data Operations.',
      auditTrail: intake.auditTrail || 'Full end-to-end lineage logged into audit repository including transformation version, timestamp, and bureau submission receipt IDs.',
      dataProtection: intake.dataProtection || 'All file payloads encrypted using AES-256 and PGP keys adhering to bank data protection policy.',
      consumerImpact: intake.consumerImpact || 'Ensures accurate reporting of consumer credit profiles and prevents erroneous default or arrears flags on credit agency records.',
    },
    testingAndRollout: {
      uatApproach: intake.uatApproach || 'Parallel test file generation using historical batch data, followed by bureau sandbox validation and formal sign-off.',
      implementationDate: intake.implementationDate || `Targeting ${intake.targetMonth} cutover window.`,
      rollbackApproach: intake.rollbackApproach || 'If file rejection rate exceeds tolerance, revert ETL logic configuration flag to previous release version.',
    },
    assumptionsConstraintsDependencies: {
      assumptions: intake.assumptions || '1. All three bureaus support the specified schema by target cut-off.\n2. Upstream source data feeds remain available per schedule.',
      constraints: intake.constraints || `Must meet monthly bureau cut-off dates for ${intake.targetMonth}.`,
      dependencies: intake.dependencies || 'Upstream core system release deployment.',
    },
    risks: intake.risks || [],
    glossary: standardGlossary,
    appendix: 'Refer to CAIS Data Reporting Guidelines and bureau-specific file specification manuals for technical field layout details.',
  };

  return JSON.stringify(content, null, 2);
}
