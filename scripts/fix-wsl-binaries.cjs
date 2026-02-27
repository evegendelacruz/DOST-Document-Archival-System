/**
 * Fixes missing Windows native binaries when npm is run from WSL.
 * WSL npm installs Linux binaries, but Windows Node.js needs Windows .node files.
 * Versions are read dynamically from installed packages — no hardcoding needed.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Only run on WSL
if (os.platform() !== 'linux') process.exit(0);
try {
  const release = fs.readFileSync('/proc/version', 'utf8');
  if (!release.toLowerCase().includes('microsoft')) process.exit(0);
} catch { process.exit(0); }

const projectRoot = path.resolve(__dirname, '..');
const nm = path.join(projectRoot, 'node_modules');

/** Read version from an installed package's package.json */
function installedVersion(pkgPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8')).version;
  } catch { return null; }
}

// Build the list of binaries to ensure exist — versions pulled from installed packages
const binaries = [];

// 1. lightningcss (root-level)
const lcssDir = path.join(nm, 'lightningcss');
const lcssVer = installedVersion(lcssDir);
if (lcssVer) {
  binaries.push({
    pkg: 'lightningcss-win32-x64-msvc',
    version: lcssVer,
    file: 'lightningcss.win32-x64-msvc.node',
    dest: lcssDir,
  });
}

// 2. lightningcss nested inside @tailwindcss/node (if present)
const lcssNested = path.join(nm, '@tailwindcss', 'node', 'node_modules', 'lightningcss');
const lcssNestedVer = installedVersion(lcssNested);
if (lcssNestedVer) {
  binaries.push({
    pkg: 'lightningcss-win32-x64-msvc',
    version: lcssNestedVer,
    file: 'lightningcss.win32-x64-msvc.node',
    dest: lcssNested,
  });
}

// 3. @tailwindcss/oxide
const oxideDir = path.join(nm, '@tailwindcss', 'oxide');
const oxideVer = installedVersion(oxideDir);
if (oxideVer) {
  binaries.push({
    pkg: '@tailwindcss/oxide-win32-x64-msvc',
    version: oxideVer,
    file: 'tailwindcss-oxide.win32-x64-msvc.node',
    dest: oxideDir,
  });
}

if (binaries.length === 0) {
  console.log('[fix-wsl-binaries] Nothing to fix.');
  process.exit(0);
}

const tmpDir = path.join(os.tmpdir(), 'wsl-binary-fix');
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

for (const bin of binaries) {
  const destFile = path.join(bin.dest, bin.file);

  if (fs.existsSync(destFile)) {
    console.log(`[fix-wsl-binaries] ${bin.file} (v${bin.version}) already exists, skipping.`);
    continue;
  }

  if (!fs.existsSync(bin.dest)) {
    console.log(`[fix-wsl-binaries] ${bin.dest} not found, skipping.`);
    continue;
  }

  console.log(`[fix-wsl-binaries] Downloading ${bin.pkg}@${bin.version}...`);
  try {
    execSync(`npm pack ${bin.pkg}@${bin.version}`, { cwd: tmpDir, stdio: 'pipe' });

    // npm pack produces e.g. tailwindcss-oxide-win32-x64-msvc-4.2.1.tgz (strips @ and /)
    const tgzName = bin.pkg.replace(/^@/, '').replace('/', '-') + '-' + bin.version + '.tgz';
    const tgz = path.join(tmpDir, tgzName);

    execSync(`tar xzf "${tgz}"`, { cwd: tmpDir, stdio: 'pipe' });
    const srcFile = path.join(tmpDir, 'package', bin.file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`[fix-wsl-binaries] Placed ${bin.file} → ${bin.dest}`);
    } else {
      console.warn(`[fix-wsl-binaries] ${bin.file} not found inside package tarball.`);
    }
    // Clean up for next iteration
    const pkgDir = path.join(tmpDir, 'package');
    if (fs.existsSync(pkgDir)) fs.rmSync(pkgDir, { recursive: true });
    if (fs.existsSync(tgz)) fs.unlinkSync(tgz);
  } catch (err) {
    console.warn(`[fix-wsl-binaries] Failed for ${bin.pkg}@${bin.version}:`, err.message);
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('[fix-wsl-binaries] Done.');
