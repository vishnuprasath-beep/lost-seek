const fs = require('fs');
const path = require('path');
const pdfHandler = require('../api/pdf.js');

async function testPdf() {
  console.log('Testing api/pdf.js locally...');

  // Mock req and res
  const req = {
    method: 'GET',
    url: 'http://localhost/api/pdf?id=test-report-123&type=report'
  };

  const chunks = [];
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      console.log('Response JSON:', obj);
      return this;
    },
    write(chunk) {
      chunks.push(chunk);
    },
    end(chunk) {
      if (chunk) chunks.push(chunk);
      const totalBuffer = Buffer.concat(chunks);
      console.log(`PDF Generated! Buffer Size: ${totalBuffer.length} bytes`);
      console.log('Headers:', this.headers);

      // Verify PDF header magic bytes %PDF-
      const header = totalBuffer.slice(0, 5).toString('ascii');
      console.log('PDF Header Magic Bytes:', header);
      if (header.startsWith('%PDF-')) {
        console.log('TEST RESULT: VALID PDF STRUCTURE CONFIRMED!');
        fs.writeFileSync(path.join(__dirname, 'output_test.pdf'), totalBuffer);
        console.log('Saved to scratch/output_test.pdf');
      } else {
        console.error('TEST FAILED: Invalid PDF header');
      }
    }
  };

  // Run handler
  await pdfHandler(req, res);
}

testPdf().catch(err => {
  console.error('Error testing PDF:', err);
});
