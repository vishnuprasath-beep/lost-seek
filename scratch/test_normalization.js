const fs = require('fs');

const path = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\0_core.js';
let coreSrc = fs.readFileSync(path, 'utf8');

global.window = {}; // mock window for node
eval(coreSrc); // Load CAMPUS_LOCATIONS and LOCATION_ALIASES and normalizeLocationName

function test(input, expected) {
  const result = normalizeLocationName(input);
  if (result !== expected) {
    console.error(`TEST FAILED: "${input}" => "${result}" (Expected: "${expected}")`);
  } else {
    console.log(`TEST PASSED: "${input}" => "${result}"`);
  }
}

console.log("--- RUNNING LOCATION TESTS ---");
test("MBA Block", "MBA Block");
test("A Block", "A Block");
test("B Block", "B Block");
test("Founder Hall", "Founder Hall");
test("Himalayan House", "Himalayan House");
test("Cafe", "Cafe");
test("Canteen", "Canteen");
test("House", "House");
test("Kitchen", "Kitchen");
test("Block", "Block");
test("Nilagiri House", "Nilgiri House");
test("Cucumber Cafe", "Cucumber Canteen");
test("Safron", "Saffron Canteen");
test("Cinamanon", "Cinnamon Canteen");
test("Tanjore", "Tanjore House");
test("mustard", "Mustard Cafe");
console.log("--- TESTS COMPLETE ---");
