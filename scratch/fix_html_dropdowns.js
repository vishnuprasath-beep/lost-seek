const fs = require('fs');

const optionsHtml = `
  <!-- OFFICIALLY VERIFIED -->
  <option value="Administrative Block">Administrative Block</option>
  <option value="Academic Block">Academic Block</option>
  <option value="A Block">A Block</option>
  <option value="B Block">B Block</option>
  <option value="C Block">C Block</option>
  <option value="D Block">D Block</option>
  <option value="E Block">E Block</option>
  <option value="F Block">F Block</option>
  <option value="Library Block">Library Block</option>
  <option value="Principal Quarters">Principal Quarters</option>
  <option value="Guest House">Guest House</option>
  <option value="Sports Club & Gymnasium">Sports Club & Gymnasium</option>
  <option value="Auditorium">Auditorium</option>
  <option value="Cafeteria">Cafeteria</option>
  <option value="Boys' Hostel">Boys' Hostel</option>
  <option value="Girls' Hostel">Girls' Hostel</option>
  <option value="Power House">Power House</option>
  <option value="Stationery Store">Stationery Store</option>
  <option value="Parking">Parking</option>
  <!-- FRIEND/STUDENT CONFIRMED -->
  <option value="Himalayan House">Himalayan House</option>
  <option value="Tanjore House">Tanjore House</option>
  <option value="Madurai House">Madurai House</option>
  <option value="Marina House">Marina House</option>
  <option value="Nilgiri House">Nilgiri House</option>
  <option value="Ellora House">Ellora House</option>
  <option value="Vivekananda Hostel">Vivekananda Hostel</option>
  <option value="Raman Block">Raman Block</option>
  <option value="Mercury Block">Mercury Block</option>
  <option value="Jupiter Block">Jupiter Block</option>
  <option value="MBA Block">MBA Block</option>
  <option value="Mechanical Block">Mechanical Block</option>
  <option value="IT Park">IT Park</option>
  <option value="Techno Park">Techno Park</option>
  <option value="Founder Hall">Founder Hall</option>
  <option value="West Mart">West Mart</option>
  <option value="Cucumber Canteen">Cucumber Canteen</option>
  <option value="Mustard Cafe">Mustard Cafe</option>
  <option value="Saffron Canteen">Saffron Canteen</option>
  <option value="Cinnamon Canteen">Cinnamon Canteen</option>
  <option value="Bite Zone">Bite Zone</option>
  <!-- NEEDS CONFIRMATION -->
  <option value="Round Building">Round Building</option>
  <option value="Women's Arts">Women's Arts</option>
`;

const htmlFiles = [
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\index.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\story.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\200.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\index.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\story.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\200.html'
];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Find <select> tags containing <option value="Hostel Block A">
  const regex = /<select([^>]*)>([\s\S]*?)<\/select>/g;
  content = content.replace(regex, (match, attrs, inner) => {
    if (inner.includes('Hostel Block A')) {
      return `<select${attrs}>
                      <option value="" disabled selected>Select Location</option>
                      ${optionsHtml}
                    </select>`;
    }
    return match;
  });
  fs.writeFileSync(file, content);
});

console.log("Fixed HTML dropdowns.");
