import fs from 'fs';

const htmlPath = process.argv[2];
const outPath = process.argv[3];
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<style>([\s\S]*?)<\/style>/);
if (!m) throw new Error('no style block');

// Strip comments first so they cannot be mistaken for selectors
let css = m[1].replace(/\/\*[\s\S]*?\*\//g, '');

css = css.replace(/:root\{/g, '.ops{');
css = css.replace(
  /body\{background:var\(--bg\);color:var\(--fg\);font-family:var\(--f-ui\);font-size:14px;line-height:1\.45\}/,
  '.ops{background:var(--bg);color:var(--fg);font-family:var(--f-ui);font-size:14px;line-height:1.45}',
);
css = css.replace(/\*\{box-sizing:border-box\}/, '.ops,.ops *{box-sizing:border-box}');

css = css.replace(/(^|})\s*([^{}@]+?)\{/g, (match, brace, selectors) => {
  const trimmed = selectors.trim();
  if (!trimmed) return match;
  if (trimmed.startsWith('from') || trimmed.startsWith('to') || /^\d+%/.test(trimmed)) {
    return `${brace}\n${trimmed}{`;
  }
  const scoped = trimmed
    .split(',')
    .map((part) => {
      const p = part.trim();
      if (!p) return p;
      if (p.startsWith('.ops')) return p;
      if (p === 'html') return '.ops';
      return `.ops ${p}`;
    })
    .join(', ');
  return `${brace}\n${scoped}{`;
});

// Prefer next/font variables when present
css = css.replace(
  /--f-ui:"Instrument Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;/,
  '--f-ui:var(--font-ops-sans),"Instrument Sans",ui-sans-serif,system-ui,sans-serif;',
);
css = css.replace(
  /--f-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;/,
  '--f-mono:var(--font-ops-mono),"IBM Plex Mono",ui-monospace,monospace;',
);

const header = `/* Operations pipeline — exact styles from Operations-Pipeline.html, scoped to .ops */
.ops {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ops-standalone .ops { height: 100%; }
.ops .wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  width: 100%;
}

`;

fs.writeFileSync(outPath, header + css);
const check = fs.readFileSync(outPath, 'utf8');
const bad = (check.match(/\.ops\s+\.ops\s*\{/g) || []).length;
console.log('Wrote', outPath, check.length, 'bad nested', bad);
console.log(check.slice(0, 700));
console.log('---');
console.log(check.includes('.ops .strip{') || check.includes('.ops .strip {'), 'strip');
console.log(check.includes('.ops .board{') || check.includes('.ops .board {'), 'board');
console.log(check.includes('.ops .card{') || check.includes('.ops .card {'), 'card');
console.log(check.includes('.ops .btn.pri{') || check.includes('.ops .btn.pri {'), 'btn.pri');
