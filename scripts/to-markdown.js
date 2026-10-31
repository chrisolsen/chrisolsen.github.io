// Renders resume.json (JSON Resume format) as Markdown on stdout.
// Usage: node scripts/to-markdown.js resume.json > README.md

import { readFileSync } from 'node:fs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date) {
  if (!date) return 'Present';
  const [year, month] = date.split('-');
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

function dateRange(start, end) {
  const from = formatDate(start);
  const to = formatDate(end);
  return from === to ? from : `${from} – ${to}`;
}

function link(text, url) {
  return url ? `[${text}](${url})` : text;
}

const resume = JSON.parse(readFileSync(process.argv[2] ?? 'resume.json', 'utf8'));
const { basics = {}, work = [], projects = [], education = [], skills = [] } = resume;
const out = [];

out.push(`# ${basics.name}`, '');
if (basics.label) out.push(`**${basics.label}**`, '');

const contact = [
  ...(basics.profiles ?? []).map((p) => link(p.url.replace(/^https?:\/\//, ''), p.url)),
  basics.email && link(basics.email, `mailto:${basics.email}`),
  basics.phone && link(basics.phone, `tel:${basics.phone.replace(/[^+\d]/g, '')}`),
].filter(Boolean);
if (contact.length) out.push(contact.join(' | '), '');

if (basics.summary) out.push('## Summary', '', basics.summary, '');

if (skills.length) {
  out.push('## Skills', '', skills.map((s) => s.name).join(' · '), '');
}

if (work.length) {
  out.push('## Work History', '');
  for (const job of work) {
    out.push(`### ${job.position} — *${dateRange(job.startDate, job.endDate)}*`, '');
    out.push(`**${link(job.name, job.url)}**${job.location ? `, ${job.location}` : ''}`, '');
    if (job.keywords?.length) out.push(`*${job.keywords.join(', ')}*`, '');
    if (job.summary) out.push(job.summary, '');
    if (job.highlights?.length) out.push(...job.highlights.map((h) => `- ${h}`), '');
  }
}

if (projects.length) {
  out.push('## Personal Projects', '');
  for (const p of projects) {
    const tools = p.keywords?.length ? ` *${p.keywords.join(', ')}*` : '';
    out.push(`- **${link(p.name, p.url)}** — ${p.description ?? ''}${tools}`);
  }
  out.push('');
}

if (education.length) {
  out.push('## Education', '');
  for (const e of education) {
    const study = [e.studyType, e.area].filter(Boolean).join(' ');
    out.push(`- ${e.institution}${study ? `: ${study}` : ''}`);
  }
  out.push('');
}

process.stdout.write(out.join('\n'));
