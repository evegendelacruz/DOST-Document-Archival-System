const path = require('path');
const fs = require('fs');

const base = path.join(__dirname, 'node_modules', '@tailwindcss', 'node', 'node_modules', 'lightningcss');
const nodeFile = path.join(base, 'lightningcss.win32-x64-msvc.node');

console.log('=== Diagnostic: lightningcss native binary ===');
console.log('Platform:', process.platform, 'Arch:', process.arch);
console.log('Node version:', process.version);
console.log('');

// Test 1: File existence
console.log('1. File path:', nodeFile);
console.log('   Exists:', fs.existsSync(nodeFile));
try {
  const stat = fs.statSync(nodeFile);
  console.log('   Size:', stat.size, 'bytes');
} catch (e) {
  console.log('   Stat error:', e.message);
}

// Test 2: Package resolve
console.log('');
console.log('2. Package resolve test:');
try {
  const resolved = require.resolve('lightningcss-win32-x64-msvc', { paths: [base] });
  console.log('   Resolved to:', resolved);
} catch (e) {
  console.log('   Resolve failed:', e.code, '-', e.message.substring(0, 150));
}

// Test 3: Direct require of .node file
console.log('');
console.log('3. Direct require test:');
try {
  const mod = require(nodeFile);
  console.log('   SUCCESS - module loaded');
} catch (e) {
  console.log('   FAILED:', e.code || 'no code');
  console.log('   Message:', e.message.substring(0, 300));
}

// Test 4: Package require
console.log('');
console.log('4. Package require test:');
try {
  const pkgPath = path.join(base, '..', 'lightningcss-win32-x64-msvc');
  const mod = require(pkgPath);
  console.log('   SUCCESS - package loaded');
} catch (e) {
  console.log('   FAILED:', e.code || 'no code');
  console.log('   Message:', e.message.substring(0, 300));
}

// Test 5: Relative require like index.js does it
console.log('');
console.log('5. Relative require (mimicking index.js):');
const indexDir = path.join(base, 'node');
try {
  const relPath = path.join(indexDir, '..', 'lightningcss.win32-x64-msvc.node');
  console.log('   Resolved path:', relPath);
  console.log('   File exists:', fs.existsSync(relPath));
  const mod = require(relPath);
  console.log('   SUCCESS');
} catch (e) {
  console.log('   FAILED:', e.code || 'no code');
  console.log('   Message:', e.message.substring(0, 300));
}
