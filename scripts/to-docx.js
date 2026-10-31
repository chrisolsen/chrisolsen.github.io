// Renders resume.json (JSON Resume format) as a Word document.
// Usage: node scripts/to-docx.js resume.json "Chris Olsen.docx"

import { readFileSync, writeFileSync } from 'node:fs';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import { dateRange } from './dates.js';

// US Letter with 0.75" margins, in twips (1/1440").
const PAGE_WIDTH = 12240;
const MARGIN = 1080;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

const FONT = 'Georgia';
const MUTED = '666666';

const [input = 'resume.json', output = 'resume.docx'] = process.argv.slice(2);
const resume = JSON.parse(readFileSync(input, 'utf8'));
const { basics = {}, work = [], projects = [], education = [], skills = [] } = resume;

function link(text, url) {
  if (!url) return new TextRun({ text, color: MUTED });
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text, color: MUTED })],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB', space: 2 } },
    children: [new TextRun({ text, bold: true, size: 26 })],
  });
}

function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun(text)] });
}

function muted(text, opts = {}) {
  return new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text, color: MUTED, ...opts })] });
}

const children = [];

// Masthead
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: basics.name, bold: true, size: 48 })],
  })
);
if (basics.label) {
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(basics.label)] }));
}

const location = [basics.location?.city, basics.location?.region].filter(Boolean).join(', ');
const contact = [
  location && new TextRun({ text: location, color: MUTED }),
  basics.email && link(basics.email, `mailto:${basics.email}`),
  basics.phone && link(basics.phone, `tel:${basics.phone.replace(/[^+\d]/g, '')}`),
  basics.url && link(basics.url.replace(/^https?:\/\//, ''), basics.url),
  ...(basics.profiles ?? []).map((p) => link(p.url.replace(/^https?:\/\//, ''), p.url)),
].filter(Boolean);
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: contact.flatMap((run, i) => (i ? [new TextRun({ text: '   ·   ', color: MUTED }), run] : [run])),
  })
);

if (basics.summary) children.push(new Paragraph({ children: [new TextRun(basics.summary)] }));

if (skills.length) {
  children.push(sectionHeading('Skills'), new Paragraph({ children: [new TextRun(skills.map((s) => s.name).join(' · '))] }));
}

if (work.length) {
  children.push(sectionHeading('Experience'));
  for (const job of work) {
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 160 },
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
        children: [
          new TextRun({ text: job.position, bold: true }),
          new TextRun({ text: `\t${dateRange(job.startDate, job.endDate)}`, color: MUTED }),
        ],
      }),
      new Paragraph({
        keepNext: true,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: job.name, italics: true }),
          ...(job.location ? [new TextRun({ text: ` · ${job.location}`, color: MUTED })] : []),
        ],
      })
    );
    if (job.summary) children.push(new Paragraph({ children: [new TextRun(job.summary)] }));
    children.push(...(job.highlights ?? []).map(bullet));
    if (job.keywords?.length) children.push(muted(job.keywords.join(', ')));
  }
}

if (projects.length) {
  children.push(sectionHeading('Personal Projects'));
  for (const p of projects) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          p.url
            ? new ExternalHyperlink({ link: p.url, children: [new TextRun({ text: p.name, bold: true })] })
            : new TextRun({ text: p.name, bold: true }),
          new TextRun(` — ${p.description ?? ''}`),
          ...(p.keywords?.length ? [new TextRun({ text: ` ${p.keywords.join(', ')}`, italics: true, color: MUTED })] : []),
        ],
      })
    );
  }
}

if (education.length) {
  children.push(sectionHeading('Education'));
  for (const e of education) {
    const study = [e.studyType, e.area].filter(Boolean).join(' ');
    children.push(bullet(`${e.institution}${study ? `: ${study}` : ''}`));
  }
}

const doc = new Document({
  creator: basics.name,
  title: `${basics.name} — Résumé`,
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  sections: [
    {
      properties: { page: { size: { width: PAGE_WIDTH, height: 15840 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      children,
    },
  ],
});

writeFileSync(output, await Packer.toBuffer(doc));
