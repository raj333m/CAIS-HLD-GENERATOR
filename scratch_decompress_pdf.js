const zlib = require('zlib');
const baseUrl = 'https://cais-hld-generator.vercel.app';

async function checkDecompressedPdf() {
  console.log('Fetching PDF from Vercel...');
  const res = await fetch(`${baseUrl}/api/export/pdf?_t=${Date.now()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('PDF Buffer Length:', buf.length);

  // Extract all FlateDecode streams in PDF
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  let allDecompressedText = '';
  let streamCount = 0;

  while ((match = streamRegex.exec(buf.toString('latin1'))) !== null) {
    streamCount++;
    try {
      const streamBuf = Buffer.from(match[1], 'latin1');
      const decompressed = zlib.inflateSync(streamBuf);
      allDecompressedText += decompressed.toString('utf8') + '\n';
    } catch (e) {
      // Ignore non-flate or raw uncompressed streams
    }
  }

  console.log(`Decompressed ${streamCount} streams.`);
  console.log('Decompressed Text Preview:', allDecompressedText.substring(0, 300));

  const stringsToCheck = [
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

  console.log('\n--- DECOMPRESSED PDF EMBEDDED TEXT CHECK ---');
  for (const s of stringsToCheck) {
    console.log(` - "${s}":`, allDecompressedText.includes(s));
  }
}

checkDecompressedPdf().catch(console.error);
