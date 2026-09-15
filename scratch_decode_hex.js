const zlib = require('zlib');
const baseUrl = 'https://cais-hld-generator.vercel.app';

async function decodePdfHexText() {
  const res = await fetch(`${baseUrl}/api/export/pdf?_t=${Date.now()}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  let allDecoded = '';

  while ((match = streamRegex.exec(buf.toString('latin1'))) !== null) {
    try {
      const streamBuf = Buffer.from(match[1], 'latin1');
      const decompressed = zlib.inflateSync(streamBuf).toString('latin1');
      
      // Convert hex strings <435241...> to plain text
      const hexDecoded = decompressed.replace(/<([0-9a-fA-F]+)>/g, (m, hex) => {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
      });

      allDecoded += hexDecoded + '\n';
    } catch (e) {}
  }

  const checkList = [
    'Data Engineering | Data Services',
    'HSBC Operations, Services and Technology',
    'RESTRICTED',
    '1. Business Overview and Requirements Summary',
    '1.1 Conceptual Data Flow Diagram',
    '/int2liv/feeds/CRP00006/data/',
    '1.2 Retail Brands Staging Elegibility & Exclusion Criteria',
    '1.3 Validation Rules on snap prior to extract file is sent to the CRAs',
    'M&S Loans Brand Code 947',
    'First Direct Cards Brand Code 211',
    'Supported Products for CRA Data Reporting',
    'CAIS Variables (Retail Banking)',
  ];

  console.log('--- HEX DECODED EMBEDDED TEXT CHECK ---');
  for (const s of checkList) {
    console.log(` - "${s}":`, allDecoded.includes(s));
  }
}

decodePdfHexText().catch(console.error);
