import React from 'react';

// Render the model's limited Markdown as React nodes, never as raw HTML.
function inline(text, highlight = false) {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*)/g).map((part, i) => {
    if (/^(\*\*|__)/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return highlight ? part.split(/(\d+(?:[.,]\d+)?\s?%|\d{2,})/g).map((piece, j) => j % 2 ? <b className="iv-num" key={`${i}-${j}`}>{piece}</b> : piece) : part;
  });
}
export default function CaseContent({ text, highlightNumbers = false }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const key = i;
    if (!line || /^```/.test(line)) { i++; continue; }
    if (/^([-*_])\1{2,}$/.test(line)) { nodes.push(<hr key={key}/>); i++; continue; }
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] || '')) {
      const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      const headers = cells(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      nodes.push(<div className="mvp-case-table" key={key}><table><thead><tr>{headers.map((c,j) => <th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.map((row,j) => <tr key={j}>{row.map((c,k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/) || line.match(/^\*\*(.+?)\*\*:?$/);
    if (heading) { nodes.push(<h3 key={key}>{inline(heading[1])}</h3>); i++; continue; }
    if (/^(?:[-*+]\s+|\d+[.)]\s+)/.test(line)) {
      const ordered = /^\d/.test(line); const items = [];
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
      while (i < lines.length && pattern.test(lines[i].trim())) items.push(lines[i++].trim().replace(pattern, ''));
      const List = ordered ? 'ol' : 'ul'; nodes.push(<List key={key}>{items.map((x,j) => <li key={j}>{inline(x)}</li>)}</List>); continue;
    }
    const fact = line.match(/^\*\*([^*]+?):?\*\*\s*:?\s+(.+)$/);
    if (fact) nodes.push(<p className={`mvp-case-fact${/^Задача/.test(fact[1]) ? ' is-task' : ''}`} key={key}><strong>{fact[1].replace(/:$/, '')}</strong><span>{inline(fact[2], highlightNumbers)}</span></p>);
    else nodes.push(<p key={key}>{inline(line, highlightNumbers)}</p>);
    i++;
  }
  return <div className="mvp-case-content">{nodes}</div>;
}
