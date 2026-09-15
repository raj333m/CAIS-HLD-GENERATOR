const baseUrl = 'https://cais-hld-generator.vercel.app';

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function verifyExports() {
  console.log('====================================================');
  console.log('VERIFYING V77 REGULATORY EXPORTS ON VERCEL PRODUCTION');
  console.log('URL:', baseUrl);
  console.log('====================================================\n');

  await delay(10000); // Allow Vercel deployment propagation

  // 1. PDF Export Check
  console.log('Fetching GET /api/export/pdf ...');
  const pdfRes = await fetch(`${baseUrl}/api/export/pdf?_t=${Date.now()}`);
  console.log('PDF Status:', pdfRes.status);
  console.log('PDF Content-Type:', pdfRes.headers.get('content-type'));
  console.log('PDF Content-Disposition:', pdfRes.headers.get('content-disposition'));

  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
  console.log('Downloaded PDF Buffer Size:', pdfBuf.length, 'bytes');

  const pdfText = pdfBuf.toString('utf8');
  console.log('PDF Text Extraction Check:');
  console.log(' - Header text "Data Engineering | Data Services":', pdfText.includes('Data Engineering') || pdfText.includes('Data Services'));
  console.log(' - Footer text "HSBC Operations, Services and Technology":', pdfText.includes('HSBC Operations') || pdfText.includes('Services and Technology'));
  console.log(' - "RESTRICTED":', pdfText.includes('RESTRICTED'));
  console.log(' - Section 1 Title:', pdfText.includes('Business Overview and Requirements Summary'));
  console.log(' - Section 1.1 Diagram text:', pdfText.includes('Conceptual Data Flow Diagram'));
  console.log(' - Target Path "/int2liv/feeds/CRP00006/data/":', pdfText.includes('/int2liv/feeds/CRP00006/data/'));
  console.log(' - Section 1.2 "Elegibility":', pdfText.includes('Elegibility'));
  console.log(' - Section 1.3 Validation Rules placeholder:', pdfText.includes('Validation Rules on snap prior to extract file is sent to the CRAs'));

  // 2. DOCX Export Check
  console.log('\nFetching GET /api/export/docx ...');
  const docxRes = await fetch(`${baseUrl}/api/export/docx?_t=${Date.now()}`);
  console.log('DOCX Status:', docxRes.status);
  console.log('DOCX Content-Type:', docxRes.headers.get('content-type'));
  console.log('DOCX Content-Disposition:', docxRes.headers.get('content-disposition'));

  const docxBuf = Buffer.from(await docxRes.arrayBuffer());
  console.log('Downloaded DOCX Buffer Size:', docxBuf.length, 'bytes');

  console.log('\n====================================================');
  console.log('EXPORT VERIFICATION COMPLETE');
  console.log('====================================================');
}

verifyExports().catch(console.error);
