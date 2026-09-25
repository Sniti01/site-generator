# Snimok okna Chromium vmeste s interfejsom brauzera (PrintWindow, PW_RENDERFULLCONTENT):
# polosa vkladok s favikonom. Okno ishchetsya po processu, a ne po zagolovku lyubogo
# chrome.exe (sud sudej, raund 2, R2-MATERIALY-2): glavnyj process chrome.exe (bez
# --type=), v komandnoj stroke kotorogo est' -Marker (imya svoej papki --user-data-dir
# zapuska), rovno odin; zagolovok ego okna soderzhit -Title. Chuzhoj Chrome s drugim
# profilem ne podhodit. Vyvod: pid, razmer okna, zagolovok.
# ASCII only: Windows PowerShell 5.1 chitaet fajl bez BOM v kodirovke ANSI.
param([string]$Marker, [string]$Title, [string]$Out)
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
if (-not $Marker) { Write-Output 'no marker'; exit 2 }
$procs = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Marker) -and -not $_.CommandLine.Contains('--type=') })
if ($procs.Count -ne 1) { Write-Output "processes with marker: $($procs.Count)"; exit 3 }
$p = Get-Process -Id $procs[0].ProcessId
if ($p.MainWindowHandle -eq [IntPtr]::Zero) { Write-Output "pid $($p.Id): no main window"; exit 4 }
if (-not $p.MainWindowTitle.Contains($Title)) { Write-Output "pid $($p.Id): title does not contain the page title"; exit 5 }
$h = $p.MainWindowHandle
$r = New-Object W+RECT
[W]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $hh = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[W]::PrintWindow($h, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "pid $($p.Id) window ${w}x${hh} title ok"
