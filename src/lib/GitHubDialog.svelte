<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    onConfirm: (url: string) => void;
    onClose: () => void;
  }

  const { onConfirm, onClose }: Props = $props();

  let inputUrl = $state("");
  let error = $state("");
  let inputEl: HTMLInputElement | null = $state(null);

  function handleSubmit() {
    const url = inputUrl.trim();
    if (!url) {
      error = "URLを入力してください";
      return;
    }
    if (!/^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/.test(url)) {
      error = "GitHubリポジトリのURLを入力してください（例: https://github.com/owner/repo）";
      return;
    }
    error = "";
    onConfirm(url);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleSubmit();
  }

  onMount(() => {
    inputEl?.focus();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="overlay" role="presentation" onclick={onClose} onkeydown={handleKeydown}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="dialog" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
    <h3>GitHubリポジトリを開く</h3>
    <p class="hint">リポジトリのトップページURLを入力してください</p>
    <input
      bind:this={inputEl}
      type="url"
      placeholder="https://github.com/owner/repo"
      bind:value={inputUrl}
      onkeydown={handleKeydown}
    />
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <div class="actions">
      <button onclick={onClose}>キャンセル</button>
      <button class="primary" onclick={handleSubmit}>開く</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--toolbar-bg, #fff);
    border: 1px solid var(--toolbar-border, #d0d7de);
    border-radius: 8px;
    padding: 20px 24px;
    min-width: 400px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--toolbar-text, #24292f);
  }

  .hint {
    margin: 0;
    font-size: 12px;
    color: var(--sidebar-empty-text, #57606a);
  }

  input[type="url"] {
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    border: 1px solid var(--toolbar-border, #d0d7de);
    border-radius: 6px;
    background: var(--body-bg, #fff);
    color: var(--toolbar-text, #24292f);
    box-sizing: border-box;
    outline: none;
  }

  input[type="url"]:focus {
    border-color: var(--sidebar-active-text, #0969da);
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.15);
  }

  .error {
    margin: 0;
    font-size: 12px;
    color: var(--error-color, #c0392b);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }

  button {
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid var(--toolbar-border, #d0d7de);
    cursor: pointer;
    background: var(--sidebar-bg, #f6f8fa);
    color: var(--toolbar-text, #24292f);
  }

  button:hover {
    background: var(--toolbar-btn-hover, rgba(0, 0, 0, 0.08));
  }

  button.primary {
    background: var(--sidebar-active-text, #0969da);
    border-color: transparent;
    color: #fff;
  }

  button.primary:hover {
    opacity: 0.88;
  }
</style>
