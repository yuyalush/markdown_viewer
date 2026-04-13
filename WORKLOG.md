# 作業履歴

このファイルはユーザーからの指示と実施した作業の履歴を記録するログです。

---

## 2026-03-30

### [3] GitHub Actions ビルドの macOS「壊れている」問題を調査・暫定対応（2026-03-30）

**指示**: GitHub Actions でコンパイルされた DMG が「壊れているため開けません」と表示される原因を調査してほしい

**原因**:
- macOS はインターネットからダウンロードしたファイルに `com.apple.quarantine` 拡張属性を付与する
- Gatekeeper はこの属性があるアプリの **コード署名** を検証する
- GitHub Actions ワークフローには Apple Developer 証明書（署名・ノータリゼーション）の設定がないため、未署名のまま配布されていた
- ローカルビルドは quarantine 属性が付かないため Gatekeeper チェックが入らず動作していた

**実施内容**:
- `.github/workflows/release.yml` のリリースノートに macOS ユーザー向け回避手順（`xattr -cr`）を追記
- 将来 Apple Developer 証明書取得時に有効化できる署名用シークレット設定をコメントとして追加

**作成・変更ファイル**:
- `.github/workflows/release.yml` — リリースノートに macOS 回避手順追記、署名設定コメントを追加

---

### [2] バージョン 0.1.3 へのバンプと macOS 対応リリースタグ（2026-03-30）

**指示**: コミットを 0.1.3 にして、macOS 版対応としてリリースタグをつけてほしい（0.1.2 から修正）

**実施内容**:
- `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` のバージョンを 0.1.1 → 0.1.3 に更新
- `git commit --amend` で直前のコミットを書き換え
- リモート・ローカルの `v0.1.2` タグを削除
- `v0.1.3` annotated タグを作成し `git push --force origin master` および `git push origin v0.1.3` を実行

**作成・変更ファイル**:
- `package.json` — version 0.1.3
- `src-tauri/Cargo.toml` — version 0.1.3
- `src-tauri/tauri.conf.json` — version 0.1.3

---

### [1] ローカル開発環境のセットアップ（2026-03-30）

**指示**: このリポジトリの開発を行えるように、ローカル環境を整備して

**実施内容**:
- Node.js 25.8.2 を Homebrew でインストール
- pnpm 10.33.0 を npm でグローバルインストール
- Rust toolchain 1.94.1 を rustup でインストール
- `pnpm install` で全 JS/TS 依存関係をインストール
- `cargo fetch` で Rust 依存クレートを取得、`cargo check` でコンパイルエラーなしを確認
- `pnpm test` 実行時に発覚した pathUtils のバグ（Unix パスで `//` になる問題）を合わせて修正
- 全30テスト通過を確認

**作成・変更ファイル**:
- `src/lib/pathUtils.ts` — Unix パスで `file:////` となる二重スラッシュバグを修正

---

## 2026-03-29

### [1] pathUtils.ts: macOS/Linux でパス先頭の "/" が欠落するバグを修正（2026-03-29）

**指示**: `resolveLocalPath` 関数において macOS/Linux 環境で相対パスを解決する際にパスの先頭の `/` が失われるバグを修正してほしい。

**実施内容**:
- `resolved.pathname.slice(1)` が Windows のドライブレター前の `/` 除去を意図していたが、Unix パスでも先頭 `/` を除去してしまっていた
- Windows ドライブレターパターン (`/^\/[A-Za-z]:\//`) に一致する場合のみ `slice(1)` を適用し、それ以外はそのまま返す形に修正
- Unix パスのテストケース（同一ディレクトリ・サブディレクトリ・親ディレクトリ）を `pathUtils.test.ts` に追加

**作成・変更ファイル**:
- `src/lib/pathUtils.ts` — `resolveLocalPath` の戻り値ロジックを修正
- `src/lib/__tests__/pathUtils.test.ts` — Unix パスのテストケースを追加

---



### [1] 相対パスSVG/画像が表示されない問題を修正（2026-03-29）

**指示**: `![サービスアーキテクチャ](architecture.svg)` のような相対パス画像が壊れたアイコンになるのを修正してほしい。

**実施内容**:
- 原因: `<img src="相対パス">` が Tauri アプリのオリジン基準で解決されるため、Markdown ファイルと同じフォルダにある実ファイルに到達できない
- `src-tauri/tauri.conf.json` の `app.security` に `assetProtocol`（`enable: true`, `scope: ["**"]`）を追加し、`asset://` プロトコルを有効化
- `src/App.svelte` の `<MarkdownRenderer>` に `currentFilePath={filePath}` prop を追加
- `src/lib/MarkdownRenderer.svelte` に以下を追加:
  - `convertFileSrc` を `@tauri-apps/api/core` からインポート
  - `resolveLocalPath` を `./pathUtils` からインポート
  - Props に `currentFilePath?: string | null` を追加
  - `$effect` を追加: `renderedHtml` / `currentFilePath` 変化時に `<img>` の相対パス src を絶対パスに解決し `convertFileSrc()` で `asset://` URL に変換
- SVG だけでなく PNG/JPG/GIF/WebP などすべてのローカル画像に対応
- 外部 URL (`http://`, `https://`)・データ URI (`data:`)・既変換済み (`asset://`) はスキップ

**作成・変更ファイル**:
- `src-tauri/tauri.conf.json` — `app.security.assetProtocol` セクションを追加
- `src/App.svelte` — `<MarkdownRenderer>` に `currentFilePath={filePath}` を追加
- `src/lib/MarkdownRenderer.svelte` — インポート追加・Props 追加・画像変換 `$effect` 追加

---

### [2] v0.1.0 リリースビルド作成（2026-03-29）

**指示**: リリースの作成を行ってください。

**実施内容**:
- `pnpm tauri build` を実行しリリースビルドを生成
- フロントエンド（Vite）のプロダクションビルド完了後、Rust releaseプロファイルでコンパイル
- MSI インストーラーおよび NSIS セットアップ EXE を生成

**作成・変更ファイル**:
- `src-tauri/target/release/markdown-viewer.exe` — リリース実行ファイル
- `src-tauri/target/release/bundle/msi/Markdown Viewer_0.1.0_x64_en-US.msi` — MSI インストーラー
- `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.0_x64-setup.exe` — NSIS セットアップ EXE

---

### [3] GitHub モード時の相対パス画像が表示されない問題を修正（2026-03-29）

**指示**: GitHub リポジトリを指定して表示したとき、Markdown 内の相対パス画像（例: `docs/architecture.svg`）が表示されなかった。GitHub 上のリンクが `https://github.com/.../blob/main/docs/architecture.svg`（HTML ページ）になっており、SVG バイナリが取得できていなかった。

**実施内容**:
- 原因: GitHub モード時は `currentFilePath` が `null` のため既存のローカル画像変換 `$effect` が動作せず、相対 src が未解決のまま残っていた
- `src/lib/MarkdownRenderer.svelte` に GitHub モード専用の画像変換 `$effect` を追加:
  - Props に `githubInfo` と `githubCurrentPath` を追加
  - `resolveGithubPath` で現在のファイルパス基準に相対パスを解決し、`buildRawUrl` で `raw.githubusercontent.com` URL を生成して `img.src` に設定
