<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";

  const M365_COPILOT_URL = "https://m365.cloud.microsoft/chat";

  let paneEl: HTMLDivElement;
  let webviewAreaEl: HTMLDivElement;

  async function syncWebview() {
    if (!webviewAreaEl) return;
    const rect = webviewAreaEl.getBoundingClientRect();
    await invoke("resize_copilot_pane", {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    }).catch(() => {});
  }

  onMount(() => {
    let ro: ResizeObserver | null = null;

    // DOM レイアウトが確定してから位置を取得する
    requestAnimationFrame(async () => {
      if (!webviewAreaEl) return;
      const rect = webviewAreaEl.getBoundingClientRect();
      await invoke("open_copilot_pane", {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      }).catch(console.error);

      // レイアウト変化（ウィンドウリサイズ・サイドバー開閉など）に追従する
      ro = new ResizeObserver(syncWebview);
      ro.observe(paneEl);
    });

    return () => {
      ro?.disconnect();
      invoke("close_copilot_pane").catch(() => {});
    };
  });
</script>

<div class="copilot-pane" bind:this={paneEl}>
  <div class="copilot-header">
    <svg class="copilot-icon" viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm.75 3.25a.75.75 0 0 1 .75.75v3.19l2.03 2.03a.75.75 0 1 1-1.06 1.06l-2.25-2.25A.75.75 0 0 1 10 11V7.5a.75.75 0 0 1 .75-.75Z"/>
    </svg>
    <span>M365 Copilot</span>
    <a
      class="copilot-open-link"
      href={M365_COPILOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="ブラウザで開く"
    >↗</a>
  </div>
  <div class="copilot-webview-area" bind:this={webviewAreaEl}></div>
</div>

<style>
  .copilot-pane {
    flex: 0 0 420px;
    border-left: 1px solid var(--toolbar-border, #d0d7de);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 280px;
  }

  .copilot-header {
    height: 36px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 600;
    background: var(--toolbar-bg, #fff);
    border-bottom: 1px solid var(--toolbar-border, #d0d7de);
    flex-shrink: 0;
    color: var(--toolbar-text, #24292f);
    user-select: none;
  }

  .copilot-icon {
    opacity: 0.75;
    flex-shrink: 0;
  }

  .copilot-header span {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .copilot-open-link {
    font-size: 14px;
    color: var(--toolbar-text, #24292f);
    opacity: 0.5;
    text-decoration: none;
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .copilot-open-link:hover {
    opacity: 1;
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.08));
  }

  .copilot-webview-area {
    flex: 1;
    overflow: hidden;
    /* ネイティブ webview がこの領域に重なって表示される */
    background: var(--settings-bg, #f0f2f5);
  }
</style>
