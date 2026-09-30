#!/usr/bin/env node
/**
 * Waypoint Zero-Dependency Micro-Bundler (COA #2)
 *
 * Compiles modular source files in /src into the single-file,
 * air-gapped release artifact: waypoint.html.
 *
 * Usage:
 *   node build.js          # Compile once
 *   node build.js --watch  # Compile and watch for changes
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const SRC_DIR = path.join(ROOT_DIR, 'src');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const OUTPUT_FILE = path.join(BUILD_DIR, 'waypoint.html');

const CSS_FILES = [
  'tokens.css',
  'layout.css',
  'tree.css',
  'gantt.css',
  'kanban.css',
  'inspector.css',
  'modals.css',
  'print.css',
  'launcher.css'
];

const JS_FILES = [
  'core/schema.js',
  'core/sample-data.js',
  'core/hierarchy.js',
  'core/storage.js',
  'core/navigation.js',
  'components/rich-text.js',
  'views/launcher.js',
  'views/tree.js',
  'views/gantt.js',
  'views/kanban.js',
  'views/roster.js',
  'views/json-view.js',
  'components/inspector.js',
  'core/init.js'
];

function build() {
  const startTime = Date.now();
  console.log('⚡ Building Waypoint standalone artifact...');

  // 1. Read HTML template
  const templatePath = path.join(SRC_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template not found:', templatePath);
    process.exit(1);
  }
  let html = fs.readFileSync(templatePath, 'utf8');

  // 2. Concatenate CSS
  let cssBundle = '    /* ==========================================================================\n'
                + '       WAYPOINT V4 - MODERN GLASSMORPHIC AIR-GAPPED DASHBOARD (COMPILED)\n'
                + '       ========================================================================== */\n';
  for (const file of CSS_FILES) {
    const filePath = path.join(SRC_DIR, 'css', file);
    if (!fs.existsSync(filePath)) {
      console.error('❌ Missing CSS file:', filePath);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    cssBundle += `\n    /* --- ${file} --- */\n` + content + '\n';
  }

  // 3. Concatenate JS
  let jsBundle = '    /* ==========================================================================\n'
               + '       WAYPOINT CORE JAVASCRIPT ENGINE (COMPILED)\n'
               + '       ========================================================================== */\n';
  for (const file of JS_FILES) {
    const filePath = path.join(SRC_DIR, 'js', file);
    if (!fs.existsSync(filePath)) {
      console.error('❌ Missing JS file:', filePath);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    jsBundle += `\n    // --- ${file} ---\n` + content + '\n';
  }

  // 4. Inject bundles
  const cssPlaceholder = '/* <!-- INJECT:CSS --> */';
  const jsPlaceholder = '/* <!-- INJECT:JS --> */';

  if (!html.includes(cssPlaceholder) || !html.includes(jsPlaceholder)) {
    console.error('❌ Injection placeholders not found in src/index.html');
    process.exit(1);
  }

  html = html.replace(cssPlaceholder, cssBundle);
  html = html.replace(jsPlaceholder, jsBundle);

  // 5. Write output artifact
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

  const duration = Date.now() - startTime;
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  const totalLines = html.split('\n').length;

  console.log(`✅ Successfully compiled build/waypoint.html in ${duration}ms`);
  console.log(`   📦 Size: ${sizeKb} KB | 📄 Lines: ${totalLines}`);
}

// Check arguments
const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

build();

if (isWatch) {
  console.log('👀 Watching src/ directory for changes... (Press Ctrl+C to exit)');
  let debounceTimeout = null;

  fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`\n🔄 Change detected in ${filename}. Recompiling...`);
      try {
        build();
      } catch (err) {
        console.error('❌ Build error:', err.message);
      }
    }, 100);
  });
}
