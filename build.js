#!/usr/bin/env node
/**
 * build.js — reads all .md files from Latest/, converts to HTML,
 * and writes JSON documents to content/.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'Latest');
const OUT = path.join(__dirname, 'content');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

// ── Markdown → HTML converter (no deps) ──────────────────────────────────────

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inBlockquote = false;
  let inTable = false;
  let tableHeaders = [];
  let inCodeBlock = false;
  let inList = false;
  let listItems = [];
  let buf = [];

  function flushBuf() {
    if (!buf.length) return;
    const raw = buf.join('\n').trim();
    if (raw) {
      out.push('<p>' + inlineFormat(raw) + '</p>');
    }
    buf = [];
  }

  function flushList() {
    if (!inList) return;
    out.push('<ul>' + listItems.map(li => '<li>' + inlineFormat(li) + '</li>').join('') + '</ul>');
    listItems = [];
    inList = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fences — just strip them
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushBuf(); flushList();
      out.push('<div class="ornament">· · ·</div>');
      continue;
    }

    // Headings
    const h4 = line.match(/^####\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h4) { flushBuf(); flushList(); out.push('<h4>' + inlineFormat(h4[1]) + '</h4>'); continue; }
    if (h3) { flushBuf(); flushList(); out.push('<h3>' + inlineFormat(h3[1]) + '</h3>'); continue; }
    if (h2) { flushBuf(); flushList(); out.push('<h2>' + inlineFormat(h2[1]) + '</h2>'); continue; }
    if (h1) { flushBuf(); flushList(); out.push('<h1>' + inlineFormat(h1[1]) + '</h1>'); continue; }

    // Blockquote
    if (line.startsWith('> ')) {
      flushBuf(); flushList();
      out.push('<blockquote>' + inlineFormat(line.slice(2)) + '</blockquote>');
      continue;
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushBuf(); flushList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (!inTable) {
        // Check if next line is separator
        const nextLine = lines[i + 1] || '';
        if (nextLine.match(/^\|[-| :]+\|/)) {
          inTable = true;
          tableHeaders = cells;
          i++; // skip separator
          out.push('<table><thead><tr>' + tableHeaders.map(h => '<th>' + inlineFormat(h) + '</th>').join('') + '</tr></thead><tbody>');
          continue;
        }
      }
      if (inTable) {
        out.push('<tr>' + cells.map(c => '<td>' + inlineFormat(c) + '</td>').join('') + '</tr>');
        continue;
      }
    } else if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
    }

    // List items
    if (/^[-*]\s+/.test(line)) {
      flushBuf();
      inList = true;
      listItems.push(line.replace(/^[-*]\s+/, ''));
      continue;
    } else if (inList && line.trim() === '') {
      flushList();
    } else if (inList) {
      // continuation or non-list — flush
      flushList();
    }

    // Blank line = paragraph break
    if (line.trim() === '') {
      flushBuf();
      continue;
    }

    // Skip YAML-ish frontmatter/metadata lines (> **...**)
    if (line.startsWith('> **') || line.startsWith('> *')) {
      // treat as blockquote
      flushBuf(); flushList();
      const content = line.replace(/^>\s*/, '');
      out.push('<blockquote class="meta">' + inlineFormat(content) + '</blockquote>');
      continue;
    }

    buf.push(line);
  }

  flushBuf();
  flushList();
  if (inTable) out.push('</tbody></table>');

  return out.join('\n');
}

function inlineFormat(text) {
  // escape HTML first (minimal)
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Bold+italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic (but not in the middle of words)
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Italic with _
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  // Links [text](url) — keep as plain text with link
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  return text;
}

// ── Document definitions ──────────────────────────────────────────────────────

