$content = Get-Content src/pages/BotDashboard.tsx
$result = @()
$inConflict = $false
$skipUntilEnd = $false

foreach ($line in $content) {
    if ($line -match "^<<<<<<<") {
        $inConflict = $true
        $skipUntilEnd = $false
        continue
    }
    if ($line -match "^=======") {
        $skipUntilEnd = $true
        continue
    }
    if ($line -match "^>>>>>>>") {
        $inConflict = $false
        $skipUntilEnd = $false
        continue
    }
    if (!$inConflict -or ($inConflict -and !$skipUntilEnd)) {
        $result += $line
    }
}

$result | Set-Content src/pages/BotDashboard.tsx
Write-Host "Fixed!"
