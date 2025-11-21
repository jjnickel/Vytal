Param(
    [string]$ProjectPath = "."
)

Write-Host "=== AI Fitness Frontend Fix Script ===" -ForegroundColor Cyan
Write-Host "Project path: $ProjectPath" -ForegroundColor Cyan

# Move to the project path (frontend folder)
Set-Location $ProjectPath

# 1) Define a clean package.json for Expo + React Native + Web
Write-Host "Writing cleaned package.json ..." -ForegroundColor Yellow

$packageJson = @'
{
  "name": "aifitness-frontend",
  "version": "0.1.0",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "^50.0.0",
    "expo-status-bar": "^1.4.4",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-web": "^0.19.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@expo/vector-icons": "^14.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@expo/webpack-config": "^19.0.0"
  }
}
'@

Set-Content -LiteralPath "package.json" -Value $packageJson -Encoding UTF8

# 2) Remove node_modules and package-lock.json if they exist
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules ..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
} else {
    Write-Host "node_modules folder not found, skipping removal." -ForegroundColor DarkGray
}

if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json ..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
} else {
    Write-Host "package-lock.json not found, skipping removal." -ForegroundColor DarkGray
}

# 3) Run npm install
Write-Host "Running npm install (this may take a few minutes)..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Frontend dependencies installed successfully." -ForegroundColor Green
    Write-Host "You can now start the app with:" -ForegroundColor Green
    Write-Host "    npm start" -ForegroundColor Green
} else {
    Write-Host "`n❌ npm install failed. Check the error above." -ForegroundColor Red
}
