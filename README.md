# Markdown Viewer

軽量デスクトップ Markdown ビューア。ローカルファイルの閲覧・自動リロードと、GitHub リポジトリのオンライン閲覧を GitHub スタイルで快適に行うことに特化したアプリです。
Windows版（Intel64版、ARM64版）とMacOS版（Intel版、ARM版）のリリースを行っています。
当リポジトリの右側にあるReleaseよりインストーラー形式をダウンロードできます。

このアプリケーションは**Tauri v2 + Svelte 5 + TypeScript + Rust** で構築されています。

---

## 主な機能

| 機能 | 説明 |
|---|---|
| ローカルファイルを開く | ファイルダイアログ・ドラッグ&ドロップ・CLI 引数に対応 |
| 自動リロード | ファイル変更を検知し即座に再描画（スクロール位置を保持） |
| GitHub リポジトリ閲覧 | リポジトリ URL を入力するだけで README・全 .md ファイルを閲覧 |
| 目次（TOC） | 見出し構造をサイドバーに表示。スクロールに連動してハイライト |
| フォルダ内ファイル一覧 | 同フォルダの `.md` ファイルをサイドバーに一覧表示 |
| ドキュメント内検索 | キーワードをハイライト表示。大文字小文字区別オプション付き |
| ナビゲーション履歴 | ← / → ボタンでファイル閲覧履歴を前後移動 |
| ダーク / ライトモード | GitHub スタイルの両テーマをワンクリックで切替・永続化 |
| マージン設定 | メインペインの左右余白比率をスライダーで調整・永続化 |
| KaTeX 数式 | インライン `$...$` / ブロック `$$...$$` に対応 |
| Mermaid 図表 | コードブロック ` ```mermaid ` で図表を描画 |
| 拡張 Markdown | タスクリスト・脚注・シンタックスハイライトをサポート |

---

## スクリーンショット

> *（リリース後に追加予定）*

---

## インストール・ビルド

### エンドユーザー向け

- Windows 10 / 11 では追加ランタイムのインストール不要（WebView2 はプリインストール済み）
- [Releases](https://github.com/yourname/markdown-viewer/releases) からインストーラーをダウンロードしてください

### 開発者向けビルド

**前提条件:**
- [Rust](https://rustup.rs/) ツールチェーン
- [Node.js](https://nodejs.org/)（v18以上）
- [pnpm](https://pnpm.io/)

```bash
# 依存パッケージのインストール
pnpm install

# 開発サーバー起動（ホットリロード）
# Windows では環境変数の設定が必要
$env:CARGO_INCREMENTAL = "0"
pnpm tauri dev

# ファイルを指定して起動
pnpm tauri dev -- -- path/to/file.md

# プロダクションビルド
$env:CARGO_INCREMENTAL = "0"
pnpm tauri build
```

> **Windows ビルドの注意点:**  
> `CARGO_INCREMENTAL=0` を設定しないとインクリメンタルビルドで OS error 32 が発生する場合があります。

### ARM64 (Windows on ARM) 環境でのビルド

Snapdragon X / Copilot+ PC など ARM64 Windows でビルドする場合、追加のセットアップが必要です。

**追加で必要なツール:**

| ツール | インストールコマンド |
|---|---|
| VS Build Tools 2022 (C++ ARM64) | `winget install Microsoft.VisualStudio.2022.BuildTools` |
| VS ARM64 ライブラリ | VS Installer で `Microsoft.VisualStudio.Component.VC.Tools.ARM64` を追加 |
| LLVM (`lld-link`) | `winget install LLVM.LLVM` |

**ビルド手順:**

```powershell
# 1. セットアップスクリプトを実行（ターミナルを開くたびに必要）
. .\dev-setup-arm64.ps1

# 2. 通常通りビルド
pnpm tauri dev
pnpm tauri build
```

> **仕組み:** ARM64 Windows には MSVC のネイティブ ARM64 リンカーが標準添付されていないため、
> LLVM の `lld-link.exe` を代替リンカーとして使用します。
> `dev-setup-arm64.ps1` がビルド環境変数と `~/.cargo/config.toml` を自動設定します。
>
> `src-tauri/.cargo/config.toml` はマシン固有設定のため `.gitignore` に含まれています。
> 設定例は [`src-tauri/.cargo/config.toml.example`](src-tauri/.cargo/config.toml.example) を参照してください。

---

## 使い方

### ファイルを開く

- ツールバーの **📂** ボタン → ファイルダイアログ
- ウィンドウにファイルを**ドラッグ&ドロップ**
- コマンドライン引数: `markdown-viewer path/to/file.md`

### GitHub リポジトリを閲覧する

1. ツールバーの **🐙（オクトキャット）ボタン**をクリック
2. GitHub リポジトリ URL を入力（例: `https://github.com/owner/repo`）
3. README.md が自動表示され、左サイドバーに全 `.md` ファイルが一覧表示される

### キーボードショートカット

