const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'client', 'src', 'i18n', 'locales');
const namespaces = [
  'assignments', 'rosters', 'reports', 'student', 'teacher',
  'dashboard', 'attendance', 'finance', 'sections', 'settings',
  'users', 'common', 'auth', 'communications', 'library'
];

function getLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getLeafKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== 'object' || Array.isArray(cur[parts[i]])) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// Recursively sort object: keys that existed in originalObj keep their relative order,
// new keys are appended at the end of each object level.
function sortRecursive(mergedObj, originalObj) {
  if (typeof mergedObj !== 'object' || mergedObj === null || Array.isArray(mergedObj)) return mergedObj;
  
  const result = {};
  const origKeys = Object.keys(originalObj);
  const allKeys = Object.keys(mergedObj);
  const origKeySet = new Set(origKeys);
  
  // First: original keys in their original order
  for (const k of origKeys) {
    if (k in mergedObj) {
      if (typeof mergedObj[k] === 'object' && mergedObj[k] !== null && !Array.isArray(mergedObj[k])
          && typeof originalObj[k] === 'object' && originalObj[k] !== null && !Array.isArray(originalObj[k])) {
        result[k] = sortRecursive(mergedObj[k], originalObj[k]);
      } else {
        result[k] = mergedObj[k];
      }
    }
  }
  
  // Second: new keys not in original, in their natural order
  for (const k of allKeys) {
    if (!origKeySet.has(k)) {
      if (typeof mergedObj[k] === 'object' && mergedObj[k] !== null && !Array.isArray(mergedObj[k])) {
        result[k] = sortRecursive(mergedObj[k], {});
      } else {
        result[k] = mergedObj[k];
      }
    }
  }
  
  return result;
}

const summary = [];

for (const ns of namespaces) {
  const enFile = path.join(base, 'en', `${ns}.json`);
  
  if (!fs.existsSync(enFile)) {
    summary.push({ ns, skip: 'EN file not found' });
    continue;
  }

  const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  
  for (const locale of ['om', 'am']) {
    const localeFile = path.join(base, locale, `${ns}.json`);
    if (!fs.existsSync(localeFile)) {
      summary.push({ ns, locale, skip: 'file not found' });
      continue;
    }
    
    const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    // Deep clone the original BEFORE modification for key order reference
    const originalLocale = JSON.parse(JSON.stringify(localeData));
    const enLeafKeys = getLeafKeys(en);
    const localeLeafKeys = getLeafKeys(localeData);
    
    const missing = enLeafKeys.filter(k => !localeLeafKeys.includes(k));
    
    if (missing.length > 0) {
      // Add all missing leaf keys with EN values
      for (const keyPath of missing) {
        const value = getNestedValue(en, keyPath);
        setNestedValue(localeData, keyPath, value);
      }
      
      // Sort: original keys keep their order, new keys appended at each level
      const sorted = sortRecursive(localeData, originalLocale);
      
      fs.writeFileSync(localeFile, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
      summary.push({ ns, locale, added: missing.length, keys: missing });
    } else {
      summary.push({ ns, locale, added: 0 });
    }
  }
}

console.log('\n=== I18N SYNC SUMMARY ===\n');
let totalOm = 0, totalAm = 0;
for (const s of summary) {
  if (s.skip) {
    console.log(`SKIP: ${s.ns} - ${s.skip}`);
  } else if (s.added > 0) {
    console.log(`${s.locale.toUpperCase()} ${s.ns}.json: +${s.added} keys`);
    for (const k of s.keys) {
      console.log(`  + ${k}`);
    }
    if (s.locale === 'om') totalOm += s.added;
    else totalAm += s.added;
  } else {
    console.log(`${s.locale.toUpperCase()} ${s.ns}.json: OK`);
  }
}
console.log(`\nTOTAL: om +${totalOm} keys, am +${totalAm} keys`);
