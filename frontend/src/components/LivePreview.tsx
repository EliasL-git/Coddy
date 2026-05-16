import { useMemo } from "react";

// ─── Content Security Policy ──────────────────────────────────────────────────
//
// Applied inside every srcdoc so student code cannot:
//   • load external scripts          (script-src 'unsafe-inline' 'unsafe-eval' only)
//   • fetch / XHR / WebSocket out    (connect-src 'none')
//   • embed nested iframes           (frame-src 'none')
//   • submit forms                   (form-action 'none')
//   • load plugins (Flash, etc.)     (object-src 'none')
//   • override the base URL          (base-uri 'none')
//
// Images from HTTPS are allowed so portfolio lessons can show picsum photos.
// Inline styles are allowed so CSS lessons render correctly.
// 'unsafe-eval' is included so students can experiment with eval() without
// confusing CSP errors, while all network egress is still blocked.

const CSP_RULES = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval'",
  "style-src 'unsafe-inline'",
  "img-src https: data: blob:",
  "font-src 'none'",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP_RULES}">`;

// ─── Permissions Policy ───────────────────────────────────────────────────────
// Denies every sensitive browser API at the iframe level (belt-and-suspenders
// on top of the sandbox + CSP). Even if student code calls navigator.getUserMedia
// or navigator.geolocation, the browser refuses before asking the user.

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "display-capture=()",
  "fullscreen=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "usb=()",
].join(", ");

// ─── CSP injection helper ─────────────────────────────────────────────────────
// For HTML previews the student writes the document, so we inject the CSP meta
// into whatever head-like structure they have (or prepend one if absent).

function withCSP(html) {
  if (/<head[^>]*>/i.test(html)) {
    // Inject right after the opening <head> tag
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${CSP_META}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    // Wrap in a head before the <html> body
    return html.replace(
      /<html[^>]*>/i,
      (m) => `${m}\n<head>${CSP_META}</head>`,
    );
  }
  // Student hasn't written the skeleton yet — prepend a minimal head
  return `<head>${CSP_META}</head>\n${html}`;
}

// ─── srcdoc builders ─────────────────────────────────────────────────────────

function buildHtmlSrcDoc(code) {
  // We control nothing — student wrote the whole document.
  // Inject our CSP so their code is still locked down.
  return withCSP(code);
}

function buildCssSrcDoc(code, baseHtml) {
  const scaffold =
    baseHtml ||
    `
    <h1>Hello, World!</h1>
    <p>This is a paragraph. Style me!</p>
    <div class="container">
      <div class="box">Box A</div>
      <div class="box">Box B</div>
      <div class="box">Box C</div>
    </div>
    <button class="btn">Click me</button>
    <ul>
      <li>List item one</li>
      <li>List item two</li>
      <li>List item three</li>
    </ul>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${CSP_META}
<style>
  /* student css */
  ${code}
</style>
</head>
<body>${scaffold}</body>
</html>`;
}

// Avoid writing </script> literally inside a template literal — some tools
// parse it as a closing tag. Build it from parts instead.
const SCRIPT_CLOSE = "<" + "/script>";

function buildJsSrcDoc(code, baseHtml, baseCss) {
  const hasHtml = !!baseHtml;

  const styleBlock = hasHtml
    ? `<style>${baseCss || ""}</style>`
    : `<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
    font-size: 13px;
    line-height: 1.7;
    padding: 16px;
    background: #0d1117;
    color: #e6edf3;
    margin: 0;
  }
  .line { white-space: pre-wrap; word-break: break-all; padding: 1px 0; }
  .log  { color: #7ee787; }
  .warn { color: #e3b341; }
  .err  { color: #f85149; }
  .info { color: #79c0ff; }
  .dir  { color: #cdd9e5; }
</style>`;

  const bodyContent = hasHtml
    ? `${baseHtml}<div id="coddy-console" style="position:fixed; bottom:0; left:0; right:0; max-height: 150px; overflow-y: auto; background: rgba(13,17,23,0.9); color: #e6edf3; font-family: monospace; font-size: 12px; padding: 8px; border-top: 1px solid #30363d; z-index: 9999;"></div>`
    : `<body></body>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${CSP_META}
${styleBlock}
</head>
${hasHtml ? `<body>${bodyContent}` : `<body>`}
<script>
(function () {
  var out = ${hasHtml ? "document.getElementById('coddy-console')" : "document.body"};

  function write(cls, args) {
    if (!out) return;
    var el = document.createElement('div');
    el.className = 'line ' + cls;
    el.style.whiteSpace = 'pre-wrap';
    el.style.wordBreak = 'break-all';
    el.style.padding = '1px 0';
    if (cls === 'log') el.style.color = '#7ee787';
    if (cls === 'err') el.style.color = '#f85149';

    el.textContent = Array.prototype.slice.call(args).map(function (a) {
      return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
    }).join(' ');
    out.appendChild(el);
    out.scrollTop = out.scrollHeight;
  }

  console.log   = function () { write('log',  arguments); };
  console.warn  = function () { write('warn', arguments); };
  console.error = function () { write('err',  arguments); };
  console.info  = function () { write('info', arguments); };
  console.dir   = function () { write('dir',  arguments); };

  window.onerror = function (msg, _src, line) {
    write('err', ['\u274C ' + msg + ' (line ' + line + ')']);
    return true;
  };

  window.onunhandledrejection = function (e) {
    write('err', ['\u274C Unhandled promise rejection: ' + e.reason]);
  };

  try {
    ${code}
  } catch (e) {
    write('err', ['\u274C ' + e.name + ': ' + e.message]);
  }
})();
${SCRIPT_CLOSE}
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props
 *   code      – current editor content
 *   language  – 'html' | 'css' | 'javascript'
 *   baseHtml  – optional HTML scaffold for CSS challenges
 *   baseCss   – optional CSS scaffold
 *   runKey    – increment to re-execute JS (otherwise the iframe keeps the old run)
 */
export default function LivePreview({
  code,
  language,
  baseHtml,
  baseCss,
  runKey = 0,
}) {
  // code  — for JS this is a snapshot (codeToRun from LessonPage), so it only
  //          changes when the student clicks Run. For HTML/CSS it's the live value.
  // runKey — included so the iframe key prop (below) can force a clean remount.
  const srcDoc = useMemo(() => {
    if (!code?.trim()) return "";
    if (language === "javascript")
      return buildJsSrcDoc(code, baseHtml, baseCss);
    if (language === "css") return buildCssSrcDoc(code, baseHtml);
    return buildHtmlSrcDoc(code);
  }, [code, language, baseHtml, baseCss, runKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <iframe
      // Force a full remount for JS so the <script> actually re-executes
      key={language === "javascript" ? `js-${runKey}` : "static"}
      srcDoc={srcDoc}
      // ── Sandbox ──────────────────────────────────────────────────────────
      // allow-scripts  → student JS can run
      // (no allow-same-origin) → iframe gets an opaque null origin;
      //   it cannot read parent cookies, localStorage, or the parent DOM.
      sandbox="allow-scripts"
      // ── Permissions Policy ────────────────────────────────────────────────
      // Belt-and-suspenders: deny camera, mic, geolocation, etc. at the
      // browser level even before CSP or sandbox come into play.
      allow={PERMISSIONS_POLICY}
      // ── Referrer ──────────────────────────────────────────────────────────
      // Don't leak the app origin in the Referer header for any sub-resource
      // the student's code manages to request.
      referrerPolicy="no-referrer"
      className="w-full h-full border-0 bg-white"
      title={language === "javascript" ? "Console Output" : "Live Preview"}
    />
  );
}
