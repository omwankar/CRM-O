import fs from 'fs';

const htmlPath = process.argv[2];
const outPath = process.argv[3];
const html = fs.readFileSync(htmlPath, 'utf8');
const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
if (!blocks.length) throw new Error('no style blocks');

let css = blocks.join('\n');
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
css = css.replace(/:root\{/g, '.ops{');
css = css.replace(
  /body\{background:var\(--bg\);color:var\(--fg\);font-family:var\(--f-ui\);font-size:14px;line-height:1\.45\}/,
  '.ops{background:var(--bg);color:var(--fg);font-family:var(--f-ui);font-size:14px;line-height:1.45}',
);
css = css.replace(/html\{color-scheme:light\}/, '.ops{color-scheme:light}');
css = css.replace(/body\{margin:0;font-size:14px\}/, '.ops{margin:0;font-size:14px}');
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

css = css.replace(
  /--f-ui:"Instrument Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;/,
  '--f-ui:var(--font-ops-sans),"Instrument Sans",ui-sans-serif,system-ui,sans-serif;',
);
css = css.replace(
  /--f-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;/,
  '--f-mono:var(--font-ops-mono),"IBM Plex Mono",ui-monospace,monospace;',
);

const header = `/* Exact styles from Operations-Pipeline.html — do not restyle. */
.ops-standalone {
  min-height: 100svh;
  background: #FFF8DC;
}
.ops {
  min-height: 100svh;
  background: var(--bg, #FFF8DC);
}
.ops button {
  background-image: none;
  cursor: pointer;
}
.ops input, .ops select, .ops textarea {
  color: inherit;
  font: inherit;
}

`;

fs.writeFileSync(outPath, header + css);
console.log('Wrote', outPath, fs.statSync(outPath).size);
