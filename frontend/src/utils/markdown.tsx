import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Check, Hash, ExternalLink, Workflow } from 'lucide-react';
import { useDraftStore } from '@/app/layout/use-draft-store';
import { cn } from '@/lib/utils';
import { MermaidView } from '@/features/diagrams/components/mermaid-view';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface CodeBlockProps {
  code: string;
  lang?: string;
  docId?: string;
  docName?: string;
  blockIndex?: number;
  headingSlug?: string;
  viewMode?: string;
}

function CodeBlock({ code, lang, docId, docName, blockIndex = 0, headingSlug, viewMode }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ roomId?: string }>();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMermaid = lang?.toLowerCase() === 'mermaid';

  const handleOpenInDiagrams = () => {
    let targetRoomId = params.roomId;
    if (!targetRoomId) {
      const match = window.location.pathname.match(/\/app\/room\/([^\/]+)/);
      targetRoomId = match ? match[1] : '';
    }
    if (targetRoomId) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const handoffState = {
        source: 'docs',
        roomId: targetRoomId,
        docId: docId || '',
        docName: docName || 'ARCHITECTURE.md',
        blockIndex,
        headingSlug: headingSlug || '',
        scrollTop,
        viewMode: viewMode || 'preview',
        mermaidCode: code,
        originalCode: code,
      };

      try {
        sessionStorage.setItem(`docs_diagram_return_${targetRoomId}`, JSON.stringify(handoffState));
      } catch (e) {}

      useDraftStore.getState().setDiagramCode(targetRoomId, code);
      navigate(`/app/room/${targetRoomId}/diagrams`, {
        state: handoffState,
      });
    }
  };

  if (isMermaid) {
    let targetRoomId = params.roomId;
    if (!targetRoomId) {
      const match = window.location.pathname.match(/\/app\/room\/([^\/]+)/);
      targetRoomId = match ? match[1] : '';
    }

    return (
      <div
        id={`diagram-block-${blockIndex}`}
        data-heading-slug={headingSlug}
        className="relative my-6 rounded-[14px] bg-surface border border-border overflow-hidden transition-all duration-300"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-sunken text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Workflow className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">
              Architecture Diagram {blockIndex > 0 ? `#${blockIndex + 1}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInDiagrams}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors cursor-pointer"
              title="Open and edit this Mermaid diagram in Diagram Studio"
            >
              <ExternalLink className="size-3" />
              <span>Open in Diagram Studio</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-muted text-xs transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy code'}</span>
            </button>
          </div>
        </div>
        <div className="p-4 bg-page">
          <MermaidView
            code={code}
            mode="inline"
            roomId={targetRoomId}
            docId={docId}
            docName={docName}
            blockIndex={blockIndex}
            headingSlug={headingSlug}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-4 rounded-[12px] bg-surface-sunken dark:bg-surface border border-border overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border bg-surface text-[11px] text-muted-foreground">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-foreground select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Parses bold (**text**), italic (*text*), inline code (`code`), and links ([text](url))
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline Code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 rounded-[5px] bg-surface-sunken dark:bg-surface font-mono text-[13px] text-foreground border border-border"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold (**text**)
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-foreground">
          {renderInline(boldMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Italic (*text* or _text_)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(
        <em key={keyIdx++} className="italic text-foreground">
          {renderInline(italicMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 4. Link [title](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyIdx++}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="size-2.5 inline" />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text character chunk
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      parts.push(<React.Fragment key={keyIdx++}>{remaining}</React.Fragment>);
      break;
    } else if (nextSpecial > 0) {
      parts.push(
        <React.Fragment key={keyIdx++}>
          {remaining.slice(0, nextSpecial)}
        </React.Fragment>
      );
      remaining = remaining.slice(nextSpecial);
    } else {
      // Encountered special character that didn't match rule, emit single char
      parts.push(<React.Fragment key={keyIdx++}>{remaining[0]}</React.Fragment>);
      remaining = remaining.slice(1);
    }
  }

  return parts;
}

export function MarkdownRenderer({
  content,
  className,
  docId,
  docName,
  viewMode = 'preview'
}: {
  content: string;
  className?: string;
  docId?: string;
  docName?: string;
  viewMode?: string;
}) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let lineIdx = 0;
  let currentHeadingSlug = '';
  let mermaidBlockIndex = 0;

  while (lineIdx < lines.length) {
    const line = lines[lineIdx];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      lineIdx++;
      while (lineIdx < lines.length && !lines[lineIdx].trim().startsWith('```')) {
        codeLines.push(lines[lineIdx]);
        lineIdx++;
      }
      const isM = lang.toLowerCase() === 'mermaid';
      const bIdx = isM ? mermaidBlockIndex++ : 0;
      elements.push(
        <CodeBlock
          key={`code-${lineIdx}`}
          code={codeLines.join('\n')}
          lang={lang}
          docId={docId}
          docName={docName}
          blockIndex={bIdx}
          headingSlug={currentHeadingSlug}
          viewMode={viewMode}
        />
      );
      lineIdx++;
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && line.includes('|')) {
      const tableLines: string[] = [];
      while (lineIdx < lines.length && lines[lineIdx].trim().startsWith('|')) {
        tableLines.push(lines[lineIdx].trim());
        lineIdx++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .map(c => c.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);

        const bodyRows = tableLines.slice(2).map(r =>
          r
            .split('|')
            .map(c => c.trim())
            .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        );

        elements.push(
          <div key={`table-${lineIdx}`} className="overflow-x-auto my-4 rounded-xl border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F6F7] dark:bg-muted/80 border-b border-border font-semibold text-foreground">
                  {headerCells.map((h, i) => (
                    <th key={i} className="px-3.5 py-2.5">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 leading-relaxed text-foreground">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (line.startsWith('# ')) {
      const text = line.slice(2).trim();
      const id = slugify(text);
      currentHeadingSlug = id;
      elements.push(
        <h1
          key={`h1-${lineIdx}`}
          id={id}
          className="text-2xl font-bold tracking-tight text-foreground mt-8 mb-3 group flex items-center gap-2 border-b border-border/50 pb-2"
        >
          <span>{renderInline(text)}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
            <Hash className="size-4" />
          </a>
        </h1>
      );
      lineIdx++;
      continue;
    }

    if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      const id = slugify(text);
      currentHeadingSlug = id;
      elements.push(
        <h2
          key={`h2-${lineIdx}`}
          id={id}
          className="text-lg font-semibold tracking-tight text-foreground mt-6 mb-2.5 group flex items-center gap-2"
        >
          <span>{renderInline(text)}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
            <Hash className="size-3.5" />
          </a>
        </h2>
      );
      lineIdx++;
      continue;
    }

    if (line.startsWith('### ')) {
      const text = line.slice(4).trim();
      const id = slugify(text);
      currentHeadingSlug = id;
      elements.push(
        <h3
          key={`h3-${lineIdx}`}
          id={id}
          className="text-sm font-semibold tracking-tight text-foreground mt-4 mb-2 group flex items-center gap-1.5"
        >
          <span>{renderInline(text)}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
            <Hash className="size-3" />
          </a>
        </h3>
      );
      lineIdx++;
      continue;
    }

    if (line.startsWith('#### ')) {
      const text = line.slice(5).trim();
      const id = slugify(text);
      elements.push(
        <h4
          key={`h4-${lineIdx}`}
          id={id}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1.5"
        >
          {renderInline(text)}
        </h4>
      );
      lineIdx++;
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${lineIdx}`} className="my-6 border-border" />);
      lineIdx++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${lineIdx}`}
          className="border-l-2 border-border pl-4 italic text-muted-foreground my-3 text-sm"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      lineIdx++;
      continue;
    }

    // Task list items or normal unordered lists
    if (/^\s*[-*]\s+\[([ xX])\]\s+/.test(line)) {
      const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)/);
      if (match) {
        const isDone = match[1].toLowerCase() === 'x';
        elements.push(
          <div key={`task-${lineIdx}`} className="flex items-center gap-2 py-0.5 text-[14px]">
            <input
              type="checkbox"
              checked={isDone}
              readOnly
              className="size-3.5 rounded border-border text-foreground accent-neutral-900"
            />
            <span className={isDone ? 'line-through text-muted-foreground' : 'text-foreground'}>
              {renderInline(match[2])}
            </span>
          </div>
        );
        lineIdx++;
        continue;
      }
    }

    // Unordered List item
    if (/^\s*[-*]\s+/.test(line)) {
      const indent = line.search(/\S/);
      const text = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <li
          key={`li-${lineIdx}`}
          style={{ marginLeft: `${Math.max(1, Math.floor(indent / 2) + 1)}rem` }}
          className="list-disc text-[14px] leading-relaxed text-foreground py-0.5"
        >
          {renderInline(text)}
        </li>
      );
      lineIdx++;
      continue;
    }

    // Ordered List item
    if (/^\s*\d+\.\s+/.test(line)) {
      const text = line.trim().replace(/^\d+\.\s+/, '');
      elements.push(
        <li
          key={`oli-${lineIdx}`}
          className="list-decimal ml-6 text-[14px] leading-relaxed text-foreground py-0.5"
        >
          {renderInline(text)}
        </li>
      );
      lineIdx++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      lineIdx++;
      continue;
    }

    // Paragraph
    elements.push(
      <p
        key={`p-${lineIdx}`}
        className="text-[15px] leading-[1.65] text-foreground my-2.5 select-text"
      >
        {renderInline(line)}
      </p>
    );
    lineIdx++;
  }

  return (
    <div className={cn('markdown-body max-w-[760px] text-foreground selection:bg-blue-100 dark:selection:bg-blue-900/40', className)}>
      {elements}
    </div>
  );
}
