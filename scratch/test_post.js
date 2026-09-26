fetch('https://lost-seek.vercel.app/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'lost', itemName: 'test', category: 'other', location: 'test' })
}).then(res => res.json()).then(console.log).catch(console.error);
