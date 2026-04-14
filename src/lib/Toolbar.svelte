<script lang="ts">
  interface Props {
    darkMode: boolean;
    sidebarOpen: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    showSearch: boolean;
    showSettings: boolean;
    isGithubMode: boolean;
    copilotOpen: boolean;
    onToggleDark: () => void;
    onToggleSidebar: () => void;
    onOpenFile: () => void;
    onGoBack: () => void;
    onGoForward: () => void;
    onToggleSearch: () => void;
    onToggleSettings: () => void;
    onOpenGithubRepo: () => void;
    onToggleCopilot: () => void;
  }

  const {
    darkMode,
    sidebarOpen,
    canGoBack,
    canGoForward,
    showSearch,
    showSettings,
    isGithubMode,
    copilotOpen,
    onToggleDark,
    onToggleSidebar,
    onOpenFile,
    onGoBack,
    onGoForward,
    onToggleSearch,
    onToggleSettings,
    onOpenGithubRepo,
    onToggleCopilot,
  }: Props = $props();
</script>

<header class="toolbar">
  <div class="left">
    <button onclick={onToggleSidebar} title={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}>
      ☰
    </button>
    <button onclick={onGoBack} disabled={!canGoBack} title="前のファイルに戻る">←</button>
    <button onclick={onGoForward} disabled={!canGoForward} title="次のファイルに進む">→</button>
  </div>
  <div class="right">
    <button onclick={onOpenFile} title="ファイルを開く">📂</button>
    <button onclick={onOpenGithubRepo} class:active={isGithubMode} title="GitHubリポジトリを開く" style="padding: 4px 6px; line-height: 0">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    </button>
    <button onclick={onToggleSearch} class:active={showSearch} title="ドキュメント内検索">🔍</button>
    <button onclick={onToggleCopilot} class:active={copilotOpen} title="AI ペインを開く/閉じる">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style="display:block">
        <path d="M10 2.5c.28 0 .5.22.5.5v1a.5.5 0 0 1-1 0V3c0-.28.22-.5.5-.5Zm4.24 1.76a.5.5 0 0 1 0 .7l-.7.71a.5.5 0 1 1-.71-.7l.7-.71a.5.5 0 0 1 .71 0ZM17 9.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1ZM10 15.5c.28 0 .5.22.5.5v1a.5.5 0 0 1-1 0v-1c0-.28.22-.5.5-.5Zm4.95-1.55.7.71a.5.5 0 1 1-.71.7l-.7-.7a.5.5 0 1 1 .71-.71ZM4 9.5H3a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1Zm1.76-5.24.7.71a.5.5 0 1 1-.7.7l-.71-.7a.5.5 0 1 1 .7-.71Zm.29 6.7a.5.5 0 0 1-.7-.7l.7-.71a.5.5 0 1 1 .71.7l-.71.71ZM10 6a4 4 0 0 1 2.47 7.17.5.5 0 0 1-.28.08H7.81a.5.5 0 0 1-.28-.08A4 4 0 0 1 10 6Zm-1.5 6.25h3c.14 0 .27.06.36.15A3 3 0 1 0 7.14 12.4c.09-.09.22-.15.36-.15Zm-.5 1.25h4a.5.5 0 0 1 0 1H8a.5.5 0 0 1 0-1Zm.5 1.75h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1Z"/>
      </svg>
    </button>
    <button onclick={onToggleDark} title={darkMode ? "ライトモードに切替" : "ダークモードに切替"}>
      {darkMode ? "🌙" : "☀"}
    </button>
    <button onclick={onToggleSettings} class:active={showSettings} title="表示設定">⚙</button>
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    padding: 0 8px;
    background: var(--toolbar-bg, #fff);
    border-bottom: 1px solid var(--toolbar-border, #d0d7de);
    flex-shrink: 0;
    user-select: none;
  }

  .left,
  .right {
    display: flex;
    gap: 2px;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 16px;
    border-radius: 4px;
    color: var(--toolbar-text, #24292f);
    line-height: 1;
  }

  button:hover:not(:disabled) {
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.08));
  }

  button.active {
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.08));
    color: var(--sidebar-active-text);
  }

  button.active {
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.08));
    color: var(--sidebar-active-text);
  }

  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
