# Markdown Viewer — コンセプト & 開発指示書

## 概要

Windows 環境において Markdown ファイルを「集中して読む」ことに特化した軽量デスクトップアプリケーション。  
VSCode の組み込みプレビューよりも快適な閲覧・ナビゲーション体験を提供する専用ビューアとして実装する。

---

## ターゲット環境

- **OS**: Windows 10 / 11（プライマリ）
- **ソース**: ローカルファイル / ローカルフォルダ / GitHub 上のドキュメント（URL 指定）

---

## 技術スタック選定

### 選定方針

1. **追加ランタイムのインストールを最小化する**  
   Windows 10/11 には WebView2 ランタイム（Chromium ベース）がプリインストール済み。これを活用する。

2. **全体のソースコード量を最小化する**  
   Markdown 処理・スタイリング・検索などは既存の JavaScript/TypeScript エコシステムの高品質ライブラリを積極的に利用する。

### 推奨スタック：**Tauri v2 + TypeScript + Svelte**

| レイヤー | 技術 | 理由 |
|---|---|---|
| デスクトップシェル | [Tauri v2](https://tauri.app/) (Rust) | WebView2 を利用するため別途ランタイム不要。バイナリが小さい |
| フロントエンド | TypeScript + Svelte | コンポーネント記述量が少なく、バンドルも軽量 |
| Markdown パース | [markdown-it](https://github.com/markdown-it/markdown-it) | 拡張記法プラグインが豊富 |
| スタイル | github-markdown-css | GitHub スタイルを CSS 一枚で再現 |
| コードハイライト | highlight.js または Shiki | markdown-it と統合が容易 |
| ファイル監視 | Tauri の `watch` API（notify クレート） | OS ネイティブのファイル変更通知 |

> **代替案**: Electron + TypeScript + React も同等の要件を満たせるが、パッケージサイズが大きくなる（Node.js ランタイム同梱）。  
> ソースコード量と追加インストール量のバランスを考慮し、Tauri を第一選択とする。

### 必要な開発環境（開発者のみ）

```
- Rust toolchain (rustup)
- Node.js (ビルド時のみ)
- pnpm または npm
```

エンドユーザーが別途インストールするランタイムはなし（Windows 10/11 の場合）。

---

## 機能要件

### F-01: ファイル・URL オープン

- ローカルファイル（`.md`, `.markdown`）をドラッグ&ドロップまたはファイルダイアログで開く
- GitHub 上の生 Markdown URL（`https://raw.githubusercontent.com/...`）を入力して取得・表示する
- コマンドライン引数としてファイルパスまたは URL を受け取る
  - `markdown-viewer path/to/file.md`
  - `markdown-viewer https://raw.githubusercontent.com/owner/repo/main/README.md`

### F-02: タイトルバー

- ウィンドウタイトルには現在開いているファイル名（またはURL末尾）を表示する  
  例: `README.md — Markdown Viewer`

### F-03: レイアウト（ペイン構成）

```
┌─────────────────────────────────────────────────────┐
│  [☀] [🔍]  README.md — Markdown Viewer             │  ← ツールバー
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  左ペイン    │  メインペイン（Markdown 表示）        │
│  (折りたたみ) │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

#### 左ペイン

- **折りたたみ可能**（トグルボタンで開閉、デフォルトは開いた状態）
- ローカルファイルを表示中：**フォルダ内の Markdown ファイル一覧**をツリー表示
- 常に：**現在のドキュメントの見出し構造（目次 / TOC）**をアウトライン表示
  - クリックで対応セクションへスクロール
  - ドキュメント内スクロール位置に応じてハイライトが連動する（スクロールスパイ）
- 上部にタブ or セグメント切り替え（「フォルダ」「目次」）で両機能を切り替える

#### メインペイン

- Markdown をレンダリングして表示
- 左右の余白（メインペインのパディング比率）をスライダーまたは設定値で変更可能
- 変更した比率はウィンドウサイズが変わっても維持される（比率固定・レスポンシブ）

### F-04: ダークモード / ライトモード

- 画面上部ツールバーの **☀ アイコン**をクリックすることでダーク・ノーマルをトグル切り替え
- 設定はアプリローカルに永続化（次回起動時も維持）
- スタイルは `github-markdown-css` のダーク・ライト両テーマを使用

### F-05: Markdown 拡張記法対応

以下の拡張記法をサポートする（`markdown-it` プラグインで実装）：

| 記法 | プラグイン例 |
|---|---|
| テーブル | `markdown-it` ビルトイン |
| タスクリスト (`- [ ]`) | `markdown-it-task-lists` |
| 脚注 | `markdown-it-footnote` |
| 数式（LaTeX）| `markdown-it-katex` または `markdown-it-mathjax` |
| シンタックスハイライト（コードブロック） | `highlight.js` |
| Mermaid 図 | `mermaid.js` |
| 打ち消し線 (`~~text~~`) | `markdown-it` ビルトイン（strikethrough） |
| 上付き・下付き文字 | `markdown-it-sup` / `markdown-it-sub` |
| コンテナ（カスタムブロック） | `markdown-it-container` |
| Frontmatter（YAML）| パース後は表示しない（メタ情報として扱う） |

### F-06: キーワード検索

- ツールバーの **🔍 アイコン**をクリックするとドキュメント内検索バーを表示
- 入力したキーワードにマッチする箇所をハイライト表示
- 「次へ（↓）」「前へ（↑）」での移動と、マッチ数の表示（例: `3 / 12`）
- `Escape` キーで閉じる
- 大文字・小文字を区別しない検索（オプションで区別可）

### F-07: ファイル変更の自動リロード

- ローカルファイルを表示中、OS のファイル監視（`fs.watch` / `notify`）で変更を検知
- 変更を検知したら**即座に**表示を更新する（ページを再読み込みするのではなく、差分更新を試みる）
- スクロール位置は可能な限り維持する

### F-08: マージンコントロール

- UI 上の設定でメインペインの左右マージン比率を調整できる（例: 0%〜30%）
- デフォルト: `8%`
- 設定値は永続化し、ウィンドウリサイズ時も比率を維持する

---

## UI / UX ガイドライン

### ツールバー（上部固定）

```
左端: [≡ サイドバー開閉] [← 戻る] [→ 進む]
右端: [📂 ファイルを開く] [🐙 GitHubリポジトリ] [🔍 検索] [☀/🌙 テーマ切替] [⚙ 設定]
```

- ボタンはアイコンのみ（ツールチップでラベルを表示）
- ツールバーの高さは最小限（36〜40px 程度）

### カラーテーマ

| モード | ベース | 参考 |
|---|---|---|
| ライト | `#ffffff` 背景 | GitHub Light |
| ダーク | `#0d1117` 背景 | GitHub Dark |

### フォント

- 本文: システムフォント（`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`）
- コードブロック: `"Cascadia Code", "Consolas", monospace`

---

## ディレクトリ構成（推奨）

```
markdown-viewer/
├── index.html                   # HTML エントリポイント
├── vite.config.ts               # Vite 設定
├── package.json                 # フロントエンド依存
├── src/                         # フロントエンドソース
│   ├── main.ts
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
│       ├── theme.ts             # テーマ切替ユーティリティ
│       ├── github.ts            # GitHub API ユーティリティ
│       └── pathUtils.ts         # ローカルパス解決ユーティリティ
├── src-tauri/                   # Rust バックエンド（Tauri）
│   ├── src/
│   │   ├── main.rs              # エントリポイント
│   │   └── lib.rs               # IPC コマンド・ファイル監視ロジック
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json         # IPC パーミッション定義
├── docs/
│   └── ARCHITECTURE.md         # アーキテクチャドキュメント
├── CONCEPT.md                   # 本ファイル
└── README.md
```

---

## 実装フェーズ

### Phase 1（MVP）✅ 完了

- [x] Tauri プロジェクトのセットアップ（Svelte + TypeScript テンプレート）
- [x] ローカルファイルを開いてレンダリングする基本機能
- [x] GitHub スタイル CSS の適用（ライト・ダーク両対応）
- [x] ダーク/ライトモード切り替え（☀ アイコン）
- [x] 左ペイン TOC の表示とスクロール連動
- [x] コマンドライン引数でファイルを開く
- [x] タイトルバーにファイル名表示
- [x] ファイル変更の自動リロード
- [x] 外部リンク（http/https）をシステムブラウザで開く（`tauri-plugin-opener`）
- [x] ファイルナビゲーション履歴（← 戻る / → 進む ボタン）

### Phase 2

- [x] フォルダ内ファイル一覧（左ペイン切り替えタブ）  
  → Rust の `list_md_files` コマンド（`std::fs::read_dir`）で列挙。`tauri-plugin-fs` 追加不要
- [x] キーワード検索（🔍）  
  → DOM ウォーカーを使ったテキストノード傍受方式。`<mark>` タグでハイライト
- [x] マージン比率設定（⚙ ボタン → スライダー）  
  → CSS カスタムプロパティ `--content-horiz-padding` を App.svelte で制御。localStorage 永続化
- [x] 拡張 Markdown 記法追加  
  → `markdown-it-task-lists`（タスクリスト）, `markdown-it-footnote`（脚注）
- [x] GitHub リポジトリURL からの取得・表示（オクトキャットボタン）  
  → GitHub API でデフォブランチ取得 → README.md 表示 → ファイルツリーをサイドバーに列挙  
  → `fetch()` + **DOMPurify** (`renderMarkdownSafe`) でサニタイズ済み  
  → 相対パスリンクは同リポジトリ内ファイルに遷移。ローカルリンクもパス解決して遷移
- [x] マルチウィンドウ対応（起動済みの場合は新ウィンドウ）→（実装断念・スコープ外）  

### Phase 3

- [x] Mermaid / KaTeX 対応  
  → `mermaid 11` + `@traptitech/markdown-it-katex 3` + `katex/dist/katex.min.css`  
  → Mermaid: `highlight()` で `<pre class="mermaid">` 生成 → `mermaid.run()` で描画。ダークモード切替時はテーマ変更後再描画  
  → KaTeX: インライン `$...$` / ブロック `$$...$$`
- [x] 検索の大文字小文字区別オプション  
  → `SearchBar` に `Aa` チェックボックスを追加。`applyHighlights()` に `caseSensitive` 引数追加
- [x] 自動アップデート（起動時バージョンチェック＆インストール）  
  → `tauri-plugin-updater` + `tauri-plugin-process` を使用  
  → 起動時に GitHub Releases の `latest.json` を参照してバージョン比較  
  → 新バージョンがある場合はダイアログ表示 → ユーザー確認後 `downloadAndInstall()` + `relaunch()`  
  → リリース時は `TAURI_SIGNING_PRIVATE_KEY` で署名し `latest.json` を自動生成（`tauri-apps/tauri-action`）
- [ ] 設定画面（UI）
- [ ] スタイルテーマの切り替え（将来拡張ポイント）

---

## 非機能要件

| 項目 | 目標値 |
|---|---|
| 起動時間 | 1 秒以内（ローカルファイル） |
| ファイル変更検知から再レンダリングまで | 300ms 以内 |
| インストーラーサイズ | 10MB 以下（目安） |
| 追加ランタイム（エンドユーザー） | なし（Windows 10/11 の場合） |

---

## 制約・注意事項

- GitHub URL からの取得は `https://raw.githubusercontent.com/` 形式の生テキスト URL のみサポート（初期バージョン）
- 相対パスで参照される画像はローカルファイル表示時のみレンダリング可能（リモート画像は URL で指定された場合のみ）
- フォルダ内ファイル一覧は `.md` / `.markdown` 拡張子のみを対象とする

---

## 開発時注意事項

### Windows ビルド環境

- `cargo tauri dev` 実行前に **`$env:CARGO_INCREMENTAL = "0"`** を設定すること  
  インクリメンタルビルドが有効だと `libwindows-*.rlib` の一時ファイルへのアクセスが競合し、OS error 32 が発生する場合がある。

### リンクの挙動

#### 外部リンク（http / https）
- Markdown 内の外部リンクをクリックすると WebView がそのサイトに遷移し、元のドキュメントに戻れなくなる問題が発生する
- `tauri-plugin-opener` を使用し、`MarkdownRenderer.svelte` 内でクリックイベントを傍受
  - `http://` / `https://` → `openUrl(href)` でシステムブラウザに委譲
  - `#anchor` → `scrollIntoView()` でスムーズスクロール（ページ内遷移）
  - その他の相対パス → `onOpenRelativeFile` コールバックで App.svelte に委譲
    - ローカルモード: `URL` コンストラクタで `file:///` ベースに解決 → `loadFile(resolvedPath)`
    - GitHub モード: `https://x/` ベースに解決 → `loadGithubFile(resolvedPath)`
    - `path#anchor` の形式も対応（ファイル読み込み後 150ms 待機してスクロール）

#### ファイル間ナビゲーション履歴
- ← / → ボタンでファイル閲覧履歴を前後移動できる
- `App.svelte` が `backHistory: HistoryEntry[]` / `forwardHistory: HistoryEntry[]` を管理
- `HistoryEntry` はローカルファイル (`type: "local"`) と GitHub モード (`type: "github"`) の両方を保持
- 新しいファイルを開いた際に現在ファイルを `backHistory` に積み、`forwardHistory` をリセット
- `loadFile(path, updateHistory = false)` 形式で履歴を使った移動時は履歴を変更しない

---

### セキュリティ

#### CSP（Content Security Policy）
- Tauri v2 は OS レベルでアクセス制御を行っており、WebView 内の CSP は任意設定
- `tauri.conf.json` の `security.csp` は **`null` のまま維持すること**  
  （`script-src 'self'` 等を設定すると Tauri が内部注入する IPC ブリッジがブロックされてアプリが起動しない）
- Phase 2 でリモートコンテンツを取得する場合は Tauri の capabilities で `http:default` 権限を付与して制御する

#### HTML サニタイズ
- ローカルファイルのみを表示する際は HTML サニタイズ不要（ユーザー自身のファイル）
- GitHub コンテンツ等リモートソースは **DOMPurify** でサニタイズ済み（`renderMarkdownSafe` を使用）  
  - `dompurify` インストール済み  
  - `MarkdownRenderer.svelte` の `sanitize` prop が `true` の時は `renderMarkdownSafe` を使用  
  - GitHub モード時は `App.svelte` が `sanitize={isGithubMode}` を自動設定

### notify クレートのデバウンス
- Windows では単一ファイルの保存でも `Modify` イベントが複数回発火することがある
- `lib.rs` の `watch_file` コマンドに 300ms のデバウンスを実装済み

### Svelte 5 Runes
- このプロジェクトは Svelte 5 の Runes API を使用（`$state`, `$derived`, `$effect`, `$props`）
- Options API（`onMount` を除く旧構文）は使用しないこと

---

## 参考リソース

- [Tauri v2 ドキュメント](https://tauri.app/v2/guide/)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [github-markdown-css](https://github.com/sindresorhus/github-markdown-css)
- [Svelte 5](https://svelte.dev/)
- [highlight.js](https://highlightjs.org/)
- [Mermaid.js](https://mermaid.js.org/)
