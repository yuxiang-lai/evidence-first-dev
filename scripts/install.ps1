param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("cursor", "generic", "claude")]
  [string]$Tool,

  [string]$ProjectRoot = (Get-Location).Path,

  [switch]$Force
)

$ErrorActionPreference = "Stop"
$skillRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$skillRootFull = [System.IO.Path]::GetFullPath($skillRoot).TrimEnd([char]92, [char]47)
$projectFull = [System.IO.Path]::GetFullPath($project).TrimEnd([char]92, [char]47)

if ($projectFull -eq $skillRootFull -or $projectFull.StartsWith("$skillRootFull\\", [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "project root must be separate from the skill checkout: $project"
}

function Stop-Install([string]$Message) {
  Write-Error "install FAIL: $Message"
  exit 1
}

function Copy-Safely([string]$Source, [string]$Destination) {
  if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
    Stop-Install "source file does not exist: $Source"
  }
  if ((Test-Path -LiteralPath $Destination) -and -not $Force) {
    Stop-Install "destination already exists: $Destination; use -Force only after reviewing it"
  }
  $parent = Split-Path -Parent $Destination
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Force:$Force
}

switch ($Tool) {
  "cursor" {
    Copy-Safely `
      (Join-Path $skillRoot "adapters\cursor\evidence-first-dev.mdc") `
      (Join-Path $project ".cursor\rules\evidence-first-dev.mdc")
    Write-Output "install PASS: Cursor rule installed in $project"
  }
  "generic" {
    Copy-Safely `
      (Join-Path $skillRoot "AGENTS.md") `
      (Join-Path $project "AGENTS.md")
    Write-Output "install PASS: AGENTS.md installed in $project"
  }
  "claude" {
    $destination = Join-Path $project ".claude\skills\evidence-first-dev"
    if ((Test-Path -LiteralPath $destination) -and -not $Force) {
      Stop-Install "destination already exists: $destination; use -Force only after reviewing it"
    }
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Get-ChildItem -LiteralPath $skillRoot -Force |
      Where-Object { $_.Name -notin @(".git", "node_modules", "coverage") } |
      Copy-Item -Destination $destination -Recurse -Force:$Force
    Write-Output "install PASS: Claude Code skill installed in $project"
  }
}
