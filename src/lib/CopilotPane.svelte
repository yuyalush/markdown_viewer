<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { onMount } from "svelte";

  interface Props {
    url: string;
    label: string;
  }
  const { url, label }: Props = $props();

  let paneEl: HTMLDivElement;
  let webviewAreaEl: HTMLDivElement;
  let error = $state<string | null>(null);

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
    let unlistenMove: (() => void) | null = null;
    let unlistenResize: (() => void) | null = null;

    // DOM レイアウトが確定してから位置を取得する
    requestAnimationFrame(async () => {
      if (!webviewAreaEl) return;
      const rect = webviewAreaEl.getBoundingClientRect();
      await invoke("open_copilot_pane", {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        url,
      }).catch((e: unknown) => {
        error = String(e);
        console.error(e);
      });

      // レイアウト変化（サイドバー開閉など）に追従する
      ro = new ResizeObserver(syncWebview);
      ro.observe(paneEl);

      // ウィンドウ移動・リサイズ時にオーバーレイ位置を追従する
      const win = getCurrentWindow();
      unlistenMove = await win.onMoved(syncWebview);
      unlistenResize = await win.onResized(syncWebview);
    });

    return () => {
      ro?.disconnect();
      unlistenMove?.();
      unlistenResize?.();
      invoke("close_copilot_pane").catch(console.error);
    };
  });
</script>

<div class="copilot-pane" bind:this={paneEl}>
  <div class="copilot-header">
    <!-- AI スパークルアイコン -->
    <svg class="copilot-icon" viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M10 2.5c.28 0 .5.22.5.5v1a.5.5 0 0 1-1 0V3c0-.28.22-.5.5-.5Zm4.24 1.76a.5.5 0 0 1 0 .7l-.7.71a.5.5 0 1 1-.71-.7l.7-.71a.5.5 0 0 1 .71 0ZM17 9.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1ZM10 15.5c.28 0 .5.22.5.5v1a.5.5 0 0 1-1 0v-1c0-.28.22-.5.5-.5Zm4.95-1.55.7.71a.5.5 0 1 1-.71.7l-.7-.7a.5.5 0 1 1 .71-.71ZM4 9.5H3a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1Zm1.76-5.24.7.71a.5.5 0 1 1-.7.7l-.71-.7a.5.5 0 1 1 .7-.71Zm.29 6.7a.5.5 0 0 1-.7-.7l.7-.71a.5.5 0 1 1 .71.7l-.71.71ZM10 6a4 4 0 0 1 2.47 7.17.5.5 0 0 1-.28.08H7.81a.5.5 0 0 1-.28-.08A4 4 0 0 1 10 6Zm-1.5 6.25h3c.14 0 .27.06.36.15A3 3 0 1 0 7.14 12.4c.09-.09.22-.15.36-.15Zm-.5 1.25h4a.5.5 0 0 1 0 1H8a.5.5 0 0 1 0-1Zm.5 1.75h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1Z"/>
    </svg>
    <span>{label}</span>
    <a
      class="copilot-open-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="ブラウザで開く"
    >↗</a>
  </div>
  <div class="copilot-webview-area" bind:this={webviewAreaEl}>
    {#if error}
      <div class="copilot-error">{error}</div>
    {/if}
  </div>
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

  .copilot-error {
    padding: 12px 14px;
    font-size: 12px;
    color: #cf222e;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
