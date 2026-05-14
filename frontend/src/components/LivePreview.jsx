import { useMemo } from 'react';

// ─── HTML builder per language ────────────────────────────────────────────────

function buildSrcDoc(code, language, baseHtml) {
  if (!code) return '';

  if (language === 'javascript') {
    // Wrap user code in a sandboxed runner that intercepts console.*
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.7;
    padding: 16px;
    background: #0d1117;
    color: #e6edf3;
    margin: 0;
  }
  .line { white-space: pre-wrap; word-break: break-all; padding: 1px 0; }
  .log   { color: #7ee787; }
  .warn  { color: #e3b341; }
  .error { color: #f85149; }
  .info  { color: #79c0ff; }
  .dir   { color: #cdd9e5; }
</style>
</head>
<body>
<script>
(function () {
  var body = document.body;

  function write(cls, args) {
    var el = document.createElement('div');
    el.className = 'line ' + cls;
    el.textContent = Array.prototype.slice.call(args).map(function (a) {
      return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
    }).join(' ');
    body.appendChild(el);
  }

  console.log   = function () { write('log',  arguments); };
  console.warn  = function () { write('warn', arguments); };
  console.error = function () { write('error',arguments); };
  console.info  = function () { write('info', arguments); };
  console.dir   = function () { write('dir',  arguments); };

  window.onerror = function (msg, src, line) {
    write('error', ['❌ ' + msg + ' (line ' + line + ')']);
    return true;
  };

  try {
    ${code}
  } catch (e) {
    write('error', ['❌ ' + e.name + ': ' + e.message]);
  }
})();
<\/script>
</body>
</html>`;
  }

  if (language === 'css') {
    const scaffold = baseHtml || `
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
<style>
  /* student css below */
  ${code}
</style>
</head>
<body>${scaffold}</body>
</html>`;
  }

  // html — use as-is
  return code;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   code      – current editor text
 *   language  – 'html' | 'css' | 'javascript'
 *   baseHtml  – optional HTML scaffold shown for CSS challenges
 *   runKey    – increment this to force JS re-execution (otherwise iframe keeps old run)
 */
export default function LivePreview({ code, language, baseHtml, runKey = 0 }) {
  const srcDoc = useMemo(
    () => buildSrcDoc(code, language, baseHtml),
    // For JS: rebuild only when runKey changes (triggered by "Run" button)
    // For HTML/CSS: rebuild on every keystroke (safe & fast)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    language === 'javascript' ? [runKey, language] : [code, language, baseHtml],
  );

  return (
    <iframe
      // Remount iframe for JS so the script actually re-executes
      key={language === 'javascript' ? runKey : 'static'}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="w-full h-full border-0 bg-white"
      title={language === 'javascript' ? 'Console Output' : 'Live Preview'}
    />
  );
}
