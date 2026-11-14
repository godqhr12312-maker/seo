// =====================================================================
//  텔레그램 상담 아이디 관리 서버 (로컬 전용)
//  "텔레그램관리.cmd" 더블클릭으로 실행됩니다. 직접 실행 시: node admin-server.mjs [port]
//  브라우저 관리 화면에서 아이디를 저장하면 telegram-config.js를 고치고
//  자동으로 git add/commit/push 하여 사이트에 반영합니다. (1~2분 뒤 적용)
// =====================================================================
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const port = Number(process.argv[2] ?? 52140);
const root = fileURLToPath(new URL("./", import.meta.url));
const configPath = fileURLToPath(new URL("./telegram-config.js", import.meta.url));
const SITE = "https://www.casino-solution.co.kr";
const ID_RE = /^[A-Za-z0-9_]{3,32}$/;

async function readId() {
  const c = await readFile(configPath, "utf8");
  const m = c.match(/window\.TELEGRAM_ID\s*=\s*"([^"]*)"/);
  return m ? m[1] : "";
}
async function writeId(newId) {
  const c = await readFile(configPath, "utf8");
  const updated = c.replace(/(window\.TELEGRAM_ID\s*=\s*")[^"]*(")/, `$1${newId}$2`);
  if (updated === c) throw new Error("telegram-config.js에서 아이디 위치를 찾지 못했습니다.");
  await writeFile(configPath, updated, "utf8");
}
async function deploy(oldId, newId) {
  await run("git", ["add", "telegram-config.js"], { cwd: root });
  await run("git", ["commit", "-m", `Update Telegram id: @${oldId} -> @${newId}`], { cwd: root });
  await run("git", ["push", "origin", "main"], { cwd: root });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function pageHtml(id, state) {
  let banner = "";
  if (state === "saved")
    banner = `<p class="ok">✅ 저장했습니다! <b>1~2분 뒤</b> 사이트에 자동 반영됩니다. (브라우저 Ctrl+F5 새로고침)</p>`;
  else if (state === "same")
    banner = `<p class="ok">현재와 같은 아이디입니다. 변경할 내용이 없습니다.</p>`;
  else if (state === "invalid")
    banner = `<p class="err">⚠️ 아이디 형식이 올바르지 않습니다. 영문/숫자/밑줄(_) 3~32자, @ 기호는 빼고 입력하세요.</p>`;
  else if (state && state.startsWith("error:"))
    banner = `<p class="err">❌ 업로드 중 오류가 발생했습니다.<br><small>${esc(state.slice(6))}</small><br>인터넷 연결을 확인하고 다시 시도해 주세요.</p>`;

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>텔레그램 상담 아이디 관리</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#0f1115;color:#e9eaee;font:16px/1.6 system-ui,'Malgun Gothic',sans-serif}
  main{max-width:34rem;margin:3rem auto;padding:2rem;background:#1a1d24;border:1px solid #2a2f3a;border-radius:1rem}
  h1{margin:0 0 .25rem;font-size:1.5rem}
  .sub{margin:0 0 1.5rem;color:#9aa0ac;font-size:.92rem}
  label{display:block;margin:1.3rem 0 .4rem;font-weight:700}
  .at{display:flex;align-items:center;gap:.5rem}
  .at span{font-size:1.3rem;color:#8b93a1}
  input{flex:1;width:100%;padding:.8rem;border:1px solid #3a4150;border-radius:.5rem;background:#0f1115;color:#fff;font:inherit}
  input:focus{outline:2px solid #e0245e;border-color:#e0245e}
  button{margin-top:1.6rem;width:100%;padding:.9rem;border:0;border-radius:.6rem;background:#e0245e;color:#fff;font:inherit;font-weight:700;font-size:1.05rem;cursor:pointer}
  button:hover{background:#c51e50}
  .ok{background:#13351f;border:1px solid #1f6b3a;color:#7ee2a2;padding:.8rem 1rem;border-radius:.5rem}
  .err{background:#3a1620;border:1px solid #7a2238;color:#ff9bb0;padding:.8rem 1rem;border-radius:.5rem}
  .preview{margin-top:1.2rem;padding:.8rem 1rem;background:#0f1115;border:1px dashed #3a4150;border-radius:.5rem;font-size:.9rem;color:#9aa0ac;word-break:break-all}
  .preview b{color:#e9eaee}
  footer{margin-top:1.6rem;display:flex;gap:1rem;font-size:.9rem}
  footer a{color:#8b93a1}
  .note{margin-top:1rem;font-size:.82rem;color:#6b7280}
</style></head><body><main>
  <h1>텔레그램 상담 아이디 관리</h1>
  <p class="sub">여기서 아이디를 바꾸고 저장하면 메인·지역11·개인정보 페이지에 전부 자동 반영됩니다.</p>
  ${banner}
  <form method="post" action="/save">
    <label for="id">상담 텔레그램 아이디</label>
    <div class="at"><span>@</span><input id="id" name="id" value="${esc(id)}" autocomplete="off" autofocus
      pattern="[A-Za-z0-9_]{3,32}" maxlength="32" required placeholder="예: MeteoSolution"></div>
    <div class="preview">현재 연결: <b>https://t.me/${esc(id)}</b></div>
    <button type="submit">저장하고 사이트에 반영</button>
  </form>
  <footer>
    <a href="${SITE}" target="_blank" rel="noopener">사이트 열어보기 ↗</a>
    <a href="https://t.me/${esc(id)}" target="_blank" rel="noopener">텔레그램 링크 테스트 ↗</a>
  </footer>
  <p class="note">※ 상담폼(양식 제출) 전송용 봇은 별개이며 이 화면으로 바뀌지 않습니다.<br>※ 다 쓰면 이 브라우저 탭을 닫으면 됩니다. (관리 서버는 잠시 후 자동 종료)</p>
</main></body></html>`;
}

function send(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  res.end(html);
}

let idleTimer;
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => process.exit(0), 10 * 60 * 1000); // 10분 무동작 시 자동 종료
}

const server = createServer(async (req, res) => {
  const host = req.headers.host || "";
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host)) { res.writeHead(400).end("loopback only"); return; }
  resetIdle();
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/") {
      return send(res, 200, pageHtml(await readId(), url.searchParams.get("state") || ""));
    }
    if (req.method === "POST" && url.pathname === "/save") {
      let body = "";
      for await (const ch of req) { body += ch; if (body.length > 10000) { res.writeHead(413).end(); return; } }
      let newId = (new URLSearchParams(body).get("id") || "").trim().replace(/^@+/, "");
      if (!ID_RE.test(newId)) return send(res, 400, pageHtml(newId, "invalid"));
      const oldId = await readId();
      if (newId === oldId) { res.writeHead(303, { Location: "/?state=same" }); return res.end(); }
      try {
        await writeId(newId);
        await deploy(oldId, newId);
        res.writeHead(303, { Location: "/?state=saved" }); res.end();
      } catch (e) {
        return send(res, 500, pageHtml(oldId, "error:" + (e.stderr || e.message || String(e))));
      }
      return;
    }
    res.writeHead(404).end("not found");
  } catch (e) {
    res.writeHead(500).end("server error");
  }
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") process.exit(0); // 이미 실행 중 → 런처가 브라우저만 열도록 종료
  else { console.error(e); process.exit(1); }
});
server.listen(port, "127.0.0.1", () => { resetIdle(); console.log("admin ready on http://localhost:" + port + "/"); });
