const aiService = require('../server/lostseek_ai_service');
const fs = require('fs');
const path = require('path');

async function runIntegrityTest() {
  const laptopBase64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:\\Users\\prakash c\\.gemini\\antigravity-ide\\brain\\eb50409c-e16c-4dee-b3cc-8cd2655b8648\\laptop_test_1790351225849.jpg').toString('base64');
  const keysBase64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:\\Users\\prakash c\\.gemini\\antigravity-ide\\brain\\eb50409c-e16c-4dee-b3cc-8cd2655b8648\\keys_test_1790351245093.jpg').toString('base64');

  const mockLostReports = [
    {
      id: 'rep-laptop',
      title: 'Silver laptop',
      description: 'Lost a silver laptop on a wooden desk',
      category: 'electronics'
    },
    {
      id: 'rep-keys',
      title: 'Metal keys',
      description: 'Lost my metal keys on a keychain',
      category: 'keys'
    }
  ];

  console.log("Testing with Laptop image...");
  const res1 = await aiService.analyzeFoundImage(laptopBase64, mockLostReports);
  console.log("Laptop Image -> Laptop Report Similarity:", res1.clipMatches['rep-laptop']?.similarity);
  console.log("Laptop Image -> Keys Report Similarity:", res1.clipMatches['rep-keys']?.similarity);

  console.log("\nTesting with Keys image...");
  const res2 = await aiService.analyzeFoundImage(keysBase64, mockLostReports);
  console.log("Keys Image -> Laptop Report Similarity:", res2.clipMatches['rep-laptop']?.similarity);
  console.log("Keys Image -> Keys Report Similarity:", res2.clipMatches['rep-keys']?.similarity);

  if (res1.clipMatches['rep-laptop'].similarity !== res2.clipMatches['rep-laptop'].similarity) {
    console.log("\n✅ AI Output is dynamically dependent on input image.");
  } else {
    console.log("\n❌ Output appears hardcoded.");
  }
}

runIntegrityTest().catch(console.error);
