/**
 * Postinstall script: ensures Windows native binaries are in place.
 *
 * - On WSL (Linux + Microsoft kernel): downloads binaries via `npm pack`
 *   because WSL npm installs Linux binaries, not Windows ones.
 * - On Windows: copies from already-installed packages in node_modules.
 * - On other platforms (macOS / native Linux): no-op.
 *
 * The binaries must land at the PACKAGE ROOT (e.g. lightningcss/),
 * NOT inside the node/ subfolder, because index.js uses require('../<file>.node').
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const platform = os.platform();

// Determine if we're on WSL
function isWSL() {
  try {
    return fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');
  } catch {
    return false;
  }
}

const onWindows = platform === 'win32';
const onWSL = platform === 'linux' && isWSL();

// Nothing to do on macOS or native Linux
if (!onWindows && !onWSL) process.exit(0);

const projectRoot = path.resolve(__dirname, '..');

// Binaries that must exist for the Windows Node.js dev server to start.
// `dest` is the PACKAGE ROOT — index.js does require('../<file>.node')
// so the file must sit directly inside that directory, not in node/.
const binaries = [
  {
    pkg: 'lightningcss-win32-x64-msvc',
    version: '1.30.2',
    file: 'lightningcss.win32-x64-msvc.node',
    // Nested copy used by @tailwindcss/node
    dest: path.join(projectRoot, 'node_modules', '@tailwindcss', 'node', 'node_modules', 'lightningcss'),
    // Where npm installs the package (used as source on Windows)
    src: path.join(projectRoot, 'node_modules', '@tailwindcss', 'node', 'node_modules', 'lightningcss-win32-x64-msvc'),
  },
  {
    pkg: 'lightningcss-win32-x64-msvc',
    version: '1.31.1',
    file: 'lightningcss.win32-x64-msvc.node',
    dest: path.join(projectRoot, 'node_modules', 'lightningcss'),
    src: path.join(projectRoot, 'node_modules', 'lightningcss', 'node_modules', 'lightningcss-win32-x64-msvc')
      || path.join(projectRoot, 'node_modules', 'lightningcss-win32-x64-msvc'),
  },
];

// ── WSL path: download via npm pack ──────────────────────────────────────────
if (onWSL) {
  const tmpDir = path.join(os.tmpdir(), 'wsl-binary-fix');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const bin of binaries) {
    const destFile = path.join(bin.dest, bin.file);
    if (fs.existsSync(destFile)) {
      console.log(`[fix-binaries] ${bin.file} v${bin.version} already present, skipping.`);
      continue;
    }
    if (!fs.existsSync(bin.dest)) {
      console.log(`[fix-binaries] ${bin.dest} not found, skipping.`);
      continue;
    }
    console.log(`[fix-binaries] Downloading ${bin.pkg}@${bin.version}...`);
    try {
      execSync(`npm pack ${bin.pkg}@${bin.version}`, { cwd: tmpDir, stdio: 'pipe' });
      const tgzName = bin.pkg.startsWith('@')
        ? bin.pkg.slice(1).replace('/', '-') + `-${bin.version}.tgz`
        : `${bin.pkg}-${bin.version}.tgz`;
      execSync(`tar xzf "${path.join(tmpDir, tgzName)}"`, { cwd: tmpDir, stdio: 'pipe' });
      const srcFile = path.join(tmpDir, 'package', bin.file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`[fix-binaries] Placed ${bin.file} in ${bin.dest}`);
      }
      fs.rmSync(path.join(tmpDir, 'package'), { recursive: true });
      fs.unlinkSync(path.join(tmpDir, tgzName));
    } catch (err) {
      console.warn(`[fix-binaries] Failed: ${err.message}`);
    }
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Windows path: copy from already-installed npm package ────────────────────
if (onWindows) {
  for (const bin of binaries) {
    const destFile = path.join(bin.dest, bin.file);
    if (fs.existsSync(destFile)) {
      console.log(`[fix-binaries] ${bin.file} v${bin.version} already present, skipping.`);
      continue;
    }
    if (!fs.existsSync(bin.dest)) {
      console.log(`[fix-binaries] ${bin.dest} not found, skipping.`);
      continue;
    }

    // Try multiple source locations
    const candidates = [
      bin.src ? path.join(bin.src, bin.file) : null,
      path.join(projectRoot, 'node_modules', bin.pkg, bin.file),
      path.join(projectRoot, 'node_modules', '@tailwindcss', 'node', 'node_modules', bin.pkg, bin.file),
      path.join(projectRoot, 'node_modules', 'lightningcss', 'node_modules', bin.pkg, bin.file),
    ].filter(Boolean);

    const srcFile = candidates.find(f => f && fs.existsSync(f));
    if (srcFile) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`[fix-binaries] Copied ${bin.file} to ${bin.dest}`);
    } else {
      console.warn(`[fix-binaries] Could not find source for ${bin.file} v${bin.version}`);
    }
  }
}

console.log('[fix-binaries] Done.');
