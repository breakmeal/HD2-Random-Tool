param(
  [string]$PythonExe = "",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$desktopRoot = (Resolve-Path $PSScriptRoot).Path
$projectRoot = (Resolve-Path (Join-Path $desktopRoot "..")).Path
$venvRoot = Join-Path $desktopRoot ".venv"
$venvPython = Join-Path $venvRoot "Scripts\python.exe"
$bundleRoot = Join-Path $desktopRoot "bundle\web"
$distRoot = Join-Path $desktopRoot "dist"
$buildRoot = Join-Path $desktopRoot "build"

function Assert-NativeSuccess([string]$Step) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Step failed with exit code $LASTEXITCODE."
  }
}

if ([string]::IsNullOrWhiteSpace($PythonExe)) {
  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if ($pythonCommand) {
    $PythonExe = $pythonCommand.Source
  } else {
    $workspacePython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path $workspacePython) { $PythonExe = $workspacePython }
  }
}
if ([string]::IsNullOrWhiteSpace($PythonExe) -or -not (Test-Path $PythonExe)) {
  throw "Python was not found. Pass Python 3.12 or newer with -PythonExe."
}

if (-not (Test-Path $venvPython)) {
  & $PythonExe -m venv $venvRoot
  Assert-NativeSuccess "Creating the Python virtual environment"
}
if (-not $SkipInstall) {
  & $venvPython -m pip install --disable-pip-version-check --no-cache-dir -r (Join-Path $desktopRoot "requirements-build.txt")
  Assert-NativeSuccess "Installing desktop build dependencies"
}

# Recreate only generated files inside desktop-app; the project assets are never removed or overwritten.
if (Test-Path (Join-Path $desktopRoot "bundle")) { Remove-Item (Join-Path $desktopRoot "bundle") -Recurse -Force }
if (Test-Path $distRoot) { Remove-Item $distRoot -Recurse -Force }
if (Test-Path $buildRoot) { Remove-Item $buildRoot -Recurse -Force }
New-Item -ItemType Directory -Path $bundleRoot -Force | Out-Null

$sourceFiles = @(
  "index.html", "styles.css", "codex.css", "interface-refresh.css", "enemy-dossier.css", "mission-dossier.css",
  "data.js", "equipment-details.js", "enemy-data.js", "mission-data.js", "stratagem-ratings.js", "refreshed-images.js",
  "equipment-descriptions-zh.js", "app.js", "codex-v2.js", "enemy-dossier.js", "mission-dossier.js"
)
foreach ($file in $sourceFiles) {
  Copy-Item (Join-Path $projectRoot $file) (Join-Path $bundleRoot $file)
}
Copy-Item (Join-Path $projectRoot "assets\equipment") (Join-Path $bundleRoot "assets\equipment") -Recurse
New-Item -ItemType Directory -Path (Join-Path $bundleRoot "assets\refreshed-images") -Force | Out-Null
Copy-Item (Join-Path $projectRoot "assets\refreshed-images\2026-08-08-matched") (Join-Path $bundleRoot "assets\refreshed-images\2026-08-08-matched") -Recurse
Copy-Item (Join-Path $projectRoot "assets\ui") (Join-Path $bundleRoot "assets\ui") -Recurse
Copy-Item (Join-Path $projectRoot "assets\missions") (Join-Path $bundleRoot "assets\missions") -Recurse
Copy-Item (Join-Path $projectRoot "assets\enemies") (Join-Path $bundleRoot "assets\enemies") -Recurse

& $venvPython (Join-Path $desktopRoot "test_bundle.py") $bundleRoot
Assert-NativeSuccess "Validating the desktop bundle"

$pyinstaller = Join-Path $venvRoot "Scripts\pyinstaller.exe"
if (-not (Test-Path $pyinstaller)) { throw "PyInstaller is not installed in $venvRoot" }
& $pyinstaller `
  --noconfirm --clean --onefile --windowed `
  --name "SuperEarthArsenal" `
  --icon (Join-Path $desktopRoot "icon.ico") `
  --distpath $distRoot --workpath $buildRoot `
  --add-data "$bundleRoot;web" `
  --collect-submodules webview `
  (Join-Path $desktopRoot "app.py")
Assert-NativeSuccess "Building the desktop executable"

$exePath = Join-Path $distRoot "SuperEarthArsenal.exe"
if (-not (Test-Path $exePath)) { throw "PyInstaller did not create $exePath" }
$exeInfo = Get-Item $exePath
[pscustomobject]@{
  exe = $exeInfo.FullName
  bytes = $exeInfo.Length
  megabytes = [math]::Round(($exeInfo.Length / 1MB), 2)
}
