import { Resvg } from '@resvg/resvg-js';

// SVG generator for Diagram A: Conceptual Data Flow Diagram (Primary Process Flow)
export function generateDiagramASvg(): string {
  return `<svg width="800" height="920" viewBox="0 0 800 920" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial, sans-serif">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#C0272D" />
    </marker>
    <marker id="arrow-grey" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#4B5563" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="800" height="920" fill="#FFFFFF" rx="8" />

  <!-- Diagram Title Banner -->
  <rect x="20" y="15" width="760" height="35" fill="#F8FAFC" stroke="#E2E8F0" rx="6" />
  <text x="35" y="38" font-size="14" font-weight="bold" fill="#C0272D">1.1 Conceptual Data Flow Diagram — Primary Extract Processing Flow</text>

  <!-- 1. Retail Staging & 2. Cards Staging -->
  <rect x="140" y="70" width="220" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="250" y="96" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">1. Retail Staging Table</text>

  <rect x="440" y="70" width="220" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="550" y="96" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">2. Cards Staging Table</text>

  <!-- Flow 1 -> 3 Exclusions -->
  <path d="M 250 112 L 250 142" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="160" y="145" width="180" height="38" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5" rx="5" />
  <text x="250" y="169" font-size="12" font-weight="bold" fill="#15803D" text-anchor="middle">3. Exclusions</text>

  <!-- Flow 3 -> 4 Debt Sale -->
  <path d="M 250 183 L 250 212" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="160" y="215" width="180" height="38" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" rx="5" />
  <text x="250" y="239" font-size="12" font-weight="bold" fill="#B45309" text-anchor="middle">4. Debt Sale</text>

  <!-- Flow 4 & Cards -> 5 Staging Validation -->
  <path d="M 250 253 L 250 282" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <path d="M 550 112 L 550 260 L 370 260 L 370 282" stroke="#C0272D" stroke-width="1.5" stroke-dasharray="4,4" fill="none" />

  <rect x="140" y="285" width="480" height="45" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" rx="6" />
  <text x="380" y="312" font-size="13" font-weight="bold" fill="#1D4ED8" text-anchor="middle">5. Staging Table Validation</text>

  <!-- Flow 5 -> 6 Address Processing (Right) -->
  <path d="M 620 307 L 660 307" stroke="#2563EB" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="665" y="288" width="120" height="38" fill="#F3E8FF" stroke="#9333EA" stroke-width="1.5" rx="5" />
  <text x="725" y="311" font-size="11" font-weight="bold" fill="#7E22CE" text-anchor="middle">6. Address Proc.</text>

  <!-- Container Box: SAS Processing -->
  <rect x="100" y="360" width="400" height="230" fill="#FAFAFA" stroke="#64748B" stroke-width="1.5" stroke-dasharray="6,4" rx="8" />
  <text x="120" y="382" font-size="12" font-weight="bold" fill="#475569">SAS Processing (CADS Container)</text>

  <!-- Flow 5 -> 7 Data Loaded to DWH_PDS_STAG for CADS -->
  <path d="M 300 330 L 300 400" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="120" y="405" width="360" height="40" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" rx="5" />
  <text x="300" y="430" font-size="11" font-weight="bold" fill="#0369A1" text-anchor="middle">7. Data Loaded to DWH_PDS_STAG for CADS</text>

  <!-- Flow 7 -> 8 CADS Processing -->
  <path d="M 300 445 L 300 472" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="150" y="475" width="300" height="40" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" rx="5" />
  <text x="300" y="500" font-size="11" font-weight="bold" fill="#0369A1" text-anchor="middle">8. CADS Processing</text>

  <!-- Flow 8 -> 9 DWH_IP_ARRG_CALC_V -->
  <path d="M 300 515 L 300 542" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="150" y="545" width="300" height="38" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5" rx="5" />
  <text x="300" y="569" font-size="11" font-weight="bold" fill="#15803D" text-anchor="middle">9. DWH_IP_ARRG_CALC_V</text>

  <!-- Box to right outside SAS: Create File from DWH_IP_ARRG_CALC_V -->
  <path d="M 450 495 L 530 495" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="535" y="475" width="245" height="40" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="657" y="499" font-size="11" font-weight="bold" fill="#991B1B" text-anchor="middle">Create File from DWH_IP_ARRG_CALC_V</text>

  <!-- Flow 9 -> 10 Load CARDS data to CAIS Snap Shot -->
  <path d="M 300 583 L 300 622" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <path d="M 657 515 L 657 600 L 480 600 L 480 622" stroke="#C0272D" stroke-width="1.5" fill="none" />

  <rect x="140" y="625" width="480" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="380" y="651" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">10. Load CARDS data to CAIS Snap Shot</text>

  <!-- Flow 10 -> 11 Load RETAIL data to CAIS Snap Shot -->
  <path d="M 380 667 L 380 697" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="140" y="700" width="480" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="380" y="726" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">11. Load RETAIL data to CAIS Snap Shot</text>

  <!-- Flow 11 -> 12 Final Validations -->
  <path d="M 380 742 L 380 772" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
  <rect x="180" y="775" width="400" height="40" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" rx="5" />
  <text x="380" y="800" font-size="12" font-weight="bold" fill="#1D4ED8" text-anchor="middle">12. Final Validations (Stuart Lindsay &amp; CUT Sign-off)</text>

  <!-- Flow 12 -> 13 Ad-hoc File Processing (shaded grey) -->
  <path d="M 380 815 L 380 842" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow-grey)" fill="none" />
  <rect x="180" y="845" width="400" height="36" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.5" rx="5" />
  <text x="380" y="868" font-size="11" font-weight="bold" fill="#1F2937" text-anchor="middle">13. Ad-hoc File Processing (if required - Shaded Grey)</text>

  <!-- Flow 13 -> 14 File Transmitted to CRA's -->
  <path d="M 380 881 L 380 902" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow)" fill="none" />
</svg>`;
}

