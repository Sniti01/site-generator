# Snimok okna Chromium vmeste s interfejsom brauzera (PrintWindow, PW_RENDERFULLCONTENT):
# polosa vkladok s favikonom. Okno ishchetsya po zagolovku (title stranicy).
# ASCII only: Windows PowerShell 5.1 chitaet fajl bez BOM v kodirovke ANSI.
param([string]$Title, [string]$Out)
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
"@
[W]::SetProcessDPIAware() | Out-Null
$h = [IntPtr]::Zero
foreach ($p in Get-Process -Name chrome -ErrorAction SilentlyContinue) {
  if ($p.MainWindowHandle -ne [IntPtr]::Zero -and $p.MainWindowTitle -like "*$Title*") { $h = $p.MainWindowHandle; break }
}
if ($h -eq [IntPtr]::Zero) { Write-Output 'no window'; exit 2 }
$r = New-Object W+RECT
[W]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $hh = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[W]::PrintWindow($h, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "window ${w}x${hh}"
