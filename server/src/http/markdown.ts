export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInlineMarkdown(value: string): string {
  let output = escapeHtml(value);
  output = output.replaceAll('**', '<strong>');
  output = output.replaceAll('`', '<code>');
  return output;
}

function flushParagraph(html: string[], paragraph: string[]): void {
  if (paragraph.length > 0) {
    html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph.length = 0;
  }
}

export function renderMarkdown(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p class="empty-state">No MODULEINFO.md content found for this module.</p>';
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  const paragraph: string[] = [];
  let inList = false;
  let inCode = false;
  let codeLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      flushParagraph(html, paragraph);
      if (inList) { html.push('</ul>'); inList = false; }
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (!trimmed) {
      flushParagraph(html, paragraph);
      if (inList) { html.push('</ul>'); inList = false; }
      continue;
    }
    if (trimmed.startsWith('# ')) { flushParagraph(html, paragraph); html.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`); continue; }
    if (trimmed.startsWith('## ')) { flushParagraph(html, paragraph); html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`); continue; }
    if (trimmed.startsWith('### ')) { flushParagraph(html, paragraph); html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`); continue; }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph(html, paragraph);
      if (!inList) { html.push('<ul>'); inList = true; }
      html.push(`<li>${renderInlineMarkdown(trimmed.slice(2))}</li>`);
      continue;
    }
    paragraph.push(trimmed);
  }

  if (inCode) html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  flushParagraph(html, paragraph);
  if (inList) html.push('</ul>');
  return html.join('\n');
}