// SVG generator for Diagram B: Detailed Operational Swimlane Diagram
export function generateDiagramBSvg(): string {
  return `<svg width="840" height="980" viewBox="0 0 840 980" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial, sans-serif">
  <defs>
    <marker id="arrow-b" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#C0272D" />
    </marker>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
    </marker>
    <linearGradient id="red-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEE2E2" />
      <stop offset="100%" stop-color="#FFEDD5" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="840" height="980" fill="#FFFFFF" rx="8" />

  <!-- Diagram Title Banner -->
  <rect x="20" y="15" width="800" height="35" fill="#F8FAFC" stroke="#E2E8F0" rx="6" />
  <text x="35" y="38" font-size="14" font-weight="bold" fill="#C0272D">1.1 Diagram B — Operational Swimlane &amp; Manual Intervention Map</text>

  <!-- Top Row: HSBC Retail Staging Table Load & HSBC Cards Staging Table Load -->
  <rect x="80" y="70" width="280" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="220" y="96" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">HSBC Retail Staging Table Load</text>

  <rect x="480" y="70" width="280" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="620" y="96" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">HSBC Cards Staging Table Load</text>

  <!-- File Watch for Exclusions File -> Exclusions Processing -->
  <rect x="40" y="150" width="220" height="38" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5" rx="5" />
  <text x="150" y="174" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">File Watch for Exclusions File</text>

  <path d="M 260 169 L 300 169" stroke="#64748B" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <rect x="305" y="150" width="220" height="38" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5" rx="5" />
  <text x="415" y="174" font-size="11" font-weight="bold" fill="#15803D" text-anchor="middle">Exclusions Processing</text>

  <!-- Amber/Yellow dashed box: Manual Step (If error, sort out and return) -->
  <rect x="550" y="140" width="260" height="58" fill="#FEF3C7" stroke="#D97706" stroke-width="2" stroke-dasharray="5,5" rx="6" />
  <text x="680" y="162" font-size="10" font-weight="bold" fill="#92400E" text-anchor="middle">Manual Step — If error, the sort out</text>
  <text x="680" y="178" font-size="10" font-weight="bold" fill="#92400E" text-anchor="middle">and return Staging Table Validation</text>

  <!-- Arrow to Staging Table Validation -->
  <path d="M 220 112 L 220 220 L 320 220 L 320 240" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <path d="M 620 112 L 620 220 L 500 220 L 500 240" stroke="#C0272D" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <path d="M 415 188 L 415 240" stroke="#16A34A" stroke-width="1.5" fill="none" />
  <path d="M 680 198 L 680 225 L 560 225 L 560 240" stroke="#D97706" stroke-width="1.5" stroke-dasharray="4,4" fill="none" />

  <rect x="180" y="245" width="480" height="45" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" rx="6" />
  <text x="420" y="272" font-size="13" font-weight="bold" fill="#1D4ED8" text-anchor="middle">Staging Table Validation</text>

  <!-- Address File Processing -->
  <path d="M 420 290 L 420 322" stroke="#2563EB" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <rect x="260" y="325" width="320" height="38" fill="#F3E8FF" stroke="#9333EA" stroke-width="1.5" rx="5" />
  <text x="420" y="349" font-size="11" font-weight="bold" fill="#7E22CE" text-anchor="middle">Address File Processing</text>

  <!-- Container: HSBC SAS Processing -->
  <rect x="80" y="390" width="680" height="150" fill="#FAFAFA" stroke="#64748B" stroke-width="1.5" stroke-dasharray="6,4" rx="8" />
  <text x="100" y="412" font-size="12" font-weight="bold" fill="#475569">HSBC SAS Processing Container</text>

  <rect x="100" y="430" width="190" height="40" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" rx="5" />
  <text x="195" y="455" font-size="11" font-weight="bold" fill="#0369A1" text-anchor="middle">HSBC SAS Processing</text>

  <!-- Light blue box: Manual Step -->
  <path d="M 290 450 L 320 450" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <rect x="325" y="430" width="140" height="40" fill="#E0F2FE" stroke="#0284C7" stroke-width="2" rx="5" />
  <text x="395" y="455" font-size="11" font-weight="bold" fill="#0369A1" text-anchor="middle">Manual Step</text>

  <path d="M 465 450 L 495 450" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <rect x="500" y="430" width="240" height="40" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" rx="5" />
  <text x="620" y="455" font-size="11" font-weight="bold" fill="#0369A1" text-anchor="middle">HSBC Load SAS Values into Warehouse</text>

  <!-- Flow to HSBC Load SAS Values Lookup -->
  <path d="M 620 470 L 620 495 L 420 495 L 420 560" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />

  <!-- RED/ORANGE GRADIENT BOX: CADS Check Results (Larger Visual Callout) -->
  <rect x="80" y="565" width="680" height="75" fill="url(#red-orange-grad)" stroke="#DC2626" stroke-width="2.5" rx="8" />
  <text x="420" y="595" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">Manual Step — CADS check results from SAS processing. Confirm data is ok.</text>
  <text x="420" y="618" font-size="12" font-weight="bold" fill="#991B1B" text-anchor="middle">And create a file for any 'ad hoc' changes</text>

  <!-- HSBC Load SAS Values Lookup -->
  <rect x="220" y="660" width="400" height="42" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5" rx="5" />
  <text x="420" y="686" font-size="12" font-weight="bold" fill="#15803D" text-anchor="middle">HSBC Load SAS Values Lookup</text>
  <path d="M 420 640 L 420 660" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />

  <!-- HSBC Cards Snapshot & HSBC Retail Snapshot -->
  <path d="M 320 702 L 320 735 L 220 735 L 220 750" stroke="#16A34A" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <path d="M 520 702 L 520 735 L 620 735 L 620 750" stroke="#16A34A" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />

  <rect x="80" y="755" width="280" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="220" y="781" font-size="11" font-weight="bold" fill="#991B1B" text-anchor="middle">HSBC Cards Snapshot Table Load</text>

  <rect x="480" y="755" width="280" height="42" fill="#FEF2F2" stroke="#C0272D" stroke-width="1.5" rx="5" />
  <text x="620" y="781" font-size="11" font-weight="bold" fill="#991B1B" text-anchor="middle">HSBC Retail Snapshot Table Load</text>

  <!-- Adhoc & Debt Sale File Watch -->
  <rect x="40" y="830" width="220" height="38" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5" rx="5" />
  <text x="150" y="854" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">HSBC Adhocs File Watch</text>

  <rect x="580" y="830" width="220" height="38" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5" rx="5" />
  <text x="690" y="854" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Debt Sale File Watch</text>

  <!-- Standard Adhoc Job & Debt Sale Job -->
  <path d="M 150 868 L 150 895" stroke="#64748B" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <path d="M 690 868 L 690 895" stroke="#64748B" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />

  <rect x="50" y="898" width="200" height="38" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.5" rx="5" />
  <text x="150" y="922" font-size="11" font-weight="bold" fill="#1F2937" text-anchor="middle">HSBC Standard Adhoc Job</text>

  <rect x="590" y="898" width="200" height="38" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" rx="5" />
  <text x="690" y="922" font-size="11" font-weight="bold" fill="#B45309" text-anchor="middle">Debt Sale Job</text>

  <!-- Backup & Validation -> File Creation -->
  <path d="M 250 917 L 310 917" stroke="#4B5563" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />
  <path d="M 590 917 L 530 917" stroke="#D97706" stroke-width="2" marker-end="url(#arrow-b)" fill="none" />

  <rect x="315" y="898" width="210" height="38" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.5" rx="5" />
  <text x="420" y="922" font-size="11" font-weight="bold" fill="#1D4ED8" text-anchor="middle">HSBC Backup &amp; Validation</text>
</svg>`;
}

// Helper to convert SVG strings to PNG Buffers
export function getDiagramAPngBuffer(): Buffer {
  const svg = generateDiagramASvg();
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

export function getDiagramBPngBuffer(): Buffer {
  const svg = generateDiagramBSvg();
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}
