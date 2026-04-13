<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { open } from "@tauri-apps/plugin-dialog";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Toolbar from "./lib/Toolbar.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import MarkdownRenderer from "./lib/MarkdownRenderer.svelte";
  import SearchBar from "./lib/SearchBar.svelte";
  import GitHubDialog from "./lib/GitHubDialog.svelte";
  import CopilotPane from "./lib/CopilotPane.svelte";
  import type { Heading } from "./lib/Sidebar.svelte";
  import { applyTheme } from "./lib/theme";
  import {
    parseGitHubUrl,
    resolveGithubPath,
    buildRawUrl,
    fetchDefaultBranch,
    fetchMdFilePaths,
    fetchReadme,
  } from "./lib/github";
  import { resolveLocalPath } from "./lib/pathUtils";

  let filePath = $state<string | null>(null);
  let markdownContent = $state("");
  let darkMode = $state(false);
  let sidebarOpen = $state(true);
  let headings = $state<Heading[]>([]);
  let activeHeadingId = $state("");
  let errorMessage = $state<string | null>(null);

  type HistoryEntry =
    | { type: "local"; path: string; scrollTop: number }
    | { type: "github"; info: { owner: string; repo: string; branch: string }; path: string; mdFiles: string[]; scrollTop: number };

  let backHistory = $state<HistoryEntry[]>([]);
  let forwardHistory = $state<HistoryEntry[]>([]);

  // 検索
  let showSearch = $state(false);
  let searchQuery = $state("");
  let searchCaseSensitive = $state(false);
  let searchMatchCount = $state(0);
  let searchCurrentIndex = $state(-1);

  // 設定
  let showSettings = $state(false);
  let contentPadding = $state(8);

  // Copilot ペイン
  let copilotOpen = $state(false);

  // GitHub モード
  let showGithubDialog = $state(false);
  let isGithubMode = $state(false);
  let githubInfo = $state<{ owner: string; repo: string; branch: string } | null>(null);
  let githubCurrentPath = $state<string | null>(null);
  let githubMdFiles = $state<string[]>([]);
  let isLoadingGithub = $state(false);

  let canGoBack = $derived(backHistory.length > 0);
  let canGoForward = $derived(forwardHistory.length > 0);

  let rendererRef: MarkdownRenderer | null = null;

  /** 現在表示中のエントリを返す */
  function currentEntry(): HistoryEntry | null {
    const scrollTop = rendererRef?.getScrollTop() ?? 0;
    if (isGithubMode && githubInfo && githubCurrentPath) {
      return { type: "github", info: githubInfo, path: githubCurrentPath, mdFiles: githubMdFiles, scrollTop };
    } else if (filePath) {
      return { type: "local", path: filePath, scrollTop };
    }
    return null;
  }

  /** GitHub リポジトリを読み込む */
  async function openGithubRepo(url: string) {
    showGithubDialog = false;
    isLoadingGithub = true;
    errorMessage = null;
    // 失敗時に履歴を元に戻せるよう事前に保存
    const savedBack = backHistory;
    const savedForward = forwardHistory;
    const current = currentEntry();
    if (current) {
      backHistory = [...backHistory, current];
      forwardHistory = [];
    }
    try {
      const parsed = parseGitHubUrl(url);
      if (!parsed) throw new Error("無効な GitHub URL です");

      const branch = await fetchDefaultBranch(parsed.owner, parsed.repo);

      // ファイルツリーと README を並列取得
      const [mdPaths, readme] = await Promise.all([
        fetchMdFilePaths(parsed.owner, parsed.repo, branch),
        fetchReadme(parsed.owner, parsed.repo, branch),
      ]);

      filePath = null;
      isGithubMode = true;
      githubInfo = { owner: parsed.owner, repo: parsed.repo, branch };
      githubCurrentPath = readme.path;
      githubMdFiles = mdPaths;
      markdownContent = readme.content;
      headings = [];
      await getCurrentWindow().setTitle(`${parsed.owner}/${parsed.repo} — Markdown Viewer`);
    } catch (err) {
      errorMessage = String(err);
      // 履歴を元どおりに戻す
      backHistory = savedBack;
      forwardHistory = savedForward;
    } finally {
      isLoadingGithub = false;
    }
  }

  /** GitHub リポジトリ内のファイルを読み込む */
  async function loadGithubFile(path: string, updateHistory = true) {
    if (!githubInfo) return;
    const isReload = path === githubCurrentPath;
    if (updateHistory && !isReload) {
      const current = currentEntry();
      if (current) {
        backHistory = [...backHistory, current];
        forwardHistory = [];
      }
    }
    try {
      const url = buildRawUrl(githubInfo.owner, githubInfo.repo, githubInfo.branch, path);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`ファイルの取得に失敗: HTTP ${resp.status}`);
      githubCurrentPath = path;
      markdownContent = await resp.text();
      headings = [];
      const filename = path.split("/").pop() ?? path;
      await getCurrentWindow().setTitle(`${filename} — ${githubInfo.owner}/${githubInfo.repo} — Markdown Viewer`);
      // 新規ファイルはトップへリセット（restoreEntry 経由の場合は後から上書きされる）
      requestAnimationFrame(() => rendererRef?.setScrollTop(0));
    } catch (err) {
      errorMessage = String(err);
    }
  }

  /** 相対パスリンクをクリックした際の処理 */
  async function handleOpenRelativeFile(href: string) {
    // href に fragment が含まれる場合分離 (例: "ch05.md#section")
    const hashIdx = href.indexOf("#");
    const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const anchorPart = hashIdx >= 0 ? href.slice(hashIdx + 1) : null;

    if (!pathPart) {
      // パス部分なし = 同一ドキュメント内アンカーのみ
      if (anchorPart) document.getElementById(anchorPart)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (isGithubMode && githubInfo && githubCurrentPath) {
      const resolved = resolveGithubPath(githubCurrentPath, pathPart);
      await loadGithubFile(resolved);
    } else if (filePath) {
      const resolved = resolveLocalPath(filePath, pathPart);
      await loadFile(resolved);
    }

    if (anchorPart) {
      // ファイル読み込み後に DOM が更新されるまで少し待つ
      setTimeout(() => {
        document.getElementById(anchorPart)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  /** 同一ファイルの自動リロード用（スクロール位置を保持） */
  async function reloadContent() {
    if (!filePath) return;
    try {
      const scrollTop = rendererRef?.getScrollTop() ?? 0;
      markdownContent = await invoke<string>("read_file", { path: filePath });
      errorMessage = null;
      requestAnimationFrame(() => rendererRef?.setScrollTop(scrollTop));
    } catch (err) {
      errorMessage = `ファイルの再読み込みに失敗しました: ${err}`;
    }
  }

  async function openFile(path?: string) {
    let targetPath = path;
    if (!targetPath) {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
      });
      if (typeof selected !== "string") return;
      targetPath = selected;
    }
    await loadFile(targetPath);
  }

  async function loadFile(path: string, updateHistory = true) {
    try {
      const content = await invoke<string>("read_file", { path });
      // 別ファイルを開く場合はトップへ、同一ファイル再読み込み時は位置を維持
      const isReload = path === filePath && !isGithubMode;
      const scrollTop = isReload ? (rendererRef?.getScrollTop() ?? 0) : 0;

      if (updateHistory && !isReload) {
        const current = currentEntry();
        if (current) {
          backHistory = [...backHistory, current];
          forwardHistory = [];
        }
      }

      // GitHub モードを終了
      if (isGithubMode) {
        isGithubMode = false;
        githubInfo = null;
        githubCurrentPath = null;
        githubMdFiles = [];
      }

      filePath = path;
      markdownContent = content;
      errorMessage = null;

      const filename = path.split(/[\\/]/).pop() ?? path;
      await getCurrentWindow().setTitle(`${filename} — Markdown Viewer`);

      // ファイル監視開始（ウィンドウごとに独立したウォッチャ）
      await invoke("watch_file", { path, windowLabel: getCurrentWindow().label });

      // 新規ファイルはトップへ、リロード時は位置を維持
      requestAnimationFrame(() => rendererRef?.setScrollTop(scrollTop));
    } catch (err) {
      errorMessage = `ファイルを開けませんでした: ${err}`;
    }
  }

  async function restoreEntry(entry: HistoryEntry) {
    const targetScroll = entry.scrollTop;
    if (entry.type === "local") {
      await loadFile(entry.path, false);
    } else {
      // GitHub モードを先に復元してから loadGithubFile を呼ぶ
      isGithubMode = true;
      githubInfo = entry.info;
      githubMdFiles = entry.mdFiles;
      githubCurrentPath = null; // isReload 判定をスキップさせる
      await loadGithubFile(entry.path, false);
    }
    // DOM 更新後にスクロール位置を復元
    requestAnimationFrame(() => {
      requestAnimationFrame(() => rendererRef?.setScrollTop(targetScroll));
    });
  }

  async function goBack() {
    const prev = backHistory[backHistory.length - 1];
    if (!prev) return;
    const current = currentEntry();
    if (current) forwardHistory = [...forwardHistory, current];
    backHistory = backHistory.slice(0, -1);
    await restoreEntry(prev);
  }

  async function goForward() {
    const next = forwardHistory[forwardHistory.length - 1];
    if (!next) return;
    const current = currentEntry();
    if (current) backHistory = [...backHistory, current];
    forwardHistory = forwardHistory.slice(0, -1);
    await restoreEntry(next);
  }

  function toggleDark() {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", String(darkMode));
    applyTheme(darkMode);
  }

  function toggleSearch() {
    showSearch = !showSearch;
    if (!showSearch) {
      searchQuery = "";
      searchMatchCount = 0;
      searchCurrentIndex = -1;
    }
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  function openGithubDialog() {
    showGithubDialog = true;
  }

  function onPaddingChange(v: number) {
    contentPadding = v;
    localStorage.setItem("contentPadding", String(v));
  }

  function toggleCopilot() {
    copilotOpen = !copilotOpen;
    localStorage.setItem("copilotOpen", String(copilotOpen));
  }

  onMount(() => {
    // テーマ復元（同期処理はここで直接実行）
    const saved = localStorage.getItem("darkMode");
    darkMode = saved === "true";
    applyTheme(darkMode);

    const savedPadding = localStorage.getItem("contentPadding");
    if (savedPadding !== null) contentPadding = Number(savedPadding);

    const savedCopilot = localStorage.getItem("copilotOpen");
    if (savedCopilot !== null) copilotOpen = savedCopilot === "true";

    let unlisten: (() => void) | undefined;
    let unlistenDrop: (() => void) | undefined;

    (async () => {
      try {
        unlisten = await listen<string>("file-changed", async (event) => {
          if (filePath === event.payload) await reloadContent();
        });

        const win = getCurrentWindow();
        unlistenDrop = await win.onDragDropEvent(async (event) => {
          if (event.payload.type === "drop" && "paths" in event.payload) {
            const paths = event.payload.paths as string[];
            const mdFile = paths.find((p) => /\.(md|markdown)$/i.test(p));
            if (mdFile) await openFile(mdFile);
          }
        });

        const cliPath = await invoke<string | null>("get_cli_open_path");
        if (cliPath) await openFile(cliPath);
      } catch (e) {
        console.error("[App] init error:", e);
      }
    })();

    return () => {
      unlisten?.();
      unlistenDrop?.();
    };
  });
</script>

<div class="app" style="--content-horiz-padding: {contentPadding}%">
  <Toolbar
    {darkMode}
    {sidebarOpen}
    {canGoBack}
    {canGoForward}
    {showSearch}
    {showSettings}
    {isGithubMode}
    {copilotOpen}
    onToggleDark={toggleDark}
    onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
    onOpenFile={() => openFile()}
    onGoBack={goBack}
    onGoForward={goForward}
    onToggleSearch={toggleSearch}
    onToggleSettings={toggleSettings}
    onOpenGithubRepo={openGithubDialog}
    onToggleCopilot={toggleCopilot}
  />
  {#if showSettings}
    <div class="settings-bar">
      <label class="settings-label">
        左右マージン:
        <input
          type="range"
          min="0"
          max="25"
          value={contentPadding}
          oninput={(e) => onPaddingChange(Number((e.currentTarget as HTMLInputElement).value))}
        />
        <span class="settings-value">{contentPadding}%</span>
      </label>
    </div>
  {/if}
  {#if showGithubDialog}
    <GitHubDialog onConfirm={openGithubRepo} onClose={() => (showGithubDialog = false)} />
  {/if}
  {#if showSearch}
    <SearchBar
      query={searchQuery}
      matchCount={searchMatchCount}
      currentMatchIndex={searchCurrentIndex}
      caseSensitive={searchCaseSensitive}
      onQueryChange={(q) => (searchQuery = q)}
      onCaseSensitiveChange={(v) => (searchCaseSensitive = v)}
      onNext={() => rendererRef?.goToNextMatch()}
      onPrev={() => rendererRef?.goToPrevMatch()}
      onClose={toggleSearch}
    />
  {/if}
  {#if errorMessage}
    <div class="error-banner" role="alert">{errorMessage}</div>
  {/if}
  {#if isLoadingGithub}
    <div class="loading-banner" role="status">GitHub からリポジトリを読み込んでいます…</div>
  {/if}
  <div class="content">
    {#if sidebarOpen}
      <Sidebar
        {headings}
        {activeHeadingId}
        currentFilePath={filePath}
        onOpenFile={(path) => isGithubMode ? loadGithubFile(path) : openFile(path)}
        githubFiles={isGithubMode ? githubMdFiles : undefined}
        githubCurrentPath={isGithubMode ? githubCurrentPath : undefined}
        githubRepoLabel={isGithubMode && githubInfo ? `${githubInfo.owner}/${githubInfo.repo}` : undefined}
      />
    {/if}
    <MarkdownRenderer
      bind:this={rendererRef}
      content={markdownContent}
      sanitize={isGithubMode}
      {darkMode}
      currentFilePath={filePath}
      githubInfo={isGithubMode ? githubInfo : null}
      githubCurrentPath={isGithubMode ? githubCurrentPath : null}
      searchQuery={showSearch ? searchQuery : ""}
      searchCaseSensitive={searchCaseSensitive}
      onOpenRelativeFile={handleOpenRelativeFile}
      onSearchStatusChange={(count, idx) => {
        searchMatchCount = count;
        searchCurrentIndex = idx;
      }}
      onUpdateHeadings={(h) => (headings = h)}
      onUpdateActiveHeading={(id) => (activeHeadingId = id)}
    />
    {#if copilotOpen}
      <CopilotPane />
    {/if}
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .error-banner {
    padding: 8px 16px;
    background: var(--error-bg, #fff0f0);
    color: var(--error-color, #c0392b);
    font-size: 13px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--error-border, #ffc5c5);
  }

  .loading-banner {
    padding: 8px 16px;
    background: var(--settings-bg, #f0f2f5);
    color: var(--sidebar-empty-text, #57606a);
    font-size: 13px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--settings-border, #d0d7de);
  }

  .settings-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 12px;
    background: var(--settings-bg, #f0f2f5);
    border-bottom: 1px solid var(--settings-border, #d0d7de);
    flex-shrink: 0;
    font-size: 13px;
    color: var(--toolbar-text);
  }

  .settings-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: default;
  }

  .settings-label input[type="range"] {
    width: 120px;
    cursor: pointer;
    accent-color: var(--sidebar-active-text);
  }

  .settings-value {
    min-width: 30px;
    text-align: right;
    color: var(--sidebar-empty-text);
    font-variant-numeric: tabular-nums;
  }
</style>
