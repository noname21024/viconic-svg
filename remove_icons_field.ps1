# Script to remove "icons" field from all info.json files and create svg.zip

Write-Host "Starting processing..." -ForegroundColor Green

# Navigate to assets directory
Set-Location -Path "assets"

# Get all directories
$directories = Get-ChildItem -Directory

foreach ($dir in $directories) {
    Write-Host "`nProcessing: $($dir.Name)" -ForegroundColor Cyan
    
    $infoJsonPath = Join-Path $dir.FullName "info.json"
    
    # Check if info.json exists
    if (Test-Path $infoJsonPath) {
        Write-Host "  - Processing info.json..." -ForegroundColor Yellow
        
        try {
            # Read JSON file
            $jsonContent = Get-Content $infoJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            
            # Remove "icons" field if it exists
            if ($jsonContent.PSObject.Properties.Name -contains "icons") {
                $jsonContent.PSObject.Properties.Remove("icons")
                Write-Host "  - Removed 'icons' field" -ForegroundColor Green
                
                # Save back to file with proper formatting
                $jsonContent | ConvertTo-Json -Depth 100 | Set-Content $infoJsonPath -Encoding UTF8
                Write-Host "  - Saved info.json" -ForegroundColor Green
            }
            else {
                Write-Host "  - No 'icons' field found" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  - Error processing info.json: $_" -ForegroundColor Red
        }
    }
    
    # Check if svg folder exists and create zip
    $svgPath = Join-Path $dir.FullName "svg"
    if (Test-Path $svgPath) {
        Write-Host "  - Found svg folder, creating zip..." -ForegroundColor Yellow
        
        $zipPath = Join-Path $dir.FullName "svg.zip"
        
        try {
            Compress-Archive -Path "$svgPath\*" -DestinationPath $zipPath -Force
            Write-Host "  - Zip created successfully!" -ForegroundColor Green
            
            # Remove svg folder after zipping
            Remove-Item -Path $svgPath -Recurse -Force
            Write-Host "  - SVG folder removed" -ForegroundColor Green
        }
        catch {
            Write-Host "  - Error creating zip: $_" -ForegroundColor Red
        }
    }
}

# Go back to parent directory
Set-Location -Path ".."

Write-Host "`nProcessing complete!" -ForegroundColor Green
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