- `src/App.svelte` の `<MarkdownRenderer>` に `githubInfo` / `githubCurrentPath` props を追加

**作成・変更ファイル**:
- `src/lib/MarkdownRenderer.svelte` — Props 追加・GitHub 画像変換 `$effect` 追加・`github.ts` からのインポート追加
- `src/App.svelte` — `<MarkdownRenderer>` に `githubInfo` / `githubCurrentPath` props を渡すよう変更

---

### [4] テスト環境のセットアップ（2026-03-29）

**指示**: テスト用の準備をしてください。

**実施内容**:
- Vitest (v4) および happy-dom を devDependencies に追加
- `vite.config.ts` に `test` セクションを追加（environment: happy-dom、css: false）
- `package.json` に `test` / `test:watch` スクリプトを追加
- 以下の純粋関数を対象にユニットテストを作成（合計 27 テスト、全 PASS）:
  - `pathUtils.ts` → `resolveLocalPath` (5 テスト)
  - `github.ts` → `parseGitHubUrl`, `resolveGithubPath`, `buildRawUrl` (11 テスト)
  - `markdownParser.ts` → `renderMarkdown`, `renderMarkdownSafe` (11 テスト)
- GitHub 画像修正シナリオ（README.md 内の `docs/architecture.svg` → raw URL 変換）も専用テストで検証

**作成・変更ファイル**:
- `vite.config.ts` — Vitest 設定追加（import も `vitest/config` に変更）
- `package.json` — `test` / `test:watch` スクリプト追加・vitest / happy-dom を devDependencies に追加
- `src/lib/__tests__/pathUtils.test.ts` — 新規作成
- `src/lib/__tests__/github.test.ts` — 新規作成
- `src/lib/__tests__/markdownParser.test.ts` — 新規作成

---

### [5] v0.1.1 リリースビルド作成（2026-03-29）

**指示**: 改めてリリースの作成を行ってください。

**実施内容**:
- `package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` のバージョンを `0.1.0` → `0.1.1` に更新
- `pnpm test` で 27 テスト全 PASS を確認後にリリースビルドを実行
- フロントエンド（Vite）プロダクションビルド完了
- Rust release プロファイルでコンパイル完了（約 1 分 47 秒）
- MSI インストーラーおよび NSIS セットアップ EXE を生成

**作成・変更ファイル**:
- `package.json` — バージョン `0.1.1` に更新
- `src-tauri/Cargo.toml` — バージョン `0.1.1` に更新
- `src-tauri/tauri.conf.json` — バージョン `0.1.1` に更新
- `src-tauri/target/release/markdown-viewer.exe` — リリース実行ファイル
- `src-tauri/target/release/bundle/msi/Markdown Viewer_0.1.1_x64_en-US.msi` — MSI インストーラー
- `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.1_x64-setup.exe` — NSIS セットアップ EXE

---

### [6] v0.1.1 ARM64 リリースビルド作成（2026-03-29）

**指示**: ARM64 版のリリース作成も実施してください。

**実施内容**:
- `rustup target add aarch64-pc-windows-msvc` で ARM64 Rust ターゲットを追加
- VS Build Tools に ARM64 クロスコンパイルツール（`Microsoft.VisualStudio.Component.VC.Tools.ARM64`）を追加インストール（vs_installer.exe modify コマンドで）
- `pnpm tauri build --target aarch64-pc-windows-msvc` で ARM64 向けリリースビルドを実行
- Rust release プロファイルでクロスコンパイル完了（約 54 秒）
- MSI インストーラーおよび NSIS セットアップ EXE を生成

**作成・変更ファイル**:
- `src-tauri/target/aarch64-pc-windows-msvc/release/markdown-viewer.exe` — ARM64 リリース実行ファイル
- `src-tauri/target/aarch64-pc-windows-msvc/release/bundle/msi/Markdown Viewer_0.1.1_arm64_en-US.msi` — ARM64 MSI インストーラー
- `src-tauri/target/aarch64-pc-windows-msvc/release/bundle/nsis/Markdown Viewer_0.1.1_arm64-setup.exe` — ARM64 NSIS セットアップ EXE

---

### [7] GitHub Actions リリース自動化 & v0.1.1 公開（2026-03-29）

**指示**: x86_64 版と ARM64 版の二つをリリースタグ付け時に自動公開できるようにし、v0.1.1 を両プラットフォーム対応として公開してほしい。

**実施内容**:
- `.github/workflows/release.yml` を作成（`v*` タグ push 時に x64・ARM64 を並列ビルドして GitHub Release に自動添付）
- `tauri-apps/tauri-action@v0` を使用、matrix で `x86_64-pc-windows-msvc` と `aarch64-pc-windows-msvc` を並列実行
- ワークフローをコミットして `master` に push
- `v0.1.1` タグを push して GitHub Actions を起動
- ローカルビルド済み成果物（4ファイル）を `gh release create` で即時公開
- リリース URL: https://github.com/yuyalush/markdown_viewer/releases/tag/v0.1.1

**公開アセット**:
- `Markdown.Viewer_0.1.1_x64_en-US.msi` (5.00 MiB)
- `Markdown.Viewer_0.1.1_x64-setup.exe` (3.95 MiB)
- `Markdown.Viewer_0.1.1_arm64_en-US.msi` (4.85 MiB)
- `Markdown.Viewer_0.1.1_arm64-setup.exe` (3.74 MiB)

**作成・変更ファイル**:
- `.github/workflows/release.yml` — 新規作成（タグ push 時の x64/ARM64 自動リリースワークフロー）


### [8] MacOS向けリリース対応（2026-03-29）

**指示**: release.ymlにmacOSターゲット（x86_64-apple-darwin、aarch64-apple-darwin）を追加してほしい

**実施内容**:
- `.github/workflows/release.yml` のmatrixにmacOSターゲット2種を追加
- releaseBodyのインストール方法テーブルにmacOS向け行を追加

**作成・変更ファイル**:
- `.github/workflows/release.yml` — macOSターゲット（Intel/Apple Silicon）をmatrixとリリースノートに追加

---

## 2026-03-26

### [1] 開発環境セットアップ（2026-03-26）

**指示**: コンパイルできるように環境のセットアップをしてください。

**実施内容**:
- `pnpm 10.33.0` を npm グローバルインストール
- `rustup 1.29.0` + `Rust stable 1.94.0 (aarch64-pc-windows-msvc)` を winget でインストール
- Rust ツールチェーンの部分インストール問題を `rustup update stable` で修復
- Visual Studio Build Tools 2022 を winget でインストール（VCTools ワークロード込み）
- Visual Studio Installer で `Microsoft.VisualStudio.Component.VC.Tools.ARM64` を追加インストール（ARM64 ライブラリ取得）
- LLVM 22.1.1 を winget でインストール（`lld-link.exe` リンカー取得）
- `~/.cargo/config.toml` と `src-tauri/.cargo/config.toml` に ARM64 向け lld-link リンカーを設定
- `package.json` に `pnpm.onlyBuiltDependencies: ["esbuild"]` を追加（esbuild ビルドスクリプト承認）
- `pnpm install` で全 npm 依存パッケージをインストール
- `pnpm tauri build` でビルド成功を確認

