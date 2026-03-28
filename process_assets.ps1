# Script to rename folders (remove "icons"), zip SVG folders, and delete original SVG folders

Write-Host "Starting asset processing..." -ForegroundColor Green

# Navigate to assets directory
Set-Location -Path "assets"

# Get all directories
$directories = Get-ChildItem -Directory

foreach ($dir in $directories) {
    Write-Host "`nProcessing: $($dir.Name)" -ForegroundColor Cyan
    
    # Check if svg folder exists
    $svgPath = Join-Path $dir.FullName "svg"
    if (Test-Path $svgPath) {
        Write-Host "  - Found svg folder, creating zip..." -ForegroundColor Yellow
        
        # Create zip file from svg folder
        $zipPath = Join-Path $dir.FullName "svg.zip"
        
        try {
            Compress-Archive -Path "$svgPath\*" -DestinationPath $zipPath -Force
            Write-Host "  - Zip created successfully!" -ForegroundColor Green
            
            # Remove svg folder after zipping
            Remove-Item -Path $svgPath -Recurse -Force
            Write-Host "  - SVG folder removed" -ForegroundColor Green
        }
        catch {
            Write-Host "  - Error: Failed to create zip file - $_" -ForegroundColor Red
        }
    }
    
    # Rename folder if it contains "icons"
    $newName = $dir.Name -replace '_icons', '' -replace '-icons', '' -replace 'icons', ''
    
    if ($newName -ne $dir.Name) {
        Write-Host "  - Renaming: $($dir.Name) -> $newName" -ForegroundColor Yellow
        
        $newPath = Join-Path $dir.Parent.FullName $newName
        
        # Check if target directory already exists
        if (Test-Path $newPath) {
            Write-Host "  - Warning: $newName already exists, skipping rename" -ForegroundColor Red
        }
        else {
            Rename-Item -Path $dir.FullName -NewName $newName
            Write-Host "  - Renamed successfully!" -ForegroundColor Green
        }
    }
}

# Go back to parent directory
Set-Location -Path ".."

Write-Host "`nProcessing complete!" -ForegroundColor Green
