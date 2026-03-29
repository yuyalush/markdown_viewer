<script lang="ts">
  import { renderMarkdown, renderMarkdownSafe } from "./markdownParser";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { convertFileSrc } from "@tauri-apps/api/core";
  import mermaid from "mermaid";
  import type { Heading } from "./Sidebar.svelte";
  import { resolveLocalPath } from "./pathUtils";

  // Mermaid 初期化（一度だけ）
  mermaid.initialize({ startOnLoad: false, theme: "default" });

  interface Props {
    content: string;
    currentFilePath?: string | null;
    searchQuery?: string;
    searchCaseSensitive?: boolean;
    sanitize?: boolean;
    darkMode?: boolean;
    onUpdateHeadings: (headings: Heading[]) => void;
    onUpdateActiveHeading: (id: string) => void;
    onSearchStatusChange?: (matchCount: number, currentIndex: number) => void;
    onOpenRelativeFile?: (href: string) => void;
  }

  const {
    content,
    currentFilePath = null,
    searchQuery = "",
    searchCaseSensitive = false,
    sanitize = false,
    darkMode = false,
    onUpdateHeadings,
    onUpdateActiveHeading,
    onSearchStatusChange,
    onOpenRelativeFile,
  }: Props = $props();

  let renderedHtml = $derived(sanitize ? renderMarkdownSafe(content) : renderMarkdown(content));
  let containerEl: HTMLDivElement | null = $state(null);
  let scrollEl: HTMLDivElement | null = $state(null);

  // 検索ハイライト管理
  let searchMarks: HTMLElement[] = [];
  let searchCurrentIdx = -1;

  function applyHighlights(container: HTMLElement, query: string, caseSensitive: boolean): HTMLElement[] {
    // 既存のハイライトを除去
    container.querySelectorAll("mark.sh").forEach((m) => {
      while (m.firstChild) m.parentNode!.insertBefore(m.firstChild, m);
      m.parentNode!.removeChild(m);
    });
    container.normalize();

    if (!query.trim()) return [];

    const matchQuery = caseSensitive ? query : query.toLowerCase();
    const marks: HTMLElement[] = [];

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = (node as Text).parentElement?.tagName ?? "";
        return tag === "SCRIPT" || tag === "STYLE"
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const haystack = caseSensitive
        ? (node.textContent ?? "")
        : (node.textContent ?? "").toLowerCase();
      if (haystack.includes(matchQuery)) textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent ?? "";
      const haystack = caseSensitive ? text : text.toLowerCase();
      const fragment = document.createDocumentFragment();
      let lastIdx = 0;
      let pos = haystack.indexOf(matchQuery, 0);
      while (pos !== -1) {
        if (pos > lastIdx) fragment.appendChild(document.createTextNode(text.slice(lastIdx, pos)));
        const mark = document.createElement("mark");
        mark.className = "sh";
        mark.textContent = text.slice(pos, pos + query.length);
        fragment.appendChild(mark);
        marks.push(mark);
        lastIdx = pos + query.length;
        pos = haystack.indexOf(matchQuery, lastIdx);
      }
      if (lastIdx < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIdx)));
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
    return marks;
  }

  function highlightCurrent(idx: number) {
    searchMarks.forEach((m, i) => m.classList.toggle("sh-current", i === idx));
    searchMarks[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    onSearchStatusChange?.(searchMarks.length, idx);
  }

  export function goToNextMatch() {
    if (searchMarks.length === 0) return;
    searchCurrentIdx = (searchCurrentIdx + 1) % searchMarks.length;
    highlightCurrent(searchCurrentIdx);
  }

  export function goToPrevMatch() {
    if (searchMarks.length === 0) return;
    searchCurrentIdx = (searchCurrentIdx - 1 + searchMarks.length) % searchMarks.length;
    highlightCurrent(searchCurrentIdx);
  }

  $effect(() => {
    // renderedHtml の変化後に DOM が更新されてからヘッダと ScrollSpy を設定
    const _track = renderedHtml;
    if (!containerEl) return;

    const headingEls = Array.from(
      containerEl.querySelectorAll("h1,h2,h3,h4,h5,h6")
    ) as HTMLElement[];

    const headings: Heading[] = headingEls.map((el, i) => {
      // markdown-it-anchor が設定した text-slug ベースの ID を優先。
      // 空の場合のみインデックスベースの ID をフォールバックとして使用。
      if (!el.id) el.id = `heading-${i}`;
      return { level: parseInt(el.tagName[1]), text: el.textContent?.trim() ?? "", id: el.id };
    });

    onUpdateHeadings(headings);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) onUpdateActiveHeading(visible.target.id);
      },
      { root: scrollEl, threshold: 0, rootMargin: "0px 0px -60% 0px" }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  // 検索ハイライト: renderedHtml か searchQuery か caseSensitive が変化したら再適用
  $effect(() => {
    const _track = renderedHtml;
    const query = searchQuery;
    const cs = searchCaseSensitive;
    if (!containerEl) return;

    searchMarks = applyHighlights(containerEl, query, cs);
    searchCurrentIdx = searchMarks.length > 0 ? 0 : -1;
    if (searchMarks.length > 0) {
      searchMarks[0].classList.add("sh-current");
      searchMarks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onSearchStatusChange?.(searchMarks.length, searchCurrentIdx);
  });

  // Mermaid: renderedHtml が変化するたびに .mermaid ブロックを再レンダリング
  $effect(() => {
    const _track = renderedHtml;
    if (!containerEl) return;
    const mermaidEls = containerEl.querySelectorAll("pre.mermaid");
    if (mermaidEls.length === 0) return;
    // 未処理のブロック（data-processed 属性がない）のみ対象
    mermaidEls.forEach((el) => el.removeAttribute("data-processed"));
    mermaid.run({ nodes: Array.from(mermaidEls) as HTMLElement[] }).catch(() => {});
  });

  // ダークモード切替時に Mermaid テーマを更新して再レンダリング
  $effect(() => {
    mermaid.initialize({ startOnLoad: false, theme: darkMode ? "dark" : "default" });
    if (!containerEl) return;
    const mermaidEls = containerEl.querySelectorAll("pre.mermaid");
    if (mermaidEls.length === 0) return;
    mermaidEls.forEach((el) => el.removeAttribute("data-processed"));
    mermaid.run({ nodes: Array.from(mermaidEls) as HTMLElement[] }).catch(() => {});
  });

  // 相対パス画像を asset:// URL に変換（ローカルファイルモード時のみ）
  $effect(() => {
    const _track = renderedHtml;
    if (!containerEl || !currentFilePath) return;
    containerEl.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      // 外部URL・データURI・既変換済みはスキップ
      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:") ||
        src.startsWith("asset://") ||
        src.startsWith("//")
      ) return;
      const absolutePath = resolveLocalPath(currentFilePath, src);
      img.src = convertFileSrc(absolutePath);
    });
  });

  /** スクロール位置を保持したままコンテンツを差し替える */
  export function getScrollTop(): number {
    return scrollEl?.scrollTop ?? 0;
  }
  export function setScrollTop(top: number) {
    if (scrollEl) scrollEl.scrollTop = top;
  }

  // 外部リンク・アンカーリンクのクリックを傍受
  $effect(() => {
    if (!containerEl) return;

    function handleLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("http://") || href.startsWith("https://")) {
        // 外部リンクはシステムブラウザで開く
        e.preventDefault();
        openUrl(href);
      } else if (href.startsWith("#")) {
        // ページ内アンカーはスムーズスクロール
        e.preventDefault();
        const id = decodeURIComponent(href.slice(1));
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (!href.startsWith("data:") && !href.startsWith("blob:")) {
        // 相対パス（ドキュメント内リンク）: 親コンポーネントに委譲
        e.preventDefault();
        onOpenRelativeFile?.(href);
      }
    }

    containerEl.addEventListener("click", handleLinkClick);
    return () => containerEl?.removeEventListener("click", handleLinkClick);
  });
