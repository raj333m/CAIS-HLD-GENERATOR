const zlib = require('zlib');
const baseUrl = 'https://cais-hld-generator.vercel.app';

async function dumpPdfStreams() {
  const res = await fetch(`${baseUrl}/api/export/pdf?_t=${Date.now()}`);
  const buf = Buffer.from(await res.arrayBuffer());

  console.log('PDF Total Buffer Length:', buf.length, 'bytes');

  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  let idx = 0;

  while ((match = streamRegex.exec(buf.toString('latin1'))) !== null) {
    idx++;
    try {
      const streamBuf = Buffer.from(match[1], 'latin1');
      const decompressed = zlib.inflateSync(streamBuf).toString('latin1');
      console.log(`--- STREAM #${idx} (length ${decompressed.length}) ---`);
      console.log(decompressed.substring(0, 400));
    } catch (e) {
      // Ignore
    }
  }
}

dumpPdfStreams().catch(console.error);
