import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
// @ts-ignore
import taskLists from "markdown-it-task-lists";
// @ts-ignore
import footnote from "markdown-it-footnote";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import katexPlugin from "@traptitech/markdown-it-katex";
import "katex/dist/katex.min.css";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    // Mermaid ブロックは <pre class="mermaid"> として出力（mermaid.run() で処理）
    if (lang === "mermaid") {
      return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
    }
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        }).value;
        return `<pre class="hljs"><code>${highlighted}</code></pre>`;
      } catch {
        // fall through to default
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
}).use(anchor, { permalink: false })
  .use(taskLists, { enabled: true, label: true })
  .use(footnote)
  .use(katexPlugin, { throwOnError: false });

export function renderMarkdown(content: string): string {
  if (!content) return "";
  return md.render(content);
}

/** GitHub等リモートコンテンツ用: DOMPurify でサニタイズ済み HTML を返す */
export function renderMarkdownSafe(content: string): string {
  if (!content) return "";
  return DOMPurify.sanitize(md.render(content), {
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });
}