</script>

<div class="scroll-container" bind:this={scrollEl}>
  {#if content}
    <div class="markdown-body" bind:this={containerEl}>
      <!-- Phase 1: ローカルファイルのみ。リモートコンテンツを表示する場合は DOMPurify での sanitize が必要 -->
      {@html renderedHtml}
    </div>
  {:else}
    <div class="empty-state">
      <div class="drop-hint">
        <p>📄 ファイルを開いてください</p>
        <p class="hint-sub">ツールバーの 📂 ボタン、またはファイルをドラッグ&ドロップ</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem var(--content-horiz-padding, 8%);
    background: var(--body-bg, #fff);
  }

  /* 検索ハイライト */
  :global(mark.sh) {
    background: #ffe566;
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }

  :global(mark.sh.sh-current) {
    background: #ff9a1f;
    outline: 2px solid #e06c00;
    outline-offset: 1px;
  }

  :global(body.dark mark.sh) {
    background: #5a4500;
    color: #ffd;
  }

  :global(body.dark mark.sh.sh-current) {
    background: #8a6a00;
    outline-color: #c09000;
  }

  .markdown-body {
    max-width: 860px;
    margin: 0 auto;
    /* github-markdown-css が .markdown-body に対して適用される */
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--sidebar-empty-text, #57606a);
  }

  .drop-hint {
    text-align: center;
    font-size: 16px;
    line-height: 2;
  }

  .hint-sub {
    font-size: 13px;
    opacity: 0.7;
  }
</style>
