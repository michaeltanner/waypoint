<#
.SYNOPSIS
    Waypoint Zero-Dependency PowerShell Bundler (COA #2)
.DESCRIPTION
    Compiles modular source files in /src into the single-file,
    air-gapped release artifact: waypoint.html without requiring Node.js.
.EXAMPLE
    .\build.ps1
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SrcDir = Join-Path $ScriptDir "src"
$BuildDir = Join-Path $ScriptDir "build"
$OutputFile = Join-Path $BuildDir "waypoint.html"

Write-Host "==> Building Waypoint standalone artifact via PowerShell..." -ForegroundColor Cyan

$cssFiles = @(
    "tokens.css",
    "layout.css",
    "tree.css",
    "gantt.css",
    "kanban.css",
    "inspector.css",
    "modals.css",
    "print.css",
    "launcher.css"
)

$jsFiles = @(
    "core\schema.js",
    "core\sample-data.js",
    "core\converter.js",
    "core\hierarchy.js",
    "core\storage.js",
    "core\navigation.js",
    "core\shortcuts.js",
    "components\rich-text.js",
    "views\launcher.js",
    "views\tree.js",
    "views\gantt.js",
    "views\kanban.js",
    "views\roster.js",
    "views\json-view.js",
    "components\inspector.js",
    "core\init.js"
)

$templatePath = Join-Path $SrcDir "index.html"
if (-not (Test-Path $templatePath)) {
    Write-Error "Template not found: $templatePath"
}
$html = Get-Content -Path $templatePath -Raw -Encoding UTF8

# Concatenate CSS
$cssBundle = "    /* ==========================================================================`n" +
             "       WAYPOINT V4 - MODERN GLASSMORPHIC AIR-GAPPED DASHBOARD (COMPILED)`n" +
             "       ========================================================================== */`n"
foreach ($file in $cssFiles) {
    $filePath = Join-Path $SrcDir "css\$file"
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $cssBundle += "`n    /* --- $file --- */`n" + $content + "`n"
    } else {
        Write-Error "Missing CSS file: $filePath"
    }
}

# Concatenate JS
$jsBundle = "    /* ==========================================================================`n" +
            "       WAYPOINT CORE JAVASCRIPT ENGINE (COMPILED)`n" +
            "       ========================================================================== */`n"
foreach ($file in $jsFiles) {
    $filePath = Join-Path $SrcDir "js\$file"
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $jsBundle += "`n    // --- $file ---`n" + $content + "`n"
    } else {
        Write-Error "Missing JS file: $filePath"
    }
}

$cssPlaceholder = "/* <!-- INJECT:CSS --> */"
$jsPlaceholder = "/* <!-- INJECT:JS --> */"

$html = $html.Replace($cssPlaceholder, $cssBundle)
$html = $html.Replace($jsPlaceholder, $jsBundle)

if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Path $BuildDir | Out-Null
}

[System.IO.File]::WriteAllText($OutputFile, $html, [System.Text.Encoding]::UTF8)

$size = [math]::Round(((Get-Item $OutputFile).Length / 1KB), 1)
$lines = ($html -split "`n").Count
Write-Host "[OK] Successfully compiled build/waypoint.html via PowerShell!" -ForegroundColor Green
Write-Host "     Size: $size KB | Lines: $lines" -ForegroundColor Gray
