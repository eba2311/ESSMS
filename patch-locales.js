const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\hp\\Desktop\\sms\\client\\src\\i18n\\locales';
const namespaces = ['subjects', 'classrooms', 'calendar', 'counseling', 'discipline', 'health', 'transport', 'inventory', 'alumni', 'guardians', 'communications', 'assignments', 'rosters', 'reports', 'myStudent', 'myTeaching'];

function getTopLevelKeys(obj) {
  return Object.keys(obj);
}

const results = {};

for (const ns of namespaces) {
  const enPath = path.join(base, 'en', ns + '.json');
  if (!fs.existsSync(enPath)) {
    results[ns] = { note: 'EN file does not exist' };
    continue;
  }

  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = getTopLevelKeys(en);

  for (const locale of ['om', 'am']) {
    const locPath = path.join(base, locale, ns + '.json');
    if (!fs.existsSync(locPath)) {
      results[`${ns}/${locale}`] = { note: 'File does not exist', missing: enKeys };
      continue;
    }

    const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    const locKeys = getTopLevelKeys(loc);
    const missing = enKeys.filter(k => !locKeys.includes(k));

    if (missing.length > 0) {
      // Add missing keys with English values as placeholder
      for (const key of missing) {
        loc[key] = en[key];
      }
      fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8');
      results[`${ns}/${locale}`] = { added: missing };
    } else {
      results[`${ns}/${locale}`] = { ok: true };
    }
  }
}

// Print summary
console.log('=== LOCALE SYNC SUMMARY ===\n');
let totalUpdated = 0;
let totalKeysAdded = 0;
for (const [key, val] of Object.entries(results)) {
  if (val.added) {
    console.log(`${key}: +${val.added.length} keys → [${val.added.join(', ')}]`);
    totalUpdated++;
    totalKeysAdded += val.added.length;
  } else if (val.note) {
    console.log(`${key}: ${val.note}`);
  } else if (val.ok) {
    // skip OK
  }
}
console.log(`\nFiles updated: ${totalUpdated}`);
console.log(`Total keys added: ${totalKeysAdded}`);
