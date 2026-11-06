# Copy the staged Coin Quest Unity assets into an existing Unity project.
# Usage: powershell -ExecutionPolicy Bypass -File tools/setup-unity-port.ps1
param(
    [string]$ProjectPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'CoinQuest')
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$staged = Join-Path $root 'unity-port-assets'

if (-not (Test-Path (Join-Path $ProjectPath 'Assets'))) {
    throw "Unity project not found at $ProjectPath. Create the project first."
}
if (-not (Test-Path $staged)) {
    throw "Staged assets not found at $staged."
}

$gameArt = Join-Path $ProjectPath 'Assets\Resources\GameArt'
$data = Join-Path $ProjectPath 'Assets\Resources\Data'
$fonts = Join-Path $ProjectPath 'Assets\Resources\Fonts'
$scripts = Join-Path $ProjectPath 'Assets\Scripts'
$editor = Join-Path $ProjectPath 'Assets\Editor'

foreach ($dir in @($gameArt, $data, $fonts, $scripts, $editor)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Get-ChildItem (Join-Path $staged '*.png') -File | Copy-Item -Destination $gameArt -Force
Copy-Item (Join-Path $staged 'Data\maps.json') $data -Force
Copy-Item (Join-Path $staged 'Fonts\PressStart2P-Regular.ttf') $fonts -Force
Copy-Item (Join-Path $staged 'Fonts\OFL.txt') $fonts -Force
Copy-Item (Join-Path $staged 'Scripts\*.cs') $scripts -Force
Copy-Item (Join-Path $staged 'Editor\*.cs') $editor -Force

$projectReadme = Join-Path $ProjectPath 'README.md'
if (Test-Path $projectReadme) {
    $templateReadme = Join-Path $ProjectPath 'README.template.md'
    if (-not (Test-Path $templateReadme)) {
        Move-Item $projectReadme $templateReadme
    }
}
Copy-Item (Join-Path $staged 'README.md') $projectReadme -Force

$gitignore = @'
# Unity generated
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
[Mm]emoryCaptures/
[Rr]ecordings/
.vs/
.idea/
*.csproj
*.sln
*.suo
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db
sysinfo.txt
crashlytics-build.properties
'@
Set-Content -Path (Join-Path $ProjectPath '.gitignore') -Value $gitignore -Encoding utf8

Write-Host "Coin Quest assets copied to $ProjectPath"
Write-Host "Next: open Assets/Scenes/CoinQuest.unity or run CoinQuest > Prepare Empty Scene."
