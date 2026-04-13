<script lang="ts">
  interface Props {
    version: string;
    notes: string;
    onConfirm: () => void;
    onClose: () => void;
  }

  const { version, notes, onConfirm, onClose }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="update-title">
  <div class="dialog">
    <h2 id="update-title" class="title">アップデートが利用可能です</h2>
    <p class="version">新しいバージョン: <strong>{version}</strong></p>
    {#if notes}
      <div class="notes">{notes}</div>
    {/if}
    <div class="actions">
      <button class="btn-primary" onclick={onConfirm}>ダウンロードしてインストール</button>
      <button class="btn-secondary" onclick={onClose}>後で</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--toolbar-bg, #fff);
    border: 1px solid var(--settings-border, #d0d7de);
    border-radius: 8px;
    padding: 24px;
    width: 360px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--toolbar-text, #24292f);
  }

  .version {
    margin: 0;
    font-size: 13px;
    color: var(--toolbar-text, #24292f);
  }

  .notes {
    font-size: 13px;
    color: var(--sidebar-empty-text, #57606a);
    max-height: 120px;
    overflow-y: auto;
    white-space: pre-wrap;
    border: 1px solid var(--settings-border, #d0d7de);
    border-radius: 4px;
    padding: 8px;
    background: var(--settings-bg, #f0f2f5);
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .btn-primary {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: #0969da;
    color: #fff;
  }

  .btn-primary:hover {
    background: #0757ba;
  }

  .btn-secondary {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--settings-border, #d0d7de);
    border-radius: 6px;
    cursor: pointer;
    background: var(--toolbar-bg, #fff);
    color: var(--toolbar-text, #24292f);
  }

  .btn-secondary:hover {
    background: var(--settings-bg, #f0f2f5);
  }
</style>
