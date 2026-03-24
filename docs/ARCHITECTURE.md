# アーキテクチャドキュメント

## 概要

**Markdown Viewer** は Tauri v2 + Svelte 5 + TypeScript で構築されたデスクトップ向け Markdown ビューアアプリ。  
ローカルファイルの表示・自動リロードと、GitHub リポジトリのオンライン閲覧の両方をサポートする。

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| デスクトップランタイム | Tauri | v2 |
| バックエンド言語 | Rust | 2021 edition |
| フロントエンドフレームワーク | Svelte | v5 (Runes) |
| フロントエンド言語 | TypeScript | v5 |
| バンドラー | Vite | v6 |
| Markdown パーサ | markdown-it | v14 |
| シンタックスハイライト | highlight.js | v11 |
| 数式レンダリング | KaTeX | v0.16 |
| 図表レンダリング | Mermaid | v11 |
| XSS サニタイズ | DOMPurify | v3 |
| ファイル監視 | notify (Rust) | v6 |

---

## プロジェクト構成

```
markdown-viewer/
├── index.html                   # HTML エントリポイント
├── vite.config.ts               # Vite 設定
├── tsconfig.json                # TypeScript 設定
├── package.json                 # フロントエンド依存
├── src/                         # フロントエンドソース
│   ├── main.ts                  # Svelte マウントエントリ
│   ├── App.svelte               # ルートコンポーネント（状態管理・業務ロジック）
│   ├── styles/
│   │   └── app.css              # グローバルスタイル・CSS カスタムプロパティ
│   └── lib/
│       ├── Toolbar.svelte       # 上部ツールバー
│       ├── Sidebar.svelte       # 左サイドバー（TOC / ファイル一覧）
│       ├── MarkdownRenderer.svelte  # Markdown レンダラー
│       ├── SearchBar.svelte     # 検索バー
│       ├── GitHubDialog.svelte  # GitHub URL 入力ダイアログ
│       ├── markdownParser.ts    # markdown-it 設定・拡張プラグイン
│       ├── theme.ts             # テーマ（ライト/ダーク）切替ユーティリティ
│       ├── github.ts            # GitHub API ユーティリティ
│       └── pathUtils.ts         # ローカルパス解決ユーティリティ
├── src-tauri/                   # Rust バックエンド
│   ├── src/
│   │   ├── main.rs              # エントリポイント（`lib::run()` を呼ぶだけ）
│   │   └── lib.rs               # IPC コマンド・ファイル監視ロジック
│   ├── Cargo.toml               # Rust 依存
│   ├── tauri.conf.json          # Tauri アプリ設定
│   └── capabilities/
│       └── default.json         # IPC パーミッション定義
└── docs/
    └── ARCHITECTURE.md          # このドキュメント
```

---

## コンポーネント構成

```
App.svelte
├── Toolbar.svelte          ← ナビゲーション・ツールボタン群
├── [settings-bar]          ← マージン設定スライダー（inline）
├── GitHubDialog.svelte     ← GitHub URL 入力モーダル
├── SearchBar.svelte        ← ドキュメント内検索バー
├── [error-banner]          ← エラーメッセージ表示（inline）
├── [loading-banner]        ← GitHub 読み込み中表示（inline）
└── .content
    ├── Sidebar.svelte      ← TOC / ファイル一覧
    └── MarkdownRenderer.svelte ← HTML レンダリング・検索・Mermaid
```

### App.svelte

アプリの中核。すべての状態を保持し、コンポーネント間のデータフローを制御する。

**主な状態:**

| 変数 | 型 | 説明 |
|---|---|---|
| `filePath` | `string \| null` | 現在開いているローカルファイルパス |
| `markdownContent` | `string` | 表示中の Markdown テキスト |
| `darkMode` | `boolean` | テーマモード |
| `sidebarOpen` | `boolean` | サイドバー表示フラグ |
| `headings` | `Heading[]` | 見出し一覧（MarkdownRenderer から更新） |
| `backHistory` / `forwardHistory` | `HistoryEntry[]` | ナビゲーション履歴スタック |
| `isGithubMode` | `boolean` | GitHub モード中フラグ |
| `githubInfo` | `GitHubRepoInfo \| null` | 現在の GitHub リポジトリ情報 |

