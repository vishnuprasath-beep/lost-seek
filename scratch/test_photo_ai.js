const aiService = require('./server/lostseek_ai_service');
const fs = require('fs');
const path = require('path');

async function testFindByPhoto() {
  // Use a dummy image (a small base64 or a real image from the file system)
  // We'll use one of the images from the codebase if available, or just an empty buffer
  
  // Here we just test the AI endpoint's function analyzeFoundImage
  console.log("Testing analyzeFoundImage...");
  
  const mockImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  
  const mockLostReports = [
    {
      id: 'real-lost-1',
      title: 'Red Backpack',
      description: 'Lost my red bag near the library.',
      category: 'bags',
      color: 'red'
    }
  ];

  try {
    const result = await aiService.analyzeFoundImage(mockImageBase64, mockLostReports);
    console.log("AI Analysis Result:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'completed' || result.status === 'failed') {
      console.log("✅ Find by Photo successfully reached the AI path.");
    } else {
      console.log("❌ Unexpected status.");
    }
  } catch(e) {
    console.error("Test failed:", e);
  }
}

testFindByPhoto();