const DOCS = [
  {
    id: 'core',
    file: 'The_Generative_Ethic_v1_8.md',
    type: 'Core Framework · v1.8',
    title: 'The Generative Ethic',
    subtitle: 'A structural framework for existence, goodness, and the obligation of conscious agents',
    group: 'core',
    connections: ['metaphysics', 'political', 'ai', 'judaism', 'music'],
    graphType: 'core',
    graphR: 26,
  },
  {
    id: 'metaphysics',
    file: 'The_Generative_Ethic_Extended_Metaphysics_v1_2.md',
    type: 'Extended Framework · v1.2',
    title: 'Extended Metaphysics',
    subtitle: 'Creation, consciousness, and the framework\'s relationship to religious and spiritual traditions',
    group: 'core',
    connections: ['core', 'ai', 'judaism'],
    graphType: 'framework',
    graphR: 18,
  },
  {
    id: 'political',
    file: 'The_Generative_Ethic_Political_Significance_v1_1.md',
    type: 'Application · v1.1',
    title: 'Political Significance',
    subtitle: 'Governance, institutions, and the structural conditions for civilizational emergence',
    group: 'applications',
    connections: ['core', 'ip', 'antisemitism', 'judaism'],
    graphType: 'application',
    graphR: 18,
  },
  {
    id: 'ai',
    file: 'The_Generative_Ethic_AI_Alignment_v1.md',
    type: 'Application · v0.9',
    title: 'AI Alignment',
    subtitle: 'Artificial intelligence, moral consciousness, and the partnership model',
    group: 'applications',
    connections: ['core', 'metaphysics'],
    graphType: 'application',
    graphR: 16,
  },
  {
    id: 'music',
    file: null, // composed from multiple files
    type: 'Companion Series · Papers I–IV',
    title: 'Music & Sound',
    subtitle: 'The evolutionary and cultural foundation of participatory music as a mechanism of human binding',
    group: 'applications',
    connections: ['core', 'metaphysics'],
    graphType: 'application',
    graphR: 15,
    multiFile: [
      'GE_Music_Paper_1_Sound_Before_Culture_v3.md',
      'GE_Music_Paper_2_The_Binding_Technology_v1_1.md',
      'GE_Music_Paper_3_The_Carrier_Wave_v1_1.md',
      'GE_Music_Paper_4_The_Five_Eras_v1_0.md',
      'GE_Music_Companion_1_The_Participation_Deficit_v1_0.md',
      'GE_Music_Practice_Design_Proposal_v1_0.md',
    ],
  },
  {
    id: 'judaism',
    file: 'GE_Judaism_v1_0.md',
    type: 'Case Study · v0.1',
    title: 'Judaism',
    subtitle: 'A structural analysis of Jewish theology, tradition, and civilization',
    group: 'casestudies',
    connections: ['core', 'metaphysics', 'ip', 'antisemitism'],
    graphType: 'case',
    graphR: 15,
  },
  {
    id: 'ip',
    file: 'GE_Israel_Palestine_v1_0.md',
    type: 'Case Study · v0.1',
    title: 'Israel–Palestine',
    subtitle: 'A structural moral case study',
    group: 'casestudies',
    connections: ['political', 'judaism', 'antisemitism'],
    graphType: 'case',
    graphR: 15,
  },
  {
    id: 'antisemitism',
    file: 'GE_Antisemitism_v1_0.md',
    type: 'Case Study · v0.1',
    title: 'Antisemitism',
    subtitle: 'A structural analysis of the most persistent form of civilizational persecution',
    group: 'casestudies',
    connections: ['core', 'judaism', 'political', 'ip'],
    graphType: 'case',
    graphR: 14,
  },
  {
    id: 'social-media',
    file: 'Essay_01_Social_Media_v1.md',
    type: 'Applied Essay · v1.0',
    title: 'Social Media',
    subtitle: 'The sensation of connection without its substance — a structural diagnosis',
    group: 'essays',
    connections: ['core', 'political'],
    graphType: 'application',
    graphR: 13,
  },
  {
    id: 'nietzsche',
    file: 'Essay_02_Nietzsche_v1_1.md',
    type: 'Applied Essay · v1.1',
    title: 'Nietzsche',
    subtitle: 'The virus with good intentions — a structural reading',
    group: 'essays',
    connections: ['core', 'metaphysics'],
    graphType: 'application',
    graphR: 13,
  },
  {
    id: 'consistent-crust',
    file: 'The_Consistent_Crust_Essay_Skeleton_v1.md',
    type: 'Essay Skeleton',
    title: 'The Consistent Crust',
    subtitle: 'How science\'s greatest success became its own obstacle',
    group: 'essays',
    connections: ['core'],
    graphType: 'application',
    graphR: 12,
  },
  {
    id: 'viral-taxonomy',
    file: 'Viral_Taxonomy_WIP_v1.md',
    type: 'Working Document',
    title: 'Viral Taxonomy',
    subtitle: 'A working taxonomy of strategies of propagation',
    group: 'essays',
    connections: ['core'],
    graphType: 'application',
    graphR: 11,
  },
  {
    id: 'glossary',
    file: null,
    type: 'Reference',
    title: 'Glossary of Terms',
    subtitle: 'Technical vocabulary and definitions within the framework',
    group: 'reference',
    connections: [],
    graphType: 'reference',
    graphR: 10,
  },
];