### MarkdownRenderer.svelte

レンダリング・インタラクションを担うコンポーネント。以下の機能を`$effect`で実装:

1. **見出し収集 + ScrollSpy** — `IntersectionObserver` でアクティブ見出しを追跡
2. **検索ハイライト** — DOM ウォーカーでテキストノードを走査し `<mark class="sh">` を付与
3. **Mermaid 描画** — コンテンツ変化時に `mermaid.run()` を実行
4. **Mermaid ダークモード** — テーマ変更時に `mermaid.initialize()` + `mermaid.run()` を再実行
5. **リンク処理** — 外部リンク（opener）・アンカー・相対パスの 3 種類で分岐

---

## IPC インターフェース（Tauri コマンド）

フロントエンドとバックエンドは `invoke()` で通信する。

| コマンド | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `read_file` | `path: String` | `Result<String, String>` | ファイル内容をテキストで返す |
| `get_cli_open_path` | ー | `Option<String>` | CLI 引数で渡されたファイルパスを返す |
| `watch_file` | `path: String, window_label: String` | `Result<(), String>` | ファイル変更監視を開始する |
| `list_md_files` | `dir: String` | `Result<Vec<String>, String>` | ディレクトリ内の `.md`/`.markdown` ファイル一覧を返す |

### ファイル変更イベント

`watch_file` で登録されたファイルが変更されると、バックエンドは `"file-changed"` イベントを発行する。  
フロントエンドは `listen("file-changed", ...)` で受信し、`reloadContent()` を呼び出す。

```
Rust (notify watcher)
  → app.emit("file-changed", path)
    → JS listen("file-changed")
      → reloadContent()
```

**デバウンス処理:** Windows では保存時に複数イベントが発火するため、Rust 側で 300ms デバウンスを実装済み。

---

## 状態管理

Svelte 5 Runes (`$state`, `$derived`, `$effect`) のみを使用。外部ストアライブラリは使用しない。

```
App.svelte ($state)
  │
  ├── $derived: canGoBack, canGoForward
  │
  ├── $props → Toolbar, Sidebar, MarkdownRenderer, SearchBar, GitHubDialog
  │
  └── コールバック (onXxx) で子コンポーネントのイベントを受信
```

### 永続化

ブラウザの `localStorage` で以下を保存する:

| キー | 値 | デフォルト |
|---|---|---|
| `darkMode` | `"true"` / `"false"` | `false` |
| `contentPadding` | 数値文字列 `"0"` ～ `"25"` | `8` |

---

## データフロー

### ローカルファイルオープン

```
[ユーザー操作]
  ファイルダイアログ / ドラッグ&ドロップ / CLI 引数
    ↓
openFile(path)
    ↓
loadFile(path)
    ├── invoke("read_file") → Rust fs::read_to_string
    ├── 履歴スタックに現在エントリを積む
    ├── filePath / markdownContent 更新
    ├── getCurrentWindow().setTitle(...)
    └── invoke("watch_file") → Rust notify watcher 登録
              ↓（ファイル変更時）
         listen("file-changed") → reloadContent()
```

### GitHub リポジトリ表示

```
[ユーザー] GitHubDialog で URL 入力
    ↓
openGithubRepo(url)
    ├── fetchDefaultBranch()   → GET /repos/{owner}/{repo}
    ├── fetchMdFilePaths()     → GET /repos/{owner}/{repo}/git/trees/{branch}
    └── fetchReadme()          → GET raw.githubusercontent.com/.../README.md
              ↓
isGithubMode = true
githubInfo / githubMdFiles / markdownContent 更新
    ↓
MarkdownRenderer が renderMarkdownSafe() で DOMPurify サニタイズ済み HTML を表示
```

### ナビゲーション履歴

```
backHistory: HistoryEntry[]   ← スタック（後ろへ戻る）
forwardHistory: HistoryEntry[]← スタック（前へ進む）

HistoryEntry = { type: "local", path, scrollTop }
             | { type: "github", info, path, mdFiles, scrollTop }

goBack():    backHistory の末尾 → 表示、現在エントリ → forwardHistory
goForward(): forwardHistory の末尾 → 表示、現在エントリ → backHistory
```

---

