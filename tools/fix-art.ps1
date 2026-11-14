<#
  OUTLOOK SAGA — art checker / fixer (Windows, nothing to install)
  -----------------------------------------------------------------
  Right-click this file -> "Run with PowerShell"   (or: powershell -ExecutionPolicy Bypass -File tools\fix-art.ps1)

  For every .png in /assets it:
    1. FIXES files that aren't really PNGs (e.g. an iPhone/iPad .heic renamed to .png):
       converts them to real PNGs, keeping the original in /_art-backup.
       (Needs the "HEIF Image Extensions" from the Microsoft Store for .heic files.)
    2. WARNS about images whose corners are solid white/opaque, which usually means
       the background wasn't removed (see "Exporting art" in README.md).
       Opaque is fine for wallpaper / backgrounds / frames.

  It never changes the pixels of your drawing, only the file format.
#>
Add-Type -AssemblyName PresentationCore
$root    = Split-Path -Parent $PSScriptRoot
$assets  = Join-Path $root 'assets'
$backup  = Join-Path $root '_art-backup'
$pngMagic = [byte[]](0x89, 0x50, 0x4E, 0x47)
# Files that are SUPPOSED to be fully opaque (no warning for them)
$opaqueOk = @('wallpaper.png', 'title-background.png', 'bluescreen.png', 'window-frame.png',
              'popup-frame.png', 'titlebar.png', 'taskbar.png', 'tray.png', 'input-box.png')

function Read-Frame($path) {
  $s = [System.IO.File]::OpenRead($path)
  try {
    $d = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,
      [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
      [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
    return $d.Frames[0]
  } finally { $s.Close() }
}

$fixed = 0; $warned = 0
Get-ChildItem $assets -Filter *.png | ForEach-Object {
  $file = $_
  $head = [byte[]](Get-Content $file.FullName -Encoding Byte -TotalCount 4)
  $isPng = ($head.Length -eq 4) -and (@(Compare-Object $head $pngMagic -SyncWindow 0).Length -eq 0)

  try { $frame = Read-Frame $file.FullName }
  catch { Write-Host "  CAN'T READ  $($file.Name)  (unknown format, re-export it as PNG)" -ForegroundColor Red; return }

  if (-not $isPng) {
    New-Item -ItemType Directory -Force $backup | Out-Null
    Copy-Item $file.FullName (Join-Path $backup $file.Name) -Force
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($frame))
    $out = [System.IO.File]::Create($file.FullName); $enc.Save($out); $out.Close()
    Write-Host "  FIXED       $($file.Name)  (was not a real PNG, converted; original in _art-backup)" -ForegroundColor Green
    $fixed++
  }

  if ($opaqueOk -notcontains $file.Name) {
    $bgra = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($frame, [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)
    $w = $bgra.PixelWidth; $h = $bgra.PixelHeight
    $px = New-Object byte[] 4
    $opaqueWhite = 0
    foreach ($pt in @(@(0, 0), @(($w - 1), 0), @(0, ($h - 1)), @(($w - 1), ($h - 1)))) {
      $bgra.CopyPixels((New-Object System.Windows.Int32Rect($pt[0], $pt[1], 1, 1)), $px, 4, 0)
      if ($px[3] -gt 250 -and $px[0] -gt 230 -and $px[1] -gt 230 -and $px[2] -gt 230) { $opaqueWhite++ }
    }
    if ($opaqueWhite -ge 2) {
      Write-Host "  WARNING     $($file.Name)  has a solid white background (not transparent)" -ForegroundColor Yellow
      $warned++
    }
  }
}
Write-Host ""
Write-Host "Done. Fixed: $fixed   Background warnings: $warned"
if ($Host.Name -eq 'ConsoleHost') { Read-Host 'Press Enter to close' | Out-Null }