// ── Glossary ──────────────────────────────────────────────────────────────────

const GLOSSARY = {
  "generative emergence": {
    def: "The process by which new, more complex structures arise from the interaction of simpler elements — neither reducible to those elements nor imposed from outside. Reality itself may fundamentally be an emergent process.",
    source: "The Generative Ethic, §6"
  },
  "connection": {
    def: "One of the two fundamental tendencies of reality. The force that draws elements into relation, generating coherence, structure, and unity.",
    source: "The Generative Ethic, §2"
  },
  "separation": {
    def: "One of the two fundamental tendencies of reality. The force that maintains distinction between elements, generating autonomy, differentiation, and individuality.",
    source: "The Generative Ethic, §2"
  },
  "degenerative": {
    def: "Structural property of a process or system that reduces future generative potential — whether through excess rigidity (degenerative connection) or excess dissolution (degenerative separation).",
    source: "The Generative Ethic, Note on Register"
  },
  "productive asymmetry": {
    def: "The condition that existence requires: not equilibrium between connection and separation, but an asymmetric lean — enough connection to generate coherence, enough separation to maintain adaptability. Pure balance produces stasis.",
    source: "The Generative Ethic, §4"
  },
  "quad profile": {
    def: "A diagnostic tool representing a system's orientation across four relational axes simultaneously: internal, lateral, downward, and upward. The same system can be Emergent on one axis and Destructive on another at the same moment.",
    source: "The Generative Ethic, §10"
  },
  "four quadrants": {
    def: "The four structural modes produced by the interaction of connection and separation: Emergent (generative connection), Consistent (degenerative connection), Protective (generative separation), and Destructive (degenerative separation).",
    source: "The Generative Ethic, §9"
  },
  "viral goodness": {
    def: "The propagation of generative patterns through networks without consuming or collapsing the differentiation of what it contacts. Viral goodness recruits without consuming — it strengthens the differentiation of the systems it touches.",
    source: "The Generative Ethic, §9.7"
  },
  "consistent crust": {
    def: "The stable structural layer that allows an adaptive system to remain coherent while absorbing perturbation — neither so rigid it shatters nor so soft it dissolves. Also: the hardening of the scientific revolution's working assumptions into ontological commitments that now suppress emergence research.",
    source: "The Consistent Crust Essay"
  },
  "zoom level problem": {
    def: "The observation that any action or system can appear generative at one scale of analysis and degenerative at another. Ethical reasoning must specify its zoom level explicitly. The quad profile is the primary tool for navigating zoom level complexity.",
    source: "The Generative Ethic, §14"
  },
  "unknowability principle": {
    def: "The structural necessity of moral uncertainty: a complete moral algorithm cannot exist and would be degenerative if it did. Wolfram's computational irreducibility proves that for strongly emergent systems, the only perfect model is the system itself.",
    source: "The Generative Ethic, §14.3"
  },
  "emergent alignment": {
    def: "The condition in which bottom-up and top-down causation are in productive sync: the flourishing of sub-parts and the health of the higher-level system are mutually reinforcing rather than in tension.",
    source: "The Generative Ethic, §6.3"
  },
  "brave choice": {
    def: "The decision to dismantle an existing Consistent upward system despite gap risk — the period between dismantling and reconstitution during which degenerative forces may fill the vacuum. Defensible only when the existing system causes irreversible harm and sufficient Emergent capacity exists in the lower layers.",
    source: "The Generative Ethic, §10.4"
  },
  "tikkun olam": {
    def: "In Lurianic Kabbalah: the human moral task of gathering scattered divine sparks to restore the connection broken by the catastrophe of creation. In GE terms: conscious participation in generative emergence, restoring connective structures that degeneration has broken.",
    source: "Extended Metaphysics, §2.2; Judaism, §6"
  },
  "tzimtzum": {
    def: "The Kabbalistic doctrine of divine self-contraction creating the space within which creation occurs. Maps structurally onto the GE's Creation Principle: connectedness creating separation within itself.",
    source: "Extended Metaphysics, §1.4"
  }
};

