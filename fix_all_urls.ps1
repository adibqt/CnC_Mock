# Comprehensive fix for ALL hardcoded localhost URLs in React files
# This script adds API_URL constant and replaces hardcoded URLs

$files = @(
    "src\pages\ProfileUpdate.jsx",
    "src\pages\PharmacyLogin.jsx",
    "src\pages\PharmacyDashboard.jsx",
    "src\pages\DoctorLogin.jsx",
    "src\pages\DoctorProfileUpdate.jsx",
    "src\pages\Doctors.jsx",
    "src\pages\DoctorDetails.jsx",
    "src\pages\PatientManagement.jsx",
    "src\pages\DoctorManagement.jsx",
    "src\pages\DoctorHome.jsx",
    "src\pages\ClinicLogin.jsx",
    "src\pages\ClinicDashboard.jsx"
)

$API_URL_LINE = "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';"

$fixedCount = 0

foreach ($file in $files) {
    $fullPath = "c:\Users\USER\Desktop\CnC_Mock\$file"
    
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        $content = Get-Content $fullPath -Raw
        
        # Check if API_URL constant already exists
        if ($content -notmatch "const API_URL =") {
            # Find the last import and add API_URL after it
            $lines = $content -split "`n"
            $lastImportIndex = -1
            
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                # Insert API_URL constant after last import
                $lines = $lines[0..$lastImportIndex] + "" + "// Use environment variable for API URL" + $API_URL_LINE + "" + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $content = $lines -join "`n"
                Write-Host "  Added API_URL constant" -ForegroundColor Yellow
            }
        }
        
        # Count replacements
        $urlMatches = [regex]::Matches($content, "(?<!const API_URL = import\.meta\.env\.VITE_API_URL \|\| )'http://localhost:8000'")
        $templateMatches = [regex]::Matches($content, "(?<!const API_URL = import\.meta\.env\.VITE_API_URL \|\| )``http://localhost:8000")
        $totalMatches = $urlMatches.Count + $templateMatches.Count
        
        if ($totalMatches -gt 0) {
            # Replace single-quoted URLs
            $content = $content -replace "(?<!const API_URL = import\.meta\.env\.VITE_API_URL \|\| )'http://localhost:8000'", '`${API_URL}`'
            
            # Replace template literal URLs
            $content = $content -replace "(?<!const API_URL = import\.meta\.env\.VITE_API_URL \|\| )``http://localhost:8000", '`${API_URL}'
            
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "  Replaced $totalMatches URLs" -ForegroundColor Green
            $fixedCount++
        } else {
            Write-Host "  No hardcoded URLs found" -ForegroundColor Gray
        }
    } else {
        Write-Host "  File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nFixed $fixedCount files!" -ForegroundColor Green
