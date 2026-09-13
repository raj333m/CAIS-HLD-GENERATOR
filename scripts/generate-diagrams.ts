import { Graphviz } from '@hpcc-js/wasm/graphviz';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

const dotConceptual = `
digraph Conceptual {
  rankdir=TB;
  bgcolor="white";
  graph [fontname="Helvetica", nodesep=0.35, ranksep=0.55, splines=ortho];
  node [shape=box, style="filled,rounded", fillcolor="#F2F2F2", color="#404040", fontname="Helvetica", fontsize=12, margin="0.18,0.12"];
  edge [color="#404040", arrowsize=0.8, penwidth=1.2];

  n1  [label="1. Retail Staging\\nTable"];
  n2  [label="2. Cards Staging\\nTable"];
  n3  [label="3. Exclusions"];
  n4  [label="4. Debt Sale"];
  n5  [label="5. Staging Table\\nValidation", fillcolor="#FCE8E8", color="#C0272D"];
  n6  [label="6. Address\\nProcessing"];
  n7  [label="7. Data Loaded to\\nDWH_PDS_STAG for CADS"];
  n8  [label="8. CADS\\nProcessing"];
  n9  [label="9. DWH_IP_ARRG_\\nCALC_V"];
  n10 [label="10. Create File from\\nDWH_IP_ARRG_CALC_V"];
  n11 [label="11. Load CARDS data\\nto CAIS Snap-Shot"];
  n12 [label="12. Load RETAIL data\\nto CAIS Snap-Shot"];
  n13 [label="13. Final\\nValidations"];
  n14 [label="14. Ad-hoc File\\nProcessing", fillcolor="#EDEDED"];
  n15 [label="15. File Transmitted\\nto CRA's", fillcolor="#F2F2F2", color="#C0272D", penwidth=1.6];

  subgraph cluster_sas {
    label="SAS Processing";
    fontname="Helvetica"; fontsize=11; color="#AAAAAA"; style="dashed";
    n7; n8; n9;
  }

  n1 -> n3; n1 -> n5; n2 -> n3; n2 -> n5;
  n3 -> n4; n4 -> n5; n5 -> n6; n5 -> n7;
  n7 -> n8; n8 -> n9; n9 -> n10;
  n10 -> n11; n10 -> n12; n6 -> n12 [constraint=false];
  n11 -> n13; n12 -> n13; n13 -> n14; n14 -> n15;

  { rank=same; n1; n2; }
  { rank=same; n11; n12; }
}
`;

const dotTechnical = `
digraph Technical {
  rankdir=TB;
  bgcolor="white";
  graph [fontname="Helvetica", nodesep=0.3, ranksep=0.45, splines=ortho];
  node [shape=box, style="filled,rounded", fillcolor="#F2F2F2", color="#404040", fontname="Helvetica", fontsize=11, margin="0.16,0.10"];
  edge [color="#404040", arrowsize=0.75, penwidth=1.1];

  retail   [label="HSBC Retail Staging\\nTable Load"];
  cards    [label="HSBC Cards Staging\\nTable Load"];
  stg_val  [label="Staging Table\\nValidation", fillcolor="#FCE8E8", color="#C0272D"];
  manual1  [label="Manual Step:\\nif error, sort out and\\nreturn to Staging\\nTable Validation", shape=note, fillcolor="#FFF6DA", color="#B08900"];
  fw_excl  [label="File Watch for\\nExclusions File", shape=cds, fillcolor="#EAF2FB"];
  excl_pr  [label="Exclusions\\nProcessing"];
  addr_pr  [label="Address File\\nProcessing"];

  subgraph cluster_sas {
    label="HSBC SAS Processing";
    fontname="Helvetica"; fontsize=10; color="#AAAAAA"; style="dashed";
    sas1 [label="HSBC SAS\\nProcessing"];
    man2 [label="Manual Step", fillcolor="#CDEFFB", color="#1B7DA8"];
    load_wh [label="HSBC Load SAS\\nValues into Warehouse"];
    sas1 -> man2 -> load_wh;
  }

  lookup   [label="HSBC Load SAS\\nValues Lookup"];
  cads_manual [label="Manual Step:\\nCADS check results from\\nSAS processing; confirm\\ndata is OK and create a\\nfile for any ad-hoc changes", shape=note, fillcolor="#FBE2DA", color="#B5502A"];
  cards_snap [label="HSBC Cards Snapshot\\nTable Load"];
  retail_snap [label="HSBC Retail Snapshot\\nTable Load"];
  adhoc_fw  [label="HSBC Adhocs\\nFile Watch", shape=cds, fillcolor="#EAF2FB"];
  debtsale_fw [label="Debt Sale\\nFile Watch", shape=cds, fillcolor="#EAF2FB"];
  std_adhoc [label="HSBC Standard\\nAdhoc Job"];
  debtsale_job [label="Debt Sale Job"];
  backup   [label="HSBC Backup\\n& Validation"];
  filecreate [label="HSBC File\\nCreation", fillcolor="#F2F2F2", color="#C0272D", penwidth=1.6];

  retail -> stg_val; cards -> stg_val;
  stg_val -> manual1 [dir=both, style=dashed];
  fw_excl -> excl_pr; stg_val -> excl_pr [dir=both];
  stg_val -> sas1; stg_val -> addr_pr [dir=both];
  load_wh -> lookup; lookup -> cards_snap; lookup -> retail_snap;
  addr_pr -> cards_snap [constraint=false];
  addr_pr -> retail_snap [constraint=false];
  addr_pr -> cads_manual [dir=both, style=dashed];
  cads_manual -> adhoc_fw [style=dashed];
  cards_snap -> std_adhoc; retail_snap -> std_adhoc; adhoc_fw -> std_adhoc;
  debtsale_fw -> debtsale_job;
  std_adhoc -> backup; debtsale_job -> backup;
  backup -> filecreate;

  { rank=same; retail; cards; }
  { rank=same; cards_snap; retail_snap; }
  { rank=same; adhoc_fw; debtsale_fw; }
}
`;

async function main() {
  console.log('Initializing Graphviz WASM engine...');
  const graphviz = await Graphviz.load();

  const publicDir = path.join(process.cwd(), 'public', 'diagrams');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Render Conceptual Diagram
  console.log('Rendering Conceptual Data Flow Diagram...');
  const conceptualSvg = graphviz.dot(dotConceptual);
  fs.writeFileSync(path.join(publicDir, 'conceptual.svg'), conceptualSvg);

  const conceptualResvg = new Resvg(conceptualSvg, { fitTo: { mode: 'width', value: 1200 } });
  const conceptualPngBuffer = conceptualResvg.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'conceptual.png'), conceptualPngBuffer);

  // 2. Render Technical Diagram
  console.log('Rendering Technical Processing Flowchart Diagram...');
  const technicalSvg = graphviz.dot(dotTechnical);
  fs.writeFileSync(path.join(publicDir, 'technical.svg'), technicalSvg);

  const technicalResvg = new Resvg(technicalSvg, { fitTo: { mode: 'width', value: 1200 } });
  const technicalPngBuffer = technicalResvg.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'technical.png'), technicalPngBuffer);

  console.log('Successfully generated diagram assets in public/diagrams/:');
  console.log(' - public/diagrams/conceptual.svg & conceptual.png');
  console.log(' - public/diagrams/technical.svg & technical.png');
}

main().catch((e) => {
  console.error('Error generating diagrams:', e);
  process.exit(1);
});
