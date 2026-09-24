import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\prakash c\\.gemini\\antigravity-ide\\brain\\ca81a377-dbd6-43e3-acfa-18cb5a64824d\\.system_generated\\logs\\transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (line.includes('"step_index":242') || line.includes('"step_index": 242')) {
    const obj = JSON.parse(line);
    console.log(obj.content);
  }
  if (line.includes('"step_index":53') || line.includes('"step_index": 53')) {
    const obj = JSON.parse(line);
    console.log(obj.content);
  }
});