**ビルド成果物**:
- `src-tauri/target/release/bundle/msi/Markdown Viewer_0.1.0_arm64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.0_arm64-setup.exe`

**作成・変更ファイル**:
- `package.json` — pnpm.onlyBuiltDependencies を追加
- `src-tauri/.cargo/config.toml` — ARM64 リンカー設定を追加（新規作成）
- `~/.cargo/config.toml` — ARM64/x64 リンカーパスを設定
- `dev-setup.ps1` — ビルド環境変数をセットアップするスクリプト（新規作成）

---

### [2] ARM64/Intel 共存開発対応（2026-03-26）

**指示**: ARM64/Intel 両環境での同時開発を考慮した対応を実施。

**実施内容**:
- `src-tauri/.cargo/config.toml` を `.gitignore` に追加（マシン固有のリンカーパスをリポジトリから除外）
- `src-tauri/.cargo/config.toml.example` を新規作成（ARM64 リンカー設定のテンプレートとしてコミット対象に）
- `dev-setup.ps1` を `dev-setup-arm64.ps1` にリネームし内容を汎用化
  - `vswhere.exe` + `Microsoft.VCToolsVersion.default.txt` で MSVC バージョンを動的検索
  - Windows SDK バージョンも動的検索（ハードコード廃止）
  - LLVM インストール先を複数候補から自動探索（OneDrive パス含む）
  - ユーザー名のハードコードを廃止
- `README.md` に「ARM64 (Windows on ARM) 環境でのビルド」セクションを追加

**コミット対象まとめ**:
- ✅ `package.json` — esbuild ビルドスクリプト承認設定
- ✅ `WORKLOG.md` — 作業ログ
- ✅ `dev-setup-arm64.ps1` — ARM64 専用セットアップスクリプト（汎用化済み）
- ✅ `src-tauri/.cargo/config.toml.example` — リンカー設定テンプレート
- ✅ `.gitignore` — `src-tauri/.cargo/config.toml` を追加
- ✅ `README.md` — ARM64 ビルド手順を追記
- ❌ `src-tauri/.cargo/config.toml` — マシン固有のため .gitignore で除外

**作成・変更ファイル**:
- `dev-setup-arm64.ps1` — 新規作成（旧 dev-setup.ps1 をリネーム・汎用化）
- `src-tauri/.cargo/config.toml.example` — 新規作成（ARM64 リンカー設定テンプレート）
- `.gitignore` — `src-tauri/.cargo/config.toml` を追加
- `README.md` — ARM64 ビルド手順セクションを追加

---

## 2026-03-24

### [12] アイコンが白い四角になる問題の修正（2026-03-24）

**指示**: インストーラーを実行してインストールすると exe のアイコンが白い四角のままだった

**原因**: Windows アイコンキャッシュ問題
- アイコンなし版（Phase 4）の初回インストール時にデフォルト（白）アイコンがキャッシュされた
- 再インストールしてもキャッシュが更新されず白いままになる

**実施内容**:
- `src-tauri/icons/icon.ico` の内容を確認 → ピクセル色が正しい（R=28 G=61 B=80 のダークティール）ことを確認
- `tauri.conf.json` の `bundle.icon` を Tauri 推奨の複数ファイル指定に更新
  - 変更前: `["icons/icon.ico"]` のみ
  - 変更後: `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico` を列挙
- `pnpm tauri icon icon_source.png` で全アイコンファイルを再生成
- `pnpm tauri build` でリビルド → EXE にアイコンが正しく埋め込まれることを確認
  - `ExtractAssociatedIcon` で corner pixel = R=28 G=61 B=80 ✓

**作成・変更ファイル**:
- `src-tauri/tauri.conf.json` — bundle.icon を推奨マルチファイル形式に更新

---

### [11] アプリアイコン作成・リビルド（2026-03-24）

**指示**: リリース exe にアイコンがないので、コンセプトを表すアイコンを作成してほしい

