import { readFile, writeFile } from 'fs/promises';
import fse from 'fs-extra';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = path.resolve('.');
const srcDir = root;
const distDir = path.join(root, 'Obf-GP');

async function copyToDist() {
  await fse.remove(distDir);
  await fse.ensureDir(distDir);
  // Copy top-level entries except excluded ones to avoid copying a dir into its subdirectory
  const exclude = new Set(['Obf-GP', 'node_modules', '.git', '.gitignore', 'scripts']);
  const entries = await fse.readdir(srcDir);
  for (const entry of entries) {
    if (exclude.has(entry)) continue;
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(distDir, entry);
    await fse.copy(srcPath, destPath);
  }
}

async function obfuscateJS() {
  const appJsPath = path.join(distDir, 'js', 'app.js');
  const appObfPath = path.join(distDir, 'js', 'app.obf.js');
  const exists = await fse.pathExists(appJsPath);
  if (!exists) {
    console.warn('No js/app.js found in dist. Skipping obfuscation.');
    return;
  }
  const code = await readFile(appJsPath, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    renameGlobals: false,
    simplify: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: true
  });
  await writeFile(appObfPath, result.getObfuscatedCode(), 'utf8');
  await fse.remove(appJsPath);
}

async function rewriteIndex() {
  const indexPath = path.join(distDir, 'index.html');
  const exists = await fse.pathExists(indexPath);
  if (!exists) return;
  let html = await readFile(indexPath, 'utf8');
  // Replace script reference to app.js with app.obf.js
  html = html.replace(/<script\s+src=["']js\/app\.js["']><\/script>/i, '<script src="js/app.obf.js"></script>');
  await writeFile(indexPath, html, 'utf8');
}

async function main() {
  await copyToDist();
  await obfuscateJS();
  await rewriteIndex();
  console.log('Build complete. See Obf-GP/ for obfuscated output.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
