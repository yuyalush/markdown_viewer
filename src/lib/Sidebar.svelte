<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";

  export interface Heading {
    level: number;
    text: string;
    id: string;
  }

  interface Props {
    headings: Heading[];
    activeHeadingId: string;
    currentFilePath: string | null;
    onOpenFile: (path: string) => void;
    githubFiles?: string[];
    githubCurrentPath?: string | null;
    githubRepoLabel?: string;
  }

  const { headings, activeHeadingId, currentFilePath, onOpenFile, githubFiles, githubCurrentPath, githubRepoLabel }: Props = $props();

  type Tab = "toc" | "files";
  let activeTab = $state<Tab>("toc");
  let mdFiles = $state<string[]>([]);

  $effect(() => {
    // GitHub モード時はローカルファイル一覧を取得しない
    if (activeTab !== "files" || !currentFilePath || githubFiles !== undefined) return;
    const dir = currentFilePath.replace(/[/\\][^/\\]*$/, "");
    invoke<string[]>("list_md_files", { dir }).then((files) => {
      mdFiles = files;
    });
  });

  function getFilename(path: string): string {
    return path.replace(/.*[/\\]/, "");
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
</script>

<nav class="sidebar">
  <div class="sidebar-tabs">
    <button class:active={activeTab === "toc"} onclick={() => (activeTab = "toc")}>目次</button>
    <button class:active={activeTab === "files"} onclick={() => (activeTab = "files")}>ファイル</button>
  </div>

  {#if activeTab === "toc"}
    {#if headings.length === 0}
      <p class="empty">見出しがありません</p>
    {:else}
      <ul>
        {#each headings as h}
          <li class="level-{h.level}" class:active={h.id === activeHeadingId}>
            <button onclick={() => scrollTo(h.id)} title={h.text}>
              {h.text}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    {#if githubFiles !== undefined}
      <!-- GitHub モード: リポジトリ内の .md ファイル一覧 -->
      {#if githubRepoLabel}
        <p class="repo-label">📦 {githubRepoLabel}</p>
      {/if}
      {#if githubFiles.length === 0}
        <p class="empty">読み込み中…</p>
      {:else}
        <ul class="file-list">
          {#each githubFiles as path}
            <li class:active={path === githubCurrentPath}>
              <button onclick={() => onOpenFile(path)} title={path}>
                {path}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {:else if !currentFilePath}
      <p class="empty">ファイルを開いてください</p>
    {:else if mdFiles.length === 0}
      <p class="empty">同フォルダ内に .md ファイルがありません</p>
    {:else}
      <ul class="file-list">
        {#each mdFiles as path}
          <li class:active={path === currentFilePath}>
            <button onclick={() => onOpenFile(path)} title={path}>
              {getFilename(path)}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</nav>

<style>
  .sidebar {
    width: 240px;
    min-width: 240px;
    border-right: 1px solid var(--sidebar-border, #d0d7de);
    background: var(--sidebar-bg, #f6f8fa);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--sidebar-border, #d0d7de);
    flex-shrink: 0;
  }

  .sidebar-tabs button {
    flex: 1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--sidebar-empty-text, #57606a);
    border-bottom: 2px solid transparent;
    font-family: inherit;
  }

  .sidebar-tabs button:hover {
    color: var(--sidebar-text, #24292f);
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.05));
  }

  .sidebar-tabs button.active {
    color: var(--sidebar-active-text, #0969da);
    border-bottom-color: var(--sidebar-active-text, #0969da);
  }

  ul {
    list-style: none;
    padding: 4px 0;
    margin: 0;
  }

  li button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    padding: 3px 12px;
    font-size: 13px;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--sidebar-text, #24292f);
    border-radius: 0;
    font-family: inherit;
  }

  li button:hover {
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.05));
  }

  li.active button {
    background: var(--sidebar-active-bg, #dbe5f5);
    color: var(--sidebar-active-text, #0969da);
    font-weight: 500;
  }

  /* TOC インデントレベル */
  li.level-1 button { padding-left: 12px; font-weight: 600; }
  li.level-2 button { padding-left: 20px; }
  li.level-3 button { padding-left: 28px; }
  li.level-4 button { padding-left: 36px; font-size: 12px; }
  li.level-5 button { padding-left: 44px; font-size: 12px; }
  li.level-6 button { padding-left: 52px; font-size: 12px; }

  /* ファイル一覧 */
  .file-list li button {
    padding-left: 12px;
    font-size: 13px;
  }

  .empty {
    padding: 12px;
    font-size: 13px;
    color: var(--sidebar-empty-text, #57606a);
  }

  .repo-label {
    padding: 6px 12px 2px;
    font-size: 11px;
    color: var(--sidebar-empty-text, #57606a);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
