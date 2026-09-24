const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

content = content.replace('id="setting-notif-match"', 'id="setting-notif-match" aria-label="Toggle AI Match Alerts"');
content = content.replace('id="setting-notif-claim"', 'id="setting-notif-claim" aria-label="Toggle Claim Status Updates"');
content = content.replace('id="setting-notif-digest"', 'id="setting-notif-digest" aria-label="Toggle Weekly Campus Digest"');
content = content.replace('id="complaint-location-other"', 'id="complaint-location-other" aria-label="Specify custom incident location"');

// Urgent reasons radio buttons
content = content.replace(/<input type="radio" name="item-help-reason" value="([^"]+)"/g, (m, val) => {
  return `<input type="radio" name="item-help-reason" value="${val}" aria-label="${val}"`;
});

// Other radio groups in modals
content = content.replace(/<input type="radio" ([^>]+)>/g, (m, attrs) => {
  if (!attrs.includes('aria-label=')) {
    const valMatch = attrs.match(/value=["']([^"']+)["']/);
    if (valMatch) {
      return `<input type="radio" ${attrs} aria-label="${valMatch[1]}">`;
    }
  }
  return m;
});

// Sighting custody checkboxes/radios
content = content.replace(/<input type="checkbox" ([^>]+)>/g, (m, attrs) => {
  if (!attrs.includes('aria-label=') && !attrs.includes('id=')) {
    const valMatch = attrs.match(/value=["']([^"']+)["']/);
    if (valMatch) {
      return `<input type="checkbox" ${attrs} aria-label="${valMatch[1]}">`;
    }
  }
  return m;
});

fs.writeFileSync(path.join(__dirname, '../index.html'), content, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/index.html'), content, 'utf8');
fs.writeFileSync(path.join(__dirname, '../200.html'), content, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/200.html'), content, 'utf8');

console.log('✓ Successfully applied remaining aria-labels and updated all mirrors!');
