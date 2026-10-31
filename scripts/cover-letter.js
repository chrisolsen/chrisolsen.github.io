// Renders a Markdown cover letter as a PDF, with a letterhead taken from
// resume.json and typeset to match the Pro résumé theme.
// Usage: node scripts/cover-letter.js resume.json cover-letters/general.md cover-letters/general.pdf

import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { FONT_FACES } from '../node_modules/jsonresume-theme-pro/src/fonts.generated.js';

const [resumeFile, bodyFile, output] = process.argv.slice(2);
const { basics = {} } = JSON.parse(readFileSync(resumeFile, 'utf8'));
const body = marked.parse(readFileSync(bodyFile, 'utf8'));

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const bare = (url) => url.replace(/^https?:\/\//, '');

const fontFaces = FONT_FACES.map(
  (f) => `@font-face{font-family:'Source Serif 4';font-weight:${f.weight};font-style:${f.style};src:url(data:font/woff2;base64,${f.data}) format('woff2');}`
).join('');

const location = [basics.location?.city, basics.location?.region].filter(Boolean).join(', ');
const contact = [
  location && escape(location),
  basics.email && `<a href="mailto:${escape(basics.email)}">${escape(basics.email)}</a>`,
  basics.phone && `<a href="tel:${basics.phone.replace(/[^+\d]/g, '')}">${escape(basics.phone)}</a>`,
  basics.url && `<a href="${escape(basics.url)}">${escape(bare(basics.url))}</a>`,
  ...(basics.profiles ?? []).map((p) => `<a href="${escape(p.url)}">${escape(bare(p.url))}</a>`),
].filter(Boolean);

const date = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
${fontFaces}
@page { size: Letter; margin: 0.9in 1in; }
body { font-family: 'Source Serif 4', Georgia, serif; font-size: 11pt; line-height: 1.5; color: #222; margin: 0; }
header { text-align: center; padding-bottom: 14pt; margin-bottom: 22pt; border-bottom: 0.5pt solid #bbb; }
h1 { font-size: 24pt; font-weight: 600; margin: 0 0 4pt; }
.contact { color: #666; font-size: 9.5pt; }
.contact span { white-space: nowrap; }
.contact span + span::before { content: '·'; margin: 0 0.6em; }
a { color: inherit; text-decoration: none; }
p { margin: 0 0 10pt; }
.date { margin-bottom: 18pt; }
p:last-child { margin-top: 18pt; }
</style>
</head>
<body>
<header>
  <h1>${escape(basics.name)}</h1>
  <div class="contact">${contact.map((c) => `<span>${c}</span>`).join('')}</div>
</header>
<p class="date">${date}</p>
${body}
</body>
</html>`;

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: output, preferCSSPageSize: true, printBackground: true });
} finally {
  await browser.close();
}