**実施内容**:
- `make_icon.ps1` を作成（PowerShell + System.Drawing で 1024×1024 PNG を生成）
  - デザイン: ダークティール背景 (#1C3D51)、白いドキュメント、ティール "#" 文字（Markdown 見出し記号）、テキスト行群
- `powershell -ExecutionPolicy Bypass -File make_icon.ps1` で `icon_source.png` を生成・確認
- `pnpm tauri icon icon_source.png` で全形式アイコンを自動生成
  - Windows: `icon.ico`、macOS: `icon.icns`、Linux: `icon.png`
  - 各サイズ PNG: 32×32, 64×64, 128×128, 128×128@2x
  - iOS / Android / Windows Appx 向け各サイズも生成
- `pnpm tauri build` でアイコン組み込み済みのリリースビルドを再実行
  - `Markdown Viewer_0.1.0_x64-setup.exe` / `Markdown Viewer_0.1.0_x64_en-US.msi` を更新

**作成・変更ファイル**:
- `make_icon.ps1` — 新規: アイコン生成スクリプト
- `icon_source.png` — 新規: 生成したアイコンソース画像
- `src-tauri/icons/` — 全形式アイコンを更新・追加

---

### [10] リリースビルド（2026-03-24）

**指示**: リリース用インストーラーのビルド

**実施内容**:
- `$env:CARGO_INCREMENTAL = "0"` を設定の上 `pnpm tauri build` を実行
- Vite でフロントエンドをビルド、Cargo でリリースプロファイルの Rust バイナリを生成
- WiX で MSI、NSIS で exe インストーラーを生成

**作成・変更ファイル**:
- `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.0_x64-setup.exe` — 約 3.9 MB
- `src-tauri/target/release/bundle/msi/Markdown Viewer_0.1.0_x64_en-US.msi` — 約 4.9 MB

---

### [9] README作成・ドキュメントレビュー・GitHub登録前準備（2026-03-24）

**指示**: README作成、ドキュメントレビュー（WORKLOG以外）、GitHubリポジトリ登録準備

**実施内容**:
- `CONCEPT.md` の誤り 3 箇所を修正
  - ディレクトリ構成を実際の実装（`lib.rs` 単一ファイル・`src/lib/github.ts` 等）に合わせて更新
  - Toolbar 仕様に `📂 ファイルを開く` と `🐙 GitHubリポジトリ` ボタンを追記（実装済みなのに仕様書から漏れていた）
  - `backHistory: string[]` → `backHistory: HistoryEntry[]` に型を修正
- `README.md` を新規作成（機能一覧・インストール手順・使い方・ファイル構成・ライブラリ一覧）
- `.gitignore` に `.playwright-mcp/` / `.env` / `.vscode/settings.json` を追加
- `.gitattributes` を新規作成（`* text=auto eol=lf` でLF統一・バイナリファイル宣言）
- `git init` でリポジトリを初期化し、38ファイルで初回コミット `feat: initial commit` を作成

**作成・変更ファイル**:
- `CONCEPT.md` — ディレクトリ構成・Toolbar仕様・backHistoryの型記述を修正
- `README.md` — 新規作成
- `.gitignore` — 追記補完
- `.gitattributes` — 新規作成（行末コード統一）

---

### [8] 全体リファクタリング・アーキテクチャドキュメント作成（2026-03-24）

**指示**: 基本機能実装完了後の全体リファクタリングと、技術ドキュメント（アーキテクチャ）の作成

**実施内容**:
- `src-tauri/Cargo.toml` から未使用の `serde`・`serde_json` 依存を削除
- GitHub API ユーティリティを `src/lib/github.ts` に分離抽出
  - `parseGitHubUrl`, `resolveGithubPath`, `buildRawUrl`, `fetchDefaultBranch`, `fetchMdFilePaths`, `fetchReadme`
  - 型定義 `GitHubRepoInfo`・API レスポンス型も同ファイルで管理
- ローカルパス解決を `src/lib/pathUtils.ts` に抽出
  - `resolveLocalPath`（Windows / Unix 両対応）
- `App.svelte` を新モジュールを使うよう更新し、インライン定義のユーティリティ関数を削除
- `openGithubRepo` の履歴バグを修正
  - GitHub リポジトリ取得が失敗したとき `backHistory` / `forwardHistory` が書き換わったままになるバグ
  - 事前保存 → 失敗時に復元する実装に変更
- `fetchReadme` でデフォルト README 検索ロジックを `github.ts` に集約
  - `README.md`, `readme.md`, `Readme.md`, `README.markdown` を順に試す
- `docs/ARCHITECTURE.md` 新規作成（コンポーネント構成・IPC・状態管理・データフロー・セキュリティ方針を網羅）

**作成・変更ファイル**:
- `src-tauri/Cargo.toml` — serde / serde_json 依存削除
- `src/lib/github.ts` — 新規: GitHub API ユーティリティモジュール
- `src/lib/pathUtils.ts` — 新規: ローカルパス解決ユーティリティ
- `src/App.svelte` — 新モジュールを import、ローカルユーティリティ関数削除、履歴バグ修正
- `docs/ARCHITECTURE.md` — 新規: アーキテクチャドキュメント

---

### [1] コンセプトファイルの作成

**指示**: Windows 環境で Markdown ファイルを集中して読むための専用ビューアアプリのコンセプトをファイルにまとめる。要件は以下の通り：
- 軽量、ローカルファイル・GitHub 上のドキュメントに対応
- 折りたためる左ペイン（ドキュメント構造・フォルダ内ファイル一覧）
- GitHub スタイルで表示（ダーク/ノーマルモード切り替えを初期バージョンから実装）
- 拡張 Markdown 記法に対応
- 画面上部の虫眼鏡アイコンでキーワード検索
- コマンドライン引数でファイルを開く（起動済みの場合は新ウィンドウ）
- タイトル部分に開いているファイル名を表示
- ファイル更新時に表示を即時反映
- 左右空白の比率をウィンドウサイズに対して維持
- 追加ランタイムのインストールを最小化
- ソースコード量が最も少なくなる開発言語を選択

**実施内容**:
- `CONCEPT.md` を新規作成
- 推奨技術スタックとして **Tauri v2 + TypeScript + Svelte** を選定・記載
  - Windows 10/11 プリインストールの WebView2 を活用することで追加ランタイム不要
  - Svelte によりコンポーネント記述量を最小化
  - markdown-it エコシステムで拡張記法対応
- 機能要件 F-01〜F-08 として全要件を構造化
- UI/UX ガイドライン（ツールバー構成、カラーテーマ、フォント）を定義
- 推奨ディレクトリ構成を記載
- Phase 1（MVP）/ Phase 2 / Phase 3 の 3 段階の実装計画を策定
- 非機能要件（起動時間・変更検知速度・インストーラーサイズ等）を定義

**作成ファイル**:
- `CONCEPT.md`

---

### [2] 開発環境のセットアップ確認・構築

**指示**: ローカルの開発環境に必要なセットアップがなされているかを確認し、不足しているものはセットアップすること。

**調査結果（インストール前）**:

| コンポーネント | 状態 |
|---|---|
| Node.js v22.19.0 | ✅ インストール済み |
| npm 10.9.3 | ✅ インストール済み |
| WebView2 146.0 | ✅ インストール済み（Windows 同梱）|
| winget v1.28.220 | ✅ 利用可能 |
| Rust / rustup | ❌ 未インストール |
| Visual Studio C++ Build Tools | ❌ 未インストール |
| pnpm | ❌ 未インストール |

**実施内容**:

1. **Visual Studio 2022 Build Tools（C++ ワークロード付き）をインストール**
   - コマンド: `winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"`
   - バージョン: 17.14.28
   - Rust on Windows に必要な MSVC リンカー・C++ ツールチェーン一式を導入

2. **Rust（rustup）をインストール**
   - コマンド: `winget install Rustlang.Rustup`
   - rustup 1.29.0 をインストール
   - ツールチェーン本体が破損状態だったため以下の手順で復旧：
     - 破損ディレクトリを手動削除
     - `rustup toolchain install stable` で完全再インストール
   - 結果: `rustc 1.94.0` / `cargo 1.94.0` が正常動作を確認

3. **pnpm をインストール**
   - コマンド: `npm install -g pnpm`
   - バージョン: 10.32.1

4. **Tauri CLI v2 をインストール**
   - コマンド: `cargo install tauri-cli --version "^2" --locked`
   - バージョン: tauri-cli 2.10.1
   - インストール時に `x86_64-pc-windows-msvc` ターゲットの標準ライブラリが不足していたため `rustup target add` で追加してから再実行

**インストール後の環境**:

| コンポーネント | バージョン |
|---|---|
| Node.js | v22.19.0 |
| npm | 10.9.3 |
| pnpm | 10.32.1 |
| rustc | 1.94.0 |
| cargo | 1.94.0 |
| Tauri CLI | 2.10.1 |
| WebView2 | 146.0.3856.78 |
| VS2022 Build Tools | 17.14.28 |

---

---

### [3] copilot-instructions.md の作成（2026-03-24）

**指示**: CONCEPT.md への準拠と WORKLOG.md の更新を GitHub Copilot に常時強制する仕組みを作成すること。

**実施内容**:
- `.github/copilot-instructions.md` の仕組み（リポジトリ内全チャットに自動適用）を説明
- CONCEPT.md 準拠・WORKLOG.md 更新フォーマット・開発全般ルールを記載した指示ファイルを作成

**作成・変更ファイル**:
- `.github/copilot-instructions.md` — 新規作成（Copilot 共通指示）

---

### [4] Phase 1（MVP）実装（2026-03-24）

**指示**: CONCEPT.md の実装フェーズ Phase 1 を実施すること。

**実施内容**:
- Tauri v2 + Svelte 5 + TypeScript のプロジェクトを手動スキャフォールド（create-tauri-app は既存ディレクトリへの展開に対話が必要なため手動作成）
- フロントエンド依存パッケージインストール（pnpm）
- Vite フロントエンドビルド確認（EXIT:0）
- Rust バックエンド `cargo check` 成功確認
- `cargo tauri dev` によるアプリ起動確認（`Running target\debug\markdown-viewer.exe`）
- Windows Defender によるファイルロック問題は `CARGO_INCREMENTAL=0` で回避

**Phase 1 実装内容（CONCEPT.md 準拠）**:
- `package.json` / `vite.config.ts` / `svelte.config.js` / `tsconfig.json` / `index.html` — プロジェクト設定
- `src-tauri/Cargo.toml` — `tauri v2` + `tauri-plugin-dialog` + `notify v6` 依存
- `src-tauri/src/lib.rs` — `read_file` / `get_cli_open_path` / `watch_file` Rust コマンド
- `src-tauri/src/main.rs` — エントリポイント
- `src-tauri/tauri.conf.json` + `capabilities/default.json` — Tauri v2 設定
- `src/main.ts` — Svelte 5 マウントポイント
- `src/App.svelte` — レイアウト・ファイル開閉・ドラッグ&ドロップ・CLI引数対応・ファイル変更自動リロード
- `src/lib/Toolbar.svelte` — ツールバー（サイドバー開閉・テーマ切替・ファイル開く）
- `src/lib/Sidebar.svelte` — TOC サイドペイン（スクロールスパイ連動）
- `src/lib/MarkdownRenderer.svelte` — Markdown レンダリング・IntersectionObserver による見出し追跡
- `src/lib/markdownParser.ts` — markdown-it + markdown-it-anchor + highlight.js
- `src/lib/theme.ts` — github-markdown-css ライト/ダーク CSS 動的切替
- `src/styles/app.css` — CSS カスタムプロパティによるテーマ定義
- `src-tauri/icons/icon.ico` — 最小 ICO ファイル（tauri-build の Windows 要件）
- `.gitignore` — target / node_modules 除外

**作成・変更ファイル**:
- `package.json` — 新規作成
- `vite.config.ts` — 新規作成
- `svelte.config.js` — 新規作成
- `tsconfig.json` — 新規作成
- `index.html` — 新規作成
- `.gitignore` — 新規作成
- `src/main.ts` — 新規作成
- `src/App.svelte` — 新規作成
- `src/lib/Toolbar.svelte` — 新規作成
- `src/lib/Sidebar.svelte` — 新規作成
- `src/lib/MarkdownRenderer.svelte` — 新規作成
- `src/lib/markdownParser.ts` — 新規作成
- `src/lib/theme.ts` — 新規作成
- `src/styles/app.css` — 新規作成
- `src-tauri/Cargo.toml` — 新規作成
- `src-tauri/build.rs` — 新規作成
- `src-tauri/tauri.conf.json` — 新規作成
- `src-tauri/capabilities/default.json` — 新規作成
- `src-tauri/src/main.rs` — 新規作成
- `src-tauri/src/lib.rs` — 新規作成
- `src-tauri/icons/icon.ico` — 新規作成（最小 1x1px アイコン）

**備考（次回以降の開発用）**:
- `cargo tauri dev` 実行時は `CARGO_INCREMENTAL=0` を設定すると Windows のファイルロックエラーを回避できる
- 初回ビルドは Rust クレートのコンパイルで約 5 分かかる（2 回目以降は差分ビルドで数十秒）

---

## 次のステップ（予定）

- [ ] Phase 2 実装（フォルダファイル一覧・キーワード検索・マージン比率設定・GitHub URL対応・マルチウィンドウ）

---

### [5] コードレビューと品質改善（2026-03-24）

**指示**: Phase 1 実装分をレビューし、以降の実装がよく行えるように修正・リファクタリングなど品質向上を実施。コンセプトへの追記も必要に応じて実施。

**発見した問題点**:
1. **バグ**: 別ファイルを開く際にも前ファイルのスクロール位置を復元していた（新ファイルはトップに戻すべき）
2. **エラー処理不足**: `loadFile` / `reloadContent` でエラーを握りつぶしていた（ユーザーに通知されない）
3. **DRY 違反**: `loadFile` とファイル変更ハンドラで同じスクロール保持ロジックが重複していた
4. **セキュリティ**: `tauri.conf.json` の CSP が `null`（無効化）され、XSS リスクがあった
5. **Windows notify 重複イベント**: `watch_file` でデバウンスが未実装なため、1 回の保存で複数リロードが発生することがあった
6. **型安全性**: ドラッグ&ドロップのペイロード型アサーション (`as { paths?: string[] }`) が不正確だった
7. **冗長処理**: `MarkdownRenderer.svelte` で `markdown-it-anchor` が設定した heading ID を無条件に上書きしていた
8. **バンドルアイコン未設定**: `tauri.conf.json` の `bundle.icon` が空配列だった

**実施内容**:
- `src-tauri/src/lib.rs`: `Arc<Mutex<Instant>>` による 300ms デバウンスを実装
- `src/App.svelte`:
  - `reloadContent()` ヘルパー関数を抽出して DRY 化
  - `loadFile()` に try-catch を追加し、エラーを `errorMessage` ステートで UI 表示
  - 新規ファイルオープン時はスクロール位置を 0 にリセット
  - file-changed リスナーを `reloadContent()` 呼び出しに簡略化
  - ドラッグ&ドロップ型を `"paths" in event.payload` ガードで安全化
  - エラーバナー UI を追加（`role="alert"`、ダークモード対応）
- `src/lib/MarkdownRenderer.svelte`: `markdown-it-anchor` が設定した ID を尊重し、未設定の場合のみフォールバック ID を割り当て
- `src-tauri/tauri.conf.json`:
  - CSP を設定（`style-src 'unsafe-inline'`, `img-src * data: blob:`）
  - `bundle.icon` に `icons/icon.ico` を追加
- `src/styles/app.css`: エラーバナー用 CSS カスタムプロパティ追加（`--error-bg`, `--error-color`, `--error-border`、ダーク/ライト両対応）
- `CONCEPT.md`:
  - Phase 1 チェックリストを完了マークに更新
  - Phase 2 に技術的補足（DOMPurify, connect-src, plugin-fs, AppHandle）を追記
  - 「開発時注意事項」セクションを新設（CARGO_INCREMENTAL=0、CSP、HTML サニタイズ、notify デバウンス、Svelte 5 Runes）

**変更ファイル**:
- `src-tauri/src/lib.rs` — notify デバウンス追加
- `src/App.svelte` — エラー処理、DRY化、スクロール修正、ドラッグ型修正、エラーバナー追加
- `src/lib/MarkdownRenderer.svelte` — anchor ID 活用
- `src-tauri/tauri.conf.json` — CSP 設定、bundle.icon 追加
- `src/styles/app.css` — エラーバナー CSS 変数追加
- `CONCEPT.md` — Phase 1 完了記録、Phase 2 技術補足、開発時注意事項追記

---

### [6] 外部リンクのシステムブラウザ開き・ファイルナビゲーション履歴（2026-03-24）

**指示**: Markdown 内の外部リンクをクリックすると WebView がそのページに遷移してしまい操作が詰んでしまう問題の修正。加えてファイル間の前後ナビゲーション履歴（← 戻る / → 進む）を実装。

**実施内容**:
- `tauri-plugin-opener` を導入し、外部 URL をシステムブラウザで開けるようにした
- `MarkdownRenderer.svelte` に外部リンク傍受 `$effect` を追加
  - `http://` / `https://` リンク → `e.preventDefault()` + `openUrl(href)` でシステムブラウザに委譲
  - `#anchor` リンク → `e.preventDefault()` + `scrollIntoView` でページ内スムーズスクロール
  - その他の相対リンク → `e.preventDefault()` で WebView ナビゲーションを防止
- `App.svelte` にファイルナビゲーション履歴を追加
  - `backHistory: string[]` / `forwardHistory: string[]` ステート
  - `canGoBack` / `canGoForward` derived
  - `loadFile(path, updateHistory = true)` に引数を追加 — 新規ファイルを開くときのみ履歴スタックを更新し前進履歴をリセット
  - `goBack()` / `goForward()` 関数（`updateHistory = false` で呼び出し）
- `Toolbar.svelte` に `←` `→` ボタンを追加
  - 新 props: `canGoBack`, `canGoForward`, `onGoBack`, `onGoForward`
  - disabled 時の opacity スタイル追加（0.35 + cursor: default）

**作成・変更ファイル**:
- `src-tauri/Cargo.toml` — `tauri-plugin-opener = "2"` 追加
- `src-tauri/src/lib.rs` — `.plugin(tauri_plugin_opener::init())` 追加
- `src-tauri/capabilities/default.json` — `"opener:default"` 追加
- `package.json` — `"@tauri-apps/plugin-opener": "^2"` 追加
- `src/lib/MarkdownRenderer.svelte` — `openUrl` インポート・外部リンク傍受 `$effect` 追加
- `src/App.svelte` — 履歴ステート・`loadFile` updateHistory 引数・`goBack`/`goForward` 追加
- `src/lib/Toolbar.svelte` — 戻る/進むボタン・disabled スタイル追加

---

### [7] CONCEPT.md 更新・sample.md 作成・Phase 2 実装（2026-03-24）

**指示**: 外部ファイル表示と ← → ナビゲーションについて CONCEPT.md に追記。表示確認用 sample.md を作成。Phase 2 開発（キーワード検索・フォルダファイル一覧・マージン調整・拡張 MD 記法）を実施。

**実施内容**:

1. **CONCEPT.md 追記**
   - Phase 1 チェックリストに「外部リンクをシステムブラウザで開く」「ファイルナビゲーション履歴」を追加
   - リンク挙動（外部リンク / アンカーリンク / 相対パス）の技術説明セクションを追加
   - ファイルナビゲーション履歴の実装詳細を追記
   - Phase 2 の各項目に実装方針メモを追記

2. **sample.md 作成**
   - 基本記法: 見出し H1-H6・テキスト装飾（太字/斜体/打ち消し）・リンク（内部/外部/アンカー）・画像
   - リスト: 順序なし・順序付き・ネスト
   - タスクリスト（`- [ ]` / `- [x]`）
   - コードブロック（TypeScript / Rust / JSON / Bash）
   - 引用（単一/ネスト/コードブロック混在）
   - テーブル（左揃え/右揃え/中央揃え）
   - 脚注・HTML 混在（details/summary, カラーテキスト, 装飾 div）
   - 自動リンク変換の確認項目

3. **Phase 2: 拡張 Markdown 記法**
   - `markdown-it-task-lists` + `markdown-it-footnote` を pnpm でインストール
   - `markdownParser.ts` に `.use(taskLists)` / `.use(footnote)` を追加

4. **Phase 2: キーワード検索**
   - `src/lib/SearchBar.svelte` を新規作成
     - 入力フィールド + マッチカウント表示 (N/M) + ↑↓ ボタン + ✕ クローズ
     - Enter で次へ、Shift+Enter で前へ、Escape で閉じる
   - `MarkdownRenderer.svelte` に検索ハイライト機能を追加
     - `applyHighlights()`: DOM Walker でテキストノードを `<mark class="sh">` でラップ
     - `goToNextMatch()` / `goToPrevMatch()` を export
     - `searchQuery` が変わるたびに再ハイライト
     - ハイライト CSS: 通常（#ffe566）/ カレント（#ff9a1f + outline）/ ダークモード対応

5. **Phase 2: フォルダ内ファイル一覧**
   - Rust `list_md_files(dir)` コマンドを追加（`std::fs::read_dir`、追加 plugin 不要）
   - `Sidebar.svelte` を「目次」/「ファイル」2タブ構成に変更
     - ファイルタブ: 同フォルダの .md/.markdown を一覧表示、クリックで開く
     - 現在開いているファイルをハイライト表示

6. **Phase 2: マージン比率設定**
   - `App.svelte` に `contentPadding` state（デフォルト 8%）を追加、localStorage 永続化
   - `<div class="app">` に `--content-horiz-padding` CSS 変数を注入
   - `MarkdownRenderer.svelte` の `.scroll-container` padding を `1.5rem var(--content-horiz-padding, 8%)` に変更
   - ツールバーの ⚙ ボタンで設定バーを開閉
   - 設定バーにスライダー（0%〜25%）を配置

7. **Toolbar 更新**
   - 🔍（検索トグル）・⚙（設定トグル）ボタンを追加
   - アクティブ状態の CSS `.active` スタイルを追加

**作成・変更ファイル**:
- `CONCEPT.md` — Phase 1 完了追加・Phase 2 詳細化・リンク挙動・ナビ履歴セクション追記
- `sample.md` — 新規作成（Markdown 全記法サンプル）
- `package.json` — `markdown-it-task-lists`, `markdown-it-footnote` 追加
- `src/lib/markdownParser.ts` — taskLists + footnote プラグイン追加
- `src-tauri/src/lib.rs` — `list_md_files` コマンド追加
- `src/lib/SearchBar.svelte` — 新規作成
- `src/lib/Toolbar.svelte` — 🔍・⚙ ボタンと active スタイル追加
- `src/lib/Sidebar.svelte` — タブ UI（目次/ファイル）・ファイル一覧機能追加
- `src/lib/MarkdownRenderer.svelte` — 検索ハイライト機能・CSS変数パディング対応
- `src/lib/MarkdownRenderer.svelte` — 検索ハイライト機能・CSS変数パディング対応
- `src/App.svelte` — 検索/設定 state・SearchBar/SettingsBar 統合・新プロパティ接続
- `src/styles/app.css` — `--settings-bg`・`--settings-border` CSS 変数追加

---

### [1] 相対パスリンク修正・GitHub 機能実装（2026-03-24）

**指示**: ドキュメント内の相対パスリンク（例: `ch05.md`）をクリックしても画面が変わらない問題を修正。GitHub リポジトリを閲覧できる機能（オクトキャットボタン → URL 入力 → README 表示 + ファイル一覧）を実装。

**実施内容**:

1. **相対パスリンクのナビゲーション修正** (`MarkdownRenderer.svelte`)
   - これまでは相対パス href に対して `preventDefault()` のみで終了していた
   - `onOpenRelativeFile?: (href: string) => void` prop を追加
   - 相対パスクリック時に `onOpenRelativeFile?.(href)` を呼び出すよう変更
   - App.svelte 側の `handleOpenRelativeFile` でローカルパス / GitHub パスを分岐して解決

2. **相対パス解決ユーティリティ** (`App.svelte`)
   - `resolveLocalPath(currentFilePath, href)`: Windows パス対応（`file:///C:/...` URL トリックで `../` 等を正確に解決）
   - `resolveGithubPath(currentPath, href)`: `https://x/` ベース URL トリックでリポジトリ内の相対パスを解決
   - `href` に `#` フラグメントが含まれる場合はファイル読み込み後 150ms で `scrollIntoView` を実行

3. **DOMPurify 導入** (XSS 対策)
   - `pnpm add dompurify @types/dompurify`
   - `markdownParser.ts` に `renderMarkdownSafe(content)` を追加（DOMPurify.sanitize 済み）
   - `MarkdownRenderer.svelte` に `sanitize?: boolean` prop を追加
   - GitHub モード時は `sanitize={true}` を渡して `renderMarkdownSafe` を使用
   - ローカルファイルは従来通り `renderMarkdown` を使用

4. **GitHub 機能実装**
   - `src/lib/GitHubDialog.svelte` を新規作成（URL 入力モーダル）
     - URL バリデーション（`github.com/owner/repo` 形式チェック）
     - Enter で確定、Escape でキャンセル、onMount で自動フォーカス
   - `Toolbar.svelte` にオクトキャット（GitHub Invertocat SVG）ボタンを追加
     - 📂 と 🔍 の間に配置。GitHub モード時は `active` スタイル表示
   - `App.svelte` に GitHub 状態管理と取得関数を追加
     - `openGithubRepo(url)`: API でデフォルトブランチ取得 → README.md + ファイルツリーを並列 fetch
     - `loadGithubFile(path)`: raw.githubusercontent.com から指定ファイルを取得
     - GitHub モード移行時にローカルファイル監視は無効化（`filePath = null`）
     - ローカルファイルを開いた際は自動的に GitHub モードから脱出
   - `Sidebar.svelte` に `githubFiles`, `githubCurrentPath`, `githubRepoLabel` props を追加
     - GitHub モード時はリポジトリ内の .md/.markdown ファイル一覧を表示
     - リポジトリ名ラベル（`📦 owner/repo`）を表示
     - ローカルファイル一覧との切り替えはフラグではなく `githubFiles !== undefined` で判定

**作成・変更ファイル**:
- `src/lib/GitHubDialog.svelte` — 新規作成
- `src/lib/markdownParser.ts` — DOMPurify import・`renderMarkdownSafe` 追加
- `src/lib/MarkdownRenderer.svelte` — `sanitize`・`onOpenRelativeFile` props 追加・リンクハンドラ更新
- `src/lib/Toolbar.svelte` — GitHub ボタン（SVG）・`isGithubMode`・`onOpenGithubRepo` props 追加
- `src/lib/Sidebar.svelte` — GitHub モード対応（`githubFiles`・`githubCurrentPath`・`githubRepoLabel` props）
- `src/App.svelte` — GitHub 状態管理・取得関数・相対パス解決・GitHubDialog 統合
- `CONCEPT.md` — Phase 2 GitHub 機能を完了マーク・リンク挙動・サニタイズ説明を更新

### [2] Phase 3 実装（KaTeX・Mermaid・検索大文字小文字・マルチウィンドウ）（2026-03-24）

**指示**: Phase 3 の開発。Mermaid・KaTeX・検索の大文字小文字区別・マルチウィンドウ対応の実装。スタイルテーマはスキップ。sample.md にも Mermaid/KaTeX 記法を追加。

**実施内容**:
- `@traptitech/markdown-it-katex` + `katex` + `mermaid` を pnpm インストール
- KaTeX: markdownParser.ts に katexPlugin 追加・`katex/dist/katex.min.css` import
- Mermaid: `highlight()` で `lang === "mermaid"` を `<pre class="mermaid">` に変換。MarkdownRenderer.svelte で `mermaid.initialize()` + `mermaid.run()` の `$effect` を追加（renderedHtml 変化時・darkMode 変化時の2つ）
- 検索大文字小文字区別: SearchBar.svelte に `caseSensitive` prop と `Aa` チェックボックスを追加。MarkdownRenderer.svelte の `applyHighlights()` に `caseSensitive` 引数追加。App.svelte に `searchCaseSensitive` ステートを追加して接続
- マルチウィンドウ: Toolbar.svelte に「新しいウィンドウで開く」ボタン追加（現在ファイルがある場合のみ有効）。App.svelte に `openInNewWindow()` 関数を追加（`WebviewWindow` API 使用、URL ハッシュ `#file=...` でパスを渡す）。onMount でハッシュからのパス読み込みを追加
- sample.md に「数式（KaTeX）」「Mermaid 図（フローチャート・シーケンス図・状態遷移図）」セクションを追加

**作成・変更ファイル**:
- `src/lib/markdownParser.ts` — katexPlugin + katex CSS + Mermaid highlight ハンドラ追加
- `src/lib/MarkdownRenderer.svelte` — mermaid import・darkMode prop・2つの Mermaid $effect・searchCaseSensitive prop・applyHighlights caseSensitive 対応
- `src/lib/SearchBar.svelte` — caseSensitive prop + Aa チェックボックス UI 追加
- `src/lib/Toolbar.svelte` — hasFile prop + onOpenFileInNewWindow prop + 新規ウィンドウボタン追加
- `src/App.svelte` — WebviewWindow import・openInNewWindow 関数・searchCaseSensitive ステート・onMount でハッシュ読み込み追加
- `sample.md` — KaTeX 数式・Mermaid 図の3例を追加
- `CONCEPT.md` — Phase 2 マルチウィンドウ・Phase 3 の各項目を完了マークに更新

### [3] マルチウィンドウのバグ修正（2026-03-24）

**指示**: 「新しいウィンドウで開く」ボタンを押しても動かない

**原因**:
- JS 側の `new WebviewWindow(...)` は capabilities に `core:webview:allow-create-webview-window` が必要だが未設定
- `capabilities/default.json` の `windows: ["main"]` のみで、新ウィンドウに capabilities が適用されていなかった

**実施内容**:
- Rust 側に `open_new_window(path, encoded_path)` コマンドを追加（`WebviewWindowBuilder` でウィンドウ作成）
- `generate_handler!` に `open_new_window` を追加
- `capabilities/default.json` の `windows` に `"viewer-*"` を追加（新ウィンドウでも invoke・opener 等が動くように）
- `App.svelte` の `openInNewWindow` を `invoke("open_new_window", ...)` 方式に変更し、`WebviewWindow` import を削除

**作成・変更ファイル**:
- `src-tauri/src/lib.rs` — `open_new_window` コマンド追加
- `src-tauri/capabilities/default.json` — `windows` に `"viewer-*"` を追加
- `src/App.svelte` — `openInNewWindow` を invoke 方式に変更・`WebviewWindow` import 削除

### [4] マルチウィンドウ表示不具合の根本修正（2026-03-24）

**指示**: 新しいウィンドウで開くで開いたウィンドウが何も表示されない・閉じない・元ウィンドウを閉じるとハングアップする

**原因**:
- `WebviewUrl::App("index.html#file=...")` の `#` が PathBuf に入ると URL フラグメントではなく PATH の一部（`%23` にエンコード）となり、空白ページが読み込まれていた
- 空白ウィンドウが残り続けるため Tauri ランタイムが終了できずハングアップ
- `WatcherState` が単一 `Option<RecommendedWatcher>` のため 2つ目のウィンドウが `watch_file` を呼ぶと 1つ目のウォッチャーが上書きされる

**実施内容**:
- `PendingFiles` 状態（`Mutex<HashMap<String, String>>`）を追加し、ウィンドウラベルをキーとしてファイルパスを一時保管する方式に変更
- `open_new_window` コマンド: URL にファイルパスを含めず `"index.html"` のみ。代わりに `PendingFiles` にパスを格納
- `get_initial_file(label)` コマンドを追加。JS 起動時にウィンドウラベルを指定して取得・削除
- `WatcherState` を `Mutex<HashMap<String, RecommendedWatcher>>` に変更（ウィンドウごと独立した監視）
- `watch_file` コマンドに `window_label: String` 引数を追加。HashMap に格納してウィンドウ間で上書きされないように
- `App.svelte`: `watch_file` invoke に `windowLabel` を追加。URL ハッシュ方式を廃止し `get_initial_file` 呼び出しに変更
- `App.svelte`: `openInNewWindow` から `encodedPath` 引数を削除しシンプル化

**作成・変更ファイル**:
- `src-tauri/src/lib.rs` — WatcherState HashMap 化・PendingFiles 追加・open_new_window 修正・get_initial_file 追加・watch_file に window_label 追加
- `src/App.svelte` — get_initial_file 呼び出し・watch_file に windowLabel 追加・openInNewWindow 簡略化

### [5] マルチウィンドウ白画面の根本修正（2026-03-24）

**指示**: 新しいウィンドウで開くと真っ白になる・元ウィンドウを閉じるとハングアップする

**根本原因**:
- `WebviewUrl::App("index.html")` は dev モードでも本番の `dist/` フォルダを参照することがある
- `dist/` フォルダがない/古い場合、新規ウィンドウが 404 または空ページになり JS が動かない（白画面）
- JS が未起動のウィンドウはクリーンアップできず、親ウィンドウを閉じると Tauri がハングアップ

**修正内容**:
- Rust の `option_env!("TAURI_DEV_URL")` を使い、`cargo tauri dev` 時にコンパイル時バインドされる Vite dev server URL を明示的に使用
- dev モード: `WebviewUrl::External("http://localhost:1420")` → Vite dev server を確実に参照
- 本番ビルド: `WebviewUrl::App("index.html")` → 通常通り asset protocol を使用
- `Cargo.toml` に `url = "2"` を追加（`url::Url` 型のため）
- `App.svelte` の onMount 非同期処理を try-catch でラップしてエラーをコンソール出力

**作成・変更ファイル**:
- `src-tauri/Cargo.toml` — `url = "2"` 追加
- `src-tauri/src/lib.rs` — `use url::Url` 追加・`open_new_window` で `option_env!("TAURI_DEV_URL")` 使用
- `src/App.svelte` — onMount 非同期ブロックに try-catch 追加

### [7] マルチウィンドウ機能の削除（2026-03-24）

**指示**: マルチウィンドウ表示の問題が解決できないため、機能ごと削除してほしい

**実施内容**:
- マルチウィンドウ関連コードをすべてのファイルから削除
- Rust コマンド `open_new_window` の削除、`base64` クレートの削除
- Toolbar の「新しいウィンドウで開く」ボタン削除
- `App.svelte` の `openInNewWindow` 関数・base64デコードブロック・Toolbar props 削除
- `capabilities/default.json` の `viewer-*` ウィンドウ設定を削除
- `CONCEPT.md` のマルチウィンドウ記述を「実装断念・スコープ外」に更新

**作成・変更ファイル**:
- `src-tauri/Cargo.toml` — `base64 = "0.22"` 削除
- `src-tauri/src/lib.rs` — `use base64::`・`open_new_window` 関数全体・generate_handler エントリ削除
- `src-tauri/capabilities/default.json` — `"viewer-*"` 削除、`"windows": ["main"]` に戻す
- `src/lib/Toolbar.svelte` — `hasFile` / `onOpenFileInNewWindow` Props と新ウィンドウボタン削除
- `src/App.svelte` — `openInNewWindow` 関数・onMount の base64デコードブロック・Toolbar props 削除
- `CONCEPT.md` — マルチウィンドウ記述を「実装断念・スコープ外」に変更

---

### [6] マルチウィンドウ: IPC非依存のbase64ラベル方式に変更（2026-03-24）

**指示**: 新しいウィンドウで開くと真っ白・閉じない・ハングアップが3回の修正後も再現

**根本的な変更**:
- PendingFiles / get_initial_file / option_env! など全てのIPC依存の仕組みを廃止
- ウィンドウラベル自体にファイルパスをURL-safe base64でエンコードして埋め込む方式に変更
  - Rust: `URL_SAFE_NO_PAD.encode(path.as_bytes())` → label = `viewer-{base64}`
  - JS: `atob()` + `TextDecoder` でラベルからパスをデコード → IPC不要
- これにより「IPC接続が確立する前に invoke が呼ばれる」タイミング問題が根本解消
- デバッグビルド時は新規ウィンドウのDevToolsを自動起動 (`win.open_devtools()`)

**変更ファイル**:
- `src-tauri/Cargo.toml` - `url="2"` を削除、`base64="0.22"` を追加
- `src-tauri/src/lib.rs` - PendingFiles/get_initial_file/option_env!削除、base64ラベル方式に変更、devtools自動起動追加
- `src/App.svelte` - get_initial_fileのIPC呼び出しを廃止、ラベルから直接デコードに変更


---

## 2026-04-13

### [1] M365 Copilot ペインの試験実装（2026-04-13）

**指示**: 現在の画面構成に独立したペインを追加し、M365 Copilot を表示させる試験実装

**実施内容**:
- `src-tauri/Cargo.toml` に `url = "2"` 依存と tauri の `"unstable"` フィーチャを追加（子 webview API に必要）
- `src-tauri/src/lib.rs` に 3 つの Tauri コマンドを追加
  - `open_copilot_pane(x, y, width, height)` — 子 webview を作成して M365 Copilot を表示
  - `close_copilot_pane()` — 子 webview を閉じる
  - `resize_copilot_pane(x, y, width, height)` — 子 webview の位置・サイズを更新
- `src/lib/CopilotPane.svelte` を新規作成 — ペインのヘッダ UI と子 webview のライフサイクル管理
- `src/lib/Toolbar.svelte` に Copilot トグルボタン（時計アイコン）を追加
- `src/App.svelte` に `copilotOpen` 状態管理・`toggleCopilot()` 関数・localStorage 永続化を追加

**作成・変更ファイル**:
- `src-tauri/Cargo.toml` — `url = "2"` 追加、tauri `"unstable"` フィーチャ追加
- `src-tauri/src/lib.rs` — `open_copilot_pane` / `close_copilot_pane` / `resize_copilot_pane` コマンド追加
- `src/lib/CopilotPane.svelte` — 新規作成（Copilot ペインコンポーネント）
- `src/lib/Toolbar.svelte` — `copilotOpen` prop・`onToggleCopilot` コールバック・ボタン追加
- `src/App.svelte` — `copilotOpen` 状態・`toggleCopilot()` 関数・`CopilotPane` レンダリング追加
