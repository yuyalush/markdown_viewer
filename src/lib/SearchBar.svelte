<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    query: string;
    matchCount: number;
    currentMatchIndex: number;
    caseSensitive: boolean;
    onQueryChange: (q: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    onCaseSensitiveChange: (v: boolean) => void;
  }

  const { query, matchCount, currentMatchIndex, caseSensitive, onQueryChange, onNext, onPrev, onClose, onCaseSensitiveChange }: Props = $props();

  let inputEl: HTMLInputElement | null = $state(null);

  onMount(() => {
    inputEl?.focus();
    inputEl?.select();
  });
</script>

<div class="search-bar" role="search">
  <input
    bind:this={inputEl}
    type="text"
    value={query}
    oninput={(e) => onQueryChange((e.currentTarget as HTMLInputElement).value)}
    onkeydown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.shiftKey ? onPrev() : onNext();
      }
      if (e.key === "Escape") onClose();
    }}
    placeholder="ドキュメント内を検索..."
    aria-label="検索"
  />
  <label class="case-label" title="大文字小文字を区別する">
    <input
      type="checkbox"
      checked={caseSensitive}
      onchange={(e) => onCaseSensitiveChange((e.currentTarget as HTMLInputElement).checked)}
    />
    Aa
  </label>
  {#if query}
    <span class="count" class:no-match={matchCount === 0}>
      {matchCount === 0 ? "一致なし" : `${currentMatchIndex + 1} / ${matchCount}`}
    </span>
    <button onclick={onPrev} title="前の一致 (Shift+Enter)">↑</button>
    <button onclick={onNext} title="次の一致 (Enter)">↓</button>
  {/if}
  <button class="close-btn" onclick={onClose} title="検索を閉じる (Esc)">✕</button>
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--toolbar-border);
    flex-shrink: 0;
  }

  input {
    flex: 0 0 260px;
    padding: 3px 8px;
    border: 1px solid var(--toolbar-border);
    border-radius: 4px;
    font-size: 13px;
    background: var(--body-bg);
    color: var(--toolbar-text);
    outline: none;
    font-family: inherit;
  }

  input:focus {
    border-color: var(--sidebar-active-text);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--sidebar-active-text) 20%, transparent);
  }

  .count {
    font-size: 12px;
    color: var(--sidebar-empty-text);
    min-width: 70px;
    text-align: center;
    flex-shrink: 0;
  }

  .count.no-match {
    color: #cf222e;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 3px 7px;
    font-size: 13px;
    border-radius: 3px;
    color: var(--toolbar-text);
    font-family: inherit;
    line-height: 1;
  }

  button:hover {
    background: var(--toolbar-btn-hover);
  }

  .close-btn {
    font-size: 11px;
    color: var(--sidebar-empty-text);
  }

  .case-label {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    color: var(--sidebar-empty-text);
    cursor: pointer;
    user-select: none;
    padding: 2px 4px;
    border-radius: 3px;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .case-label:hover {
    background: var(--toolbar-btn-hover);
  }

  .case-label input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
