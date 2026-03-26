# ARM64 Windows 向けビルド環境セットアップスクリプト
# Intel/x64 環境では不要です。ARM64 (Windows on ARM) マシンでのみ実行してください。
#
# 使い方（ドット ソースで実行）:
#   . .\dev-setup-arm64.ps1
#
# 前提条件（一度だけインストール）:
#   winget install Rustlang.Rustup
#   rustup toolchain install stable
#   rustup target add aarch64-pc-windows-msvc
#   winget install Microsoft.VisualStudio.2022.BuildTools `
#     --override "--add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.VC.Tools.ARM64 --includeRecommended"
#   winget install LLVM.LLVM

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- vswhere で VS Build Tools のインストール先を動的に取得 ---
$vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vswhere)) {
    Write-Error "vswhere.exe が見つかりません。Visual Studio Build Tools をインストールしてください。"
    return
}

$vsInstallPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.ARM64 -property installationPath
if (-not $vsInstallPath) {
    Write-Error "VC Tools ARM64 コンポーネントが見つかりません。`nVisual Studio Installer で 'C++ ARM64 ビルドツール' を追加してください。"
    return
}

# MSVC ツールバージョンを動的に取得（最新を選択）
$vcVersionFile = Join-Path $vsInstallPath "VC\Auxiliary\Build\Microsoft.VCToolsVersion.default.txt"
if (-not (Test-Path $vcVersionFile)) {
    Write-Error "MSVC バージョンファイルが見つかりません: $vcVersionFile"
    return
}
$vcVersion = (Get-Content $vcVersionFile).Trim()
$vctools = Join-Path $vsInstallPath "VC\Tools\MSVC\$vcVersion"

# Windows SDK バージョンを動的に取得（最新を選択）
$sdkRoot = "C:\Program Files (x86)\Windows Kits\10\lib"
$sdkVersion = Get-ChildItem $sdkRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty Name
if (-not $sdkVersion) {
    Write-Error "Windows SDK が見つかりません: $sdkRoot"
    return
}
$winsdk = Join-Path $sdkRoot $sdkVersion

# LLVM の場所を検索（インストール先がマシンによって異なるため ORDER で探索）
$llvmCandidates = @(
    "C:\Program Files\LLVM\bin",
    "C:\Program Files (x86)\LLVM\bin",
    (Join-Path $env:USERPROFILE "OneDrive - Microsoft\Documents\LLVM\bin"),
    (Join-Path $env:USERPROFILE "LLVM\bin"),
    (Join-Path $env:LOCALAPPDATA "Programs\LLVM\bin")
)
$llvmbin = $llvmCandidates | Where-Object { Test-Path (Join-Path $_ "lld-link.exe") } | Select-Object -First 1
if (-not $llvmbin) {
    Write-Error "lld-link.exe が見つかりません。`n'winget install LLVM.LLVM' でインストールしてから再実行してください。"
    return
}

# --- 環境変数を設定 ---
$sdkIncludeRoot = "C:\Program Files (x86)\Windows Kits\10\include\$sdkVersion"
$env:LIB     = "$vctools\lib\arm64;$winsdk\ucrt\arm64;$winsdk\um\arm64"
$env:INCLUDE = "$vctools\include;$sdkIncludeRoot\ucrt;$sdkIncludeRoot\um;$sdkIncludeRoot\shared;$sdkIncludeRoot\winrt"
$env:PATH    = "$llvmbin;$env:USERPROFILE\.cargo\bin;$env:PATH"

# --- ~/.cargo/config.toml に ARM64 リンカーを設定 ---
$cargoConfigDir = Join-Path $env:USERPROFILE ".cargo"
if (-not (Test-Path $cargoConfigDir)) { New-Item $cargoConfigDir -ItemType Directory | Out-Null }

$lldLinkPath = (Join-Path $llvmbin "lld-link.exe").Replace("\", "\\")
$cargoConfig = @"
[target.aarch64-pc-windows-msvc]
linker = "$lldLinkPath"
"@
$cargoConfig | Set-Content (Join-Path $cargoConfigDir "config.toml")

# --- 完了メッセージ ---
Write-Host ""
Write-Host "ARM64 ビルド環境をセットアップしました。" -ForegroundColor Green
Write-Host "  MSVC : $vctools"
Write-Host "  SDK  : $winsdk"
Write-Host "  LLVM : $llvmbin"
Write-Host "  Rust : $(& "$env:USERPROFILE\.cargo\bin\rustc.exe" --version)"
Write-Host ""
Write-Host "ビルドコマンド:"
Write-Host "  pnpm tauri dev      # 開発サーバー起動"
Write-Host "  pnpm tauri build    # リリースビルド"
Write-Host ""
Write-Host "注意: このスクリプトはカレントシェルの環境変数を変更します。"
Write-Host "      新しいターミナルを開くたびに再実行してください（または PROFILE に追記）。"
