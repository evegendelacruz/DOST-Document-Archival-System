/**
 * Postinstall script to fix native Windows binaries when running npm from WSL.
 * WSL npm installs Linux binaries, but Windows Node.js needs Windows .node files.
 * This script downloads and places the correct Windows binaries.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Only run on WSL (Linux with Windows paths available)
if (os.platform() !== 'linux') {
  process.exit(0);
}

// Check if we're actually on WSL
try {
  const release = fs.readFileSync('/proc/version', 'utf8');
  if (!release.toLowerCase().includes('microsoft')) {
    process.exit(0);
  }
} catch {
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, '..');
const tmpDir = path.join(os.tmpdir(), 'wsl-binary-fix');

const binaries = [
  {
    pkg: 'lightningcss-win32-x64-msvc',
    version: '1.30.2',
    file: 'lightningcss.win32-x64-msvc.node',
    dest: path.join(projectRoot, 'node_modules', '@tailwindcss', 'node', 'node_modules', 'lightningcss'),
  },
  {
    pkg: 'lightningcss-win32-x64-msvc',
    version: '1.31.1',
    file: 'lightningcss.win32-x64-msvc.node',
    dest: path.join(projectRoot, 'node_modules', 'lightningcss'),
  },
  {
    pkg: '@tailwindcss/oxide-win32-x64-msvc',
    version: '4.1.18',
    file: 'tailwindcss-oxide.win32-x64-msvc.node',
    dest: path.join(projectRoot, 'node_modules', '@tailwindcss', 'oxide'),
  },
];

// Clean up tmp dir
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true });
}
fs.mkdirSync(tmpDir, { recursive: true });

for (const bin of binaries) {
  const destFile = path.join(bin.dest, bin.file);

  // Skip if binary already exists
  if (fs.existsSync(destFile)) {
    console.log(`[fix-wsl-binaries] ${bin.file} (v${bin.version}) already exists, skipping.`);
    continue;
  }

  // Skip if dest directory doesn't exist (package not installed)
  if (!fs.existsSync(bin.dest)) {
    console.log(`[fix-wsl-binaries] ${bin.dest} not found, skipping.`);
    continue;
  }

  console.log(`[fix-wsl-binaries] Downloading ${bin.pkg}@${bin.version}...`);
  try {
    execSync(`npm pack ${bin.pkg}@${bin.version}`, { cwd: tmpDir, stdio: 'pipe' });
    // Handle scoped packages: @scope/name -> scope-name
    const tgzName = bin.pkg.startsWith('@')
      ? bin.pkg.slice(1).replace('/', '-') + `-${bin.version}.tgz`
      : `${bin.pkg}-${bin.version}.tgz`;
    const tgz = path.join(tmpDir, tgzName);
    execSync(`tar xzf "${tgz}"`, { cwd: tmpDir, stdio: 'pipe' });
    const srcFile = path.join(tmpDir, 'package', bin.file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`[fix-wsl-binaries] Placed ${bin.file} in ${bin.dest}`);
    }
    // Clean up extracted package for next iteration
    fs.rmSync(path.join(tmpDir, 'package'), { recursive: true });
    fs.unlinkSync(tgz);
  } catch (err) {
    console.warn(`[fix-wsl-binaries] Failed to install ${bin.pkg}@${bin.version}:`, err.message);
  }
}

// Clean up
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('[fix-wsl-binaries] Done.');
