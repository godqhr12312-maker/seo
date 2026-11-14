# =====================================================
#  텔레그램 아이디 일괄 변경 + 자동 배포 도구
#  (이 파일은 직접 실행하지 말고 "텔레그램변경.bat" 더블클릭)
# =====================================================
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
Set-Location -LiteralPath $PSScriptRoot

try {
    $idFile = Join-Path $PSScriptRoot 'telegram-id.txt'
    $utf8   = New-Object System.Text.UTF8Encoding($false)   # BOM 없는 UTF-8
    $oldId  = ([System.IO.File]::ReadAllText($idFile, [System.Text.Encoding]::UTF8)).Trim()

    Write-Host ""
    Write-Host "========================================="
    Write-Host "   텔레그램 아이디 변경 도구"
    Write-Host "========================================="
    Write-Host "   지금 아이디 : @$oldId"
    Write-Host ""
    $newId = (Read-Host "   새 아이디 입력 (@ 기호 빼고)").Trim().TrimStart('@')

    if ([string]::IsNullOrWhiteSpace($newId)) { Write-Host "입력이 없어 취소합니다."; return }
    if ($newId -eq $oldId) { Write-Host "지금과 같은 아이디입니다. 변경할 게 없습니다."; return }
    if ($newId -notmatch '^[A-Za-z0-9_]{3,}$') {
        Write-Host "아이디 형식이 이상합니다 (영문/숫자/밑줄, 5자 이상 권장). 취소합니다." -ForegroundColor Yellow
        return
    }

    # 모든 html 파일에서 교체 (t.me/옛아이디, @옛아이디 두 형태)
    $files = Get-ChildItem -LiteralPath $PSScriptRoot -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\node_modules\\' }
    $changed = 0
    foreach ($f in $files) {
        $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $new  = $text.Replace("t.me/$oldId", "t.me/$newId").Replace("@$oldId", "@$newId")
        if ($new -ne $text) {
            [System.IO.File]::WriteAllText($f.FullName, $new, $utf8)
            $changed++
            Write-Host ("   수정됨: " + $f.FullName.Substring($PSScriptRoot.Length + 1))
        }
    }

    # 현재 아이디 기록 파일 갱신
    [System.IO.File]::WriteAllText($idFile, $newId, $utf8)

    Write-Host ""
    Write-Host "   $changed 개 파일 수정 완료. GitHub에 업로드 중..." -ForegroundColor Green
    Write-Host ""

    git add -A
    git commit -m "텔레그램 아이디 변경: @$oldId -> @$newId"
    git push origin main

    Write-Host ""
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   완료! 1~2분 뒤 사이트에 반영됩니다." -ForegroundColor Green
        Write-Host "   확인: https://www.casino-solution.co.kr  (Ctrl+F5 새로고침)"
    } else {
        Write-Host "   업로드 실패! 인터넷 연결 확인 후 다시 실행해 주세요." -ForegroundColor Red
    }
}
catch {
    Write-Host ""
    Write-Host "   오류가 발생했습니다: $_" -ForegroundColor Red
}
