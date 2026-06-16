Get-ChildItem "C:\Javascript\RealProjects\ASCII solar system\ASCII-solar-system\videos\*" -Include *.mp4,*.mov,*.avi,*.mkv | ForEach-Object {
  $outName = $_.BaseName + ".mp4"
  $outPath = "C:\Javascript\RealProjects\ASCII solar system\ASCII-solar-system\public\videos\$outName"
  Write-Host "Compressing: $($_.Name) -> $outName"
  ffmpeg -i $_.FullName -t 20 -crf 28 -vf scale=-2:720 -preset slow $outPath
}
Write-Host "Done. Compressed files are in public/videos/"
