# Fix all hardcoded localhost URLs in React files
# This script replaces http://localhost:8000 with ${API_URL} variable

$files = @(
    "src\pages\UserHome.jsx",
    "src\pages\WritePrescription.jsx",
    "src\pages\ViewPrescription.jsx"
)

$API_URL_IMPORT = "// Use environment variable for API URL (works with Vercel deployment)`nconst API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';"

foreach ($file in $files) {
    $fullPath = Join-Path "c:\Users\USER\Desktop\CnC_Mock" $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        # Read content
        $content = Get-Content $fullPath -Raw
        
        # Check if API_URL constant already exists
        if ($content -notmatch "const API_URL =") {
            Write-Host "  Adding API_URL constant..." -ForegroundColor Yellow
            
            # Find the first import statement and add after it
            $content = $content -replace "(import .+?;`n)", "`$1`n$API_URL_IMPORT`n"
        }
        
        # Replace all hardcoded URLs
        $replacementCount = ([regex]::Matches($content, "http://localhost:8000")).Count
        $content = $content -replace "http://localhost:8000", '${API_URL}'
        
        # Save
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  ✓ Replaced $replacementCount occurrences" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✓ All files processed!" -ForegroundColor Green
Write-Host "Now all components will use the VITE_API_URL environment variable from Vercel." -ForegroundColor Cyan
