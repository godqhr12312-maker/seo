/* ============================================================
   텔레그램 아이디 자동 적용 스크립트  (수정하지 마세요 — 자동 처리용)

   telegram-config.js 의 window.TELEGRAM_ID 값을 읽어서,
   페이지 안의 모든 텔레그램 링크(t.me/...)와 "@아이디" 표시,
   구조화 데이터(JSON-LD)의 t.me 주소를 한 번에 맞춰줍니다.
   ============================================================ */
(function () {
  function apply() {
    var id = (window.TELEGRAM_ID || "").toString().trim().replace(/^@+/, "");
    if (!id) return;
    var url = "https://t.me/" + id;

    // 1) 텔레그램 링크(a[href*="t.me/"]) 의 href + "@아이디" 텍스트 갱신
    var links = document.querySelectorAll('a[href*="t.me/"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute("href", url);
      var txt = (a.textContent || "").trim();
      if (/^@[A-Za-z0-9_]+$/.test(txt)) {
        a.textContent = "@" + id;
      }
    }

    // 2) 구조화 데이터(JSON-LD) 안의 t.me/옛아이디 → t.me/새아이디
    var ld = document.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < ld.length; j++) {
      var s = ld[j];
      if (s.textContent && s.textContent.indexOf("t.me/") !== -1) {
        s.textContent = s.textContent.replace(/t\.me\/[A-Za-z0-9_]+/g, "t.me/" + id);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
