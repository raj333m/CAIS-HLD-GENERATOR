const { GET } = require('./src/app/api/export/pdf/route.ts');

async function testPdfLocal() {
  console.log('Testing PDF export handler locally...');
  const response = await GET();
  console.log('PDF response status:', response.status);
  const arrayBuf = await response.arrayBuffer();
  console.log('PDF Buffer length:', arrayBuf.byteLength);
}

testPdfLocal().catch(console.error);