## ユーティリティモジュール

### `markdownParser.ts`

markdown-it に以下のプラグインを追加:

| プラグイン | 機能 |
|---|---|
| `markdown-it-anchor` | 見出しに ID を付与 |
| `markdown-it-task-lists` | `- [ ]` タスクチェックボックス |
| `markdown-it-footnote` | 脚注 `[^1]` |
| `@traptitech/markdown-it-katex` | KaTeX 数式 `$...$` / `$$...$$` |

シンタックスハイライトは `highlight.js` を使用。Mermaid ブロックは `<pre class="mermaid">` として出力し、MarkdownRenderer の `$effect` で `mermaid.run()` が処理する。

2 種類の関数を公開:
- `renderMarkdown(content)` — ローカルファイル用（XSS サニタイズなし）
- `renderMarkdownSafe(content)` — GitHub などリモートコンテンツ用（DOMPurify サニタイズあり）

### `theme.ts`

`applyTheme(dark: boolean)` が以下を実行:
1. GitHub Markdown CSS（`github-markdown-light/dark.css`）を `<style id="md-theme">` に動的注入
2. highlight.js テーマ CSS を `<style id="hljs-theme">` に動的注入
3. `document.body` に `dark` クラスを付与/除去（CSS カスタムプロパティのトリガー）

### `github.ts`

GitHub API・raw コンテンツ URL の操作を集約:

| 関数 | 説明 |
|---|---|
| `parseGitHubUrl(url)` | `https://github.com/owner/repo` → `{ owner, repo }` |
| `resolveGithubPath(currentPath, href)` | リポジトリ内相対パスを解決 |
| `buildRawUrl(owner, repo, branch, path)` | raw コンテンツ URL を構築 |
| `fetchDefaultBranch(owner, repo)` | API でデフォルトブランチ名を取得 |
| `fetchMdFilePaths(owner, repo, branch)` | リポジトリ内 `.md` ファイル一覧を取得 |
| `fetchReadme(owner, repo, branch)` | README を候補パスで順に試して取得 |

### `pathUtils.ts`

| 関数 | 説明 |
|---|---|
| `resolveLocalPath(currentFilePath, href)` | ローカルファイルからの相対パスを絶対パスに解決（Windows / Unix 両対応） |

---

## テーマシステム

```
app.css                         ← CSS カスタムプロパティ定義（:root / body.dark）
    ↑
theme.ts applyTheme()           ← github-markdown-css / highlight.js CSS を動的注入
    ↑                              body.dark クラスを制御
App.svelte toggleDark()         ← localStorage に永続化
```

カスタムプロパティの例:

```css
:root {
  --toolbar-bg: #ffffff;
  --sidebar-bg: #f6f8fa;
  ...
}
body.dark {
  --toolbar-bg: #161b22;
  --sidebar-bg: #0d1117;
  ...
}
```

---

## 検索システム

```
SearchBar.svelte
  → onQueryChange / onCaseSensitiveChange
    → App.svelte (searchQuery, searchCaseSensitive)
      → MarkdownRenderer.svelte (props として渡す)
        → $effect: applyHighlights()  ← DOM ウォーカーで <mark class="sh"> を付与
          → onSearchStatusChange(count, idx)  → App.svelte (searchMatchCount, searchCurrentIndex)
```

`goToNextMatch()` / `goToPrevMatch()` は MarkdownRenderer の公開メソッド（Svelte 5 `export function`）。  
SearchBar のボタンから App.svelte 経由で `rendererRef?.goToNextMatch()` として呼び出す。

---

## セキュリティ考慮事項

- **ローカルファイル**: `renderMarkdown()` を使用（サニタイズなし）。ファイルシステムアクセスは Tauri の制限内のみ。
- **GitHub などリモートコンテンツ**: `renderMarkdownSafe()` + DOMPurify でサニタイズ。
- **外部リンク**: `@tauri-apps/plugin-opener` でシステムブラウザに委譲（WebView 内で外部 URL を開かない）。
- **IPC 権限**: `capabilities/default.json` で `main` ウィンドウのみに許可するパーミッションを明示列挙。
- **GitHub API**: 認証なしの公開 API のみ使用。レートリミット（60 req/h）のリスクあり。