// ── Build each document ───────────────────────────────────────────────────────

function readMd(filename) {
  const p = path.join(SRC, filename);
  if (!fs.existsSync(p)) { console.warn('Missing:', filename); return ''; }
  return fs.readFileSync(p, 'utf8');
}

function stripFrontmatter(md) {
  // Remove the blockquote metadata block at the top ("> **Status:**" etc.)
  // and the title/subtitle headers (we render those from metadata)
  return md;
}

for (const doc of DOCS) {
  let rawMd = '';

  if (doc.id === 'glossary') {
    // Generated glossary — no source file
    const glossHtml = Object.entries(GLOSSARY).map(([term, data]) => {
      return `<h2>${escapeHtml(term.charAt(0).toUpperCase() + term.slice(1))}</h2>` +
        `<p>${escapeHtml(data.def)}</p>` +
        `<p class="gloss-source">${escapeHtml(data.source)}</p>` +
        `<div class="ornament">—</div>`;
    }).join('\n');

    const out = {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle,
      group: doc.group,
      connections: doc.connections,
      graphType: doc.graphType,
      graphR: doc.graphR,
      html: glossHtml,
    };
    fs.writeFileSync(path.join(OUT, doc.id + '.json'), JSON.stringify(out, null, 2));
    console.log('Built: glossary');
    continue;
  }

  if (doc.multiFile) {
    rawMd = doc.multiFile.map(f => readMd(f)).join('\n\n---\n\n');
  } else {
    rawMd = readMd(doc.file);
  }

  const html = mdToHtml(stripFrontmatter(rawMd));

  const out = {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    subtitle: doc.subtitle,
    group: doc.group,
    connections: doc.connections,
    graphType: doc.graphType,
    graphR: doc.graphR,
    html,
  };

  fs.writeFileSync(path.join(OUT, doc.id + '.json'), JSON.stringify(out, null, 2));
  console.log('Built:', doc.id);
}

// Write glossary.json separately for the app
fs.writeFileSync(path.join(OUT, 'glossary-terms.json'), JSON.stringify(GLOSSARY, null, 2));
console.log('Built: glossary-terms.json');

// Write manifest
const manifest = DOCS.map(d => ({
  id: d.id,
  title: d.title,
  subtitle: d.subtitle,
  type: d.type,
  group: d.group,
  connections: d.connections,
  graphType: d.graphType,
  graphR: d.graphR,
}));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Built: manifest.json');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
