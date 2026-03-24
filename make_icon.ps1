Add-Type -AssemblyName System.Drawing

$S = 1024
$canvas = New-Object System.Drawing.Bitmap($S, $S, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx = [System.Drawing.Graphics]::FromImage($canvas)
$gfx.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$gfx.Clear([System.Drawing.Color]::Transparent)

# ---- ヘルパー: 角丸矩形パスを作る ----
function New-RR([int]$x,[int]$y,[int]$w,[int]$h,[int]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x,          $y,          $r*2,$r*2, 180, 90)
    $p.AddArc($x+$w-$r*2,  $y,          $r*2,$r*2, 270, 90)
    $p.AddArc($x+$w-$r*2,  $y+$h-$r*2,  $r*2,$r*2,   0, 90)
    $p.AddArc($x,          $y+$h-$r*2,  $r*2,$r*2,  90, 90)
    $p.CloseFigure()
    return $p
}
function C([int]$r,[int]$g,[int]$b,[int]$a=255) {
    [System.Drawing.Color]::FromArgb($a,$r,$g,$b)
}
function Br($c) { New-Object System.Drawing.SolidBrush($c) }

# ==================================================
# 1. 背景: 深いティール (#1C3D51) 角丸
# ==================================================
$gfx.FillPath((Br (C 28 61 80)),  (New-RR 0 0 $S $S 210))

# ==================================================
# 2. ページの影 (半透明の黒をオフセット)
# ==================================================
$gfx.FillPath((Br (C 0 0 0 60)),  (New-RR 222 188 600 690 52))

# ==================================================
# 3. ページ本体: オフホワイト
# ==================================================
$gfx.FillPath((Br (C 246 248 250)), (New-RR 208 172 600 690 52))

# ---- ページ上部のアクセントバー (折り目表現) ----
$gfx.FillPath((Br (C 78 201 176)), (New-RR 208 172 600 18 6))

# ==================================================
# 4. "#" シンボル: Markdown 見出しの象徴
#    フォント: Consolas Bold, Em=290px
#    矩形: ページ上半分に収める
# ==================================================
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment     = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$hashFont = New-Object System.Drawing.Font("Consolas", 290,
    [System.Drawing.FontStyle]::Bold,
    [System.Drawing.GraphicsUnit]::Pixel)
$hashRect = [System.Drawing.RectangleF]::new(208, 185, 600, 355)
$gfx.DrawString("#", $hashFont, (Br (C 78 201 176)), $hashRect, $sfCenter)

# ==================================================
# 5. 区切り線
# ==================================================
$gfx.FillRectangle((Br (C 210 222 232)), (New-Object System.Drawing.Rectangle(258, 556, 500, 7)))

# ==================================================
# 6. テキスト行 (コンテンツを示す擬似行)
# ==================================================
$lineBr = Br (C 178 196 210)
# 行1: 太め (見出し2 相当)
$gfx.FillPath(  (Br (C 120 180 210)), (New-RR 258 578 340 30 15))
# 行2〜5: 本文
@(
    @(258, 624, 490, 26),
    @(258, 668, 380, 26),
    @(258, 712, 450, 26),
    @(258, 756, 310, 26),
    @(258, 800, 420, 26)
) | ForEach-Object {
    $gfx.FillPath($lineBr, (New-RR $_[0] $_[1] $_[2] $_[3] 13))
}

# ==================================================
# 保存
# ==================================================
$outPath = "C:\Users\yuyoshi\code\markdown_viewer\icon_source.png"
$canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$gfx.Dispose()
$canvas.Dispose()
Write-Host "✓ icon_source.png を生成しました: $outPath"
