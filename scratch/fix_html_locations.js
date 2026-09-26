const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';
const htmlFiles = [
  'index.html',
  'story.html',
  '200.html',
  'public/index.html',
  'public/story.html',
  'public/200.html'
];

const newLocations = `                      <option value="" disabled selected>Select location on campus</option>
                      <option value="Himalayan House">Himalayan House</option>
                      <option value="Tanjore House">Tanjore House</option>
                      <option value="Marina House">Marina House</option>
                      <option value="Nilgiri House">Nilgiri House</option>
                      <option value="Madura House">Madura House</option>
                      <option value="Saffron Canteen">Saffron Canteen</option>
                      <option value="West Mart">West Mart</option>
                      <option value="Cinnamon Cafe">Cinnamon Cafe</option>
                      <option value="Cucumber Canteen">Cucumber Canteen</option>
                      <option value="Mustard Cafe">Mustard Cafe</option>
                      <option value="Post Office">Post Office</option>
                      <option value="Campus Security Office (Main Gate)">Campus Security Office (Main Gate)</option>
                      <option value="Library (A Block)">Library (A Block)</option>
                      <option value="A Block">A Block</option>
                      <option value="B Block">B Block</option>
                      <option value="C Block">C Block</option>
                      <option value="D Block">D Block</option>
                      <option value="E Block">E Block</option>
                      <option value="F Block">F Block</option>
                      <option value="R Block">R Block</option>`;

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find select dropdowns for location and replace their contents
    // They usually look like <select ... id="lost-location" ...> ... </select>
    // We will use a regex to match from <select> up to </select> where it contains "Library" or "Main Building"
    const regex = /(<select[^>]*id="[^"]*location[^"]*"[^>]*>)[\s\S]*?(<\/select>)/gi;
    
    // Wait, let's just do a simpler replace. Let's find all the <option> block for locations.
    // The previous block starts with `<option value="" disabled selected>Select location on campus</option>`
    // and ends before `</select>`.
    
    content = content.replace(/(<option value="" disabled selected>Select location on campus<\/option>)[\s\S]*?(?=<\/select>)/g, newLocations + '\n                    ');
    
    // Also, some have "Any Location" for filters
    const filterNewLocations = `                      <option value="">Any Location</option>
                      <option value="Himalayan House">Himalayan House</option>
                      <option value="Tanjore House">Tanjore House</option>
                      <option value="Marina House">Marina House</option>
                      <option value="Nilgiri House">Nilgiri House</option>
                      <option value="Madura House">Madura House</option>
                      <option value="Saffron Canteen">Saffron Canteen</option>
                      <option value="West Mart">West Mart</option>
                      <option value="Cinnamon Cafe">Cinnamon Cafe</option>
                      <option value="Cucumber Canteen">Cucumber Canteen</option>
                      <option value="Mustard Cafe">Mustard Cafe</option>
                      <option value="Post Office">Post Office</option>
                      <option value="Campus Security Office (Main Gate)">Campus Security Office (Main Gate)</option>
                      <option value="Library (A Block)">Library (A Block)</option>
                      <option value="A Block">A Block</option>
                      <option value="B Block">B Block</option>
                      <option value="C Block">C Block</option>
                      <option value="D Block">D Block</option>
                      <option value="E Block">E Block</option>
                      <option value="F Block">F Block</option>
                      <option value="R Block">R Block</option>`;
                      
    content = content.replace(/(<option value="">Any Location<\/option>)[\s\S]*?(?=<\/select>)/g, filterNewLocations + '\n                    ');

    // Remove Karma 0 instances if any exist that I missed
    // Some div with user-karma etc
    content = content.replace(/<div class="user-karma">[\s\S]*?<\/div>/g, '');
    content = content.replace(/<span class="user-karma-badge">.*?<\/span>/g, '');
    content = content.replace(/<span class="nav-karma">.*?<\/span>/g, '');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated locations in', file);
  }
});