| キー | 動作 |
|---|---|
| `Ctrl+F` 相当 | ツールバーの 🔍 ボタンで検索バーを開く |
| `Enter` | 次の検索結果へ |
| `Shift+Enter` | 前の検索結果へ |
| `Esc` | 検索バーを閉じる |

---

## プロジェクト構成

```
markdown-viewer/
├── index.html                   # HTML エントリポイント
├── vite.config.ts               # Vite 設定
├── package.json                 # フロントエンド依存
├── src/                         # フロントエンドソース（Svelte + TypeScript）
│   ├── main.ts                  # Svelte マウントエントリ
│   ├── App.svelte               # ルートコンポーネント（状態管理・業務ロジック）
│   ├── styles/
│   │   └── app.css              # グローバルスタイル・CSS カスタムプロパティ（テーマ変数）
│   └── lib/
│       ├── Toolbar.svelte       # 上部ツールバー（ナビゲーション・ツールボタン）
│       ├── Sidebar.svelte       # 左サイドバー（TOC タブ / ファイル一覧タブ）
│       ├── MarkdownRenderer.svelte  # Markdown レンダリング・検索・Mermaid
│       ├── SearchBar.svelte     # ドキュメント内検索バー
│       ├── GitHubDialog.svelte  # GitHub URL 入力モーダルダイアログ
│       ├── markdownParser.ts    # markdown-it 設定・KaTeX・拡張プラグイン
│       ├── theme.ts             # ライト/ダークテーマ切替ユーティリティ
│       ├── github.ts            # GitHub API ユーティリティ（fetch・URL解決）
│       └── pathUtils.ts         # ローカルファイルパス解決（Windows対応）
├── src-tauri/                   # Rust バックエンド（Tauri）
│   ├── src/
│   │   ├── main.rs              # エントリポイント
│   │   └── lib.rs               # IPC コマンド定義・ファイル監視（notify クレート）
│   ├── Cargo.toml               # Rust 依存
│   ├── tauri.conf.json          # Tauri アプリ設定
│   └── capabilities/
│       └── default.json         # IPC パーミッション定義
├── docs/
│   └── ARCHITECTURE.md         # アーキテクチャ詳細ドキュメント
├── sample.md                    # 表示確認用サンプルファイル
└── CONCEPT.md                   # 設計コンセプト・開発指示書
```

### 主要ファイルの説明

#### `src/App.svelte`
アプリの中核コンポーネント。すべての状態（`$state`）を保持し、コンポーネント間のデータフローを一元管理します。ローカルファイルオープン・GitHub リポジトリ読み込み・ナビゲーション履歴・ファイル自動リロードのロジックを担います。

#### `src/lib/MarkdownRenderer.svelte`
Markdown の HTML レンダリングと、それに付随するインタラクションをすべて担うコンポーネントです。`$effect` を使って以下を非同期処理します：
- 見出し収集 + IntersectionObserver によるスクロールスパイ
- テキストノードウォーカーによる検索ハイライト
- `mermaid.run()` による Mermaid 図表の描画

#### `src-tauri/src/lib.rs`
Rust バックエンドの IPC コマンド定義。以下の 4 コマンドを提供します:
- `read_file` — ファイル読み込み
- `get_cli_open_path` — CLI 引数のパス取得
- `watch_file` — ファイル変更監視（300ms デバウンス付き）
- `list_md_files` — フォルダ内 `.md` ファイル一覧取得

#### `src/lib/markdownParser.ts`
markdown-it に KaTeX・タスクリスト・脚注・シンタックスハイライト などのプラグインを組み込んだパーサ設定。GitHub などリモートコンテンツ用の DOMPurify サニタイズ版 (`renderMarkdownSafe`) も提供します。

#### `src/lib/github.ts`
GitHub API ユーティリティ。リポジトリ情報取得・ファイルツリー取得・README 取得・パス解決などの関数を提供します。

#### `src/styles/app.css`
CSS カスタムプロパティによるテーマトークン定義（ライト/ダーク両モード対応）とグローバルリセット。

---

## 使用ライブラリ

| ライブラリ | 用途 |
|---|---|
| [Tauri v2](https://tauri.app/) | デスクトップシェル（Rust + WebView2） |
| [Svelte 5](https://svelte.dev/) | UIフレームワーク（Runes API） |
| [markdown-it](https://github.com/markdown-it/markdown-it) | Markdown パーサ |
| [highlight.js](https://highlightjs.org/) | シンタックスハイライト |
| [KaTeX](https://katex.org/) | 数式レンダリング |
| [Mermaid](https://mermaid.js.org/) | 図表レンダリング |
| [DOMPurify](https://github.com/cure53/DOMPurify) | XSS サニタイズ（リモートコンテンツ用） |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | GitHub スタイル CSS |
| [notify](https://github.com/notify-rs/notify) | OS ネイティブファイル監視（Rust） |

---

## ドキュメント

- [CONCEPT.md](CONCEPT.md) — 設計コンセプト・機能要件・開発指示書
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — アーキテクチャ詳細（コンポーネント構成・IPC・データフロー）

---

## ライセンス

MIT
