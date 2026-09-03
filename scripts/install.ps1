param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("cursor", "generic", "claude", "codex")]
  [string]$Tool,

  [string]$ProjectRoot = (Get-Location).Path,

  [ValidateSet("full", "bridge")]
  [string]$Mode = "full",

  [switch]$Force
)

$ErrorActionPreference = "Stop"
$skillRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$skillRootFull = [System.IO.Path]::GetFullPath($skillRoot).TrimEnd([char]92, [char]47)
$projectFull = [System.IO.Path]::GetFullPath($project).TrimEnd([char]92, [char]47)

if ($projectFull -eq $skillRootFull -or $projectFull.StartsWith($skillRootFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "project root must be separate from the skill checkout: $project"
}

function Stop-Install([string]$Message) {
  Write-Error "install FAIL: $Message"
  exit 1
}

$payloadManifest = Join-Path $skillRoot "scripts\payload.txt"
if (-not (Test-Path -LiteralPath $payloadManifest -PathType Leaf)) {
  Stop-Install "payload manifest does not exist: $payloadManifest"
}
$payloadEntries = Get-Content -LiteralPath $payloadManifest |
  Where-Object { $_.Trim() -and -not $_.Trim().StartsWith("#") }

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

function Assert-DestinationAvailable([string]$Destination) {
  if ((Test-Path -LiteralPath $Destination) -and -not $Force) {
    Stop-Install "destination already exists: $Destination; use -Force only after reviewing it"
  }
}

function Copy-Payload([string]$Destination, [switch]$AllowExisting) {
  if (-not $AllowExisting) { Assert-DestinationAvailable $Destination }
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  foreach ($entry in $payloadEntries) {
    $relative = $entry.Trim().Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $source = Join-Path $skillRoot $relative.TrimEnd([char]92, [char]47)
    $target = Join-Path $Destination $relative.TrimEnd([char]92, [char]47)
    if (Test-Path -LiteralPath $source -PathType Container) {
      New-Item -ItemType Directory -Force -Path $target | Out-Null
      Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $target -Recurse -Force:$Force
    } else {
      Copy-Safely $source $target
    }
  }
}

switch ($Tool) {
  "cursor" {
    if ($Mode -eq "full") {
      Assert-DestinationAvailable (Join-Path $project ".ai\evidence-first-dev")
      Assert-DestinationAvailable (Join-Path $project ".cursor\rules\evidence-first-dev.mdc")
      Copy-Payload (Join-Path $project ".ai\evidence-first-dev")
    }
    Copy-Safely `
      (Join-Path $skillRoot "adapters\cursor\evidence-first-dev.mdc") `
      (Join-Path $project ".cursor\rules\evidence-first-dev.mdc")
    Write-Output "install PASS: Cursor $Mode installation completed in $project"
  }
  "generic" {
    if ($Mode -eq "full") {
      Assert-DestinationAvailable (Join-Path $project ".ai\evidence-first-dev")
      Assert-DestinationAvailable (Join-Path $project "AGENTS.md")
      Copy-Payload (Join-Path $project ".ai\evidence-first-dev")
    }
    Copy-Safely `
      (Join-Path $skillRoot "AGENTS.md") `
      (Join-Path $project "AGENTS.md")
    Write-Output "install PASS: generic $Mode installation completed in $project"
  }
  "claude" {
    if ($Mode -eq "bridge") {
      Stop-Install "Claude requires full mode; use -Mode full or install the generic bridge manually"
    }
    $destination = Join-Path $project ".claude\skills\evidence-first-dev"
    Copy-Payload $destination
    Write-Output "install PASS: Claude Code full installation completed in $project"
  }
  "codex" {
    if ($Mode -eq "bridge") {
      Stop-Install "Codex requires the full skill payload; use -Mode full"
    }
    Copy-Payload $project -AllowExisting
    Write-Output "install PASS: Codex full installation completed in $project"
  }
}
