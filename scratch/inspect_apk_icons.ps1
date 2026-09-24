Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("LostSeek.apk")
$items = $zip.Entries | Where-Object { $_.FullName -like "res/*" }
Write-Host "Total entries in res/: $($items.Count)"
foreach ($item in $items) {
    if ($item.FullName -notlike "*mtrl*" -and $item.FullName -notlike "*design*" -and $item.FullName -notlike "*m3_*") {
        Write-Host "$($item.FullName) - $($item.Length) bytes"
    }
}
$zip.Dispose()
