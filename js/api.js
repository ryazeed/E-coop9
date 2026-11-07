/*
 * Connects the interface to the PHP back end (api/*.php) and the MySQL database.
 * The server is the source of truth: every action goes to api/action.php, the server checks the
 * user's role and the business rules, saves to MySQL, and sends back the fresh data for the screen.
 */
var ECOOP_DEMO_PASSWORD = 'Coop@2026';   /* password of the demo accounts in database/ecoop.sql */

var API = (function () {
  function parse(r) {
    return r.text().then(function (txt) {
      try { return JSON.parse(txt); } catch (e) {
        return { ok: false, code: 'bad_response', error: 'The server did not return JSON (HTTP ' + r.status + '). ' + txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 220) };
      }
    });
  }
  function offline() { return { ok: false, code: 'offline', error: 'Cannot reach the server. Is Apache (XAMPP) or the PHP server running?' }; }
  function call(path, body) {
    return fetch('api/' + path, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined
    }).then(parse, offline);
  }
  return {
    boot: function () { return call('state.php'); },
    login: function (email, password) { return call('auth.php', { op: 'login', email: email, password: password }); },
    logout: function () { return call('auth.php', { op: 'logout' }); },
    register: function (data) { return call('auth.php', Object.assign({ op: 'register' }, data)); },
    action: function (a) { return call('action.php', a); },
    upload: function (key, file) {
      var fd = new FormData(); fd.append('key', key); fd.append('file', file, file.name);
      return fetch('api/upload.php', { method: 'POST', body: fd, credentials: 'same-origin' }).then(parse, offline);
    }
  };
})();

/* Final report files are stored on the server (storage/reports) instead of this browser. Same interface as before. */
FileStore = {
  put: function (key, file) { return API.upload(key, file).then(function (r) { if (!r.ok) throw new Error(r.error); }); },
  get: function (key) {
    return fetch('api/file.php?key=' + encodeURIComponent(key), { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) return null;
      var cd = r.headers.get('Content-Disposition') || '', m = /filename="([^"]+)"/.exec(cd);
      return r.blob().then(function (b) { return { name: m ? m[1] : key, type: b.type, blob: b }; });
    }, function () { return null; });
  }
};

/* words added for the server version */
Object.assign(I18N.en, {
  codeLocked: '5 wrong codes: check-in is blocked for 10 minutes.', demoPasswordHint: 'Password for every demo account:',
  serverWorking: 'Saving…', Withdrawn: 'Withdrawn', nRaw: '{m}'
});
Object.assign(I18N.ar, {
  codeLocked: '٥ رموز خاطئة: تم إيقاف تسجيل الحضور لمدة ١٠ دقائق.', demoPasswordHint: 'كلمة المرور لكل الحسابات التجريبية:',
  serverWorking: 'جارٍ الحفظ…', Withdrawn: 'مسحوب', nRaw: '{m}'
});

/* shown instead of the app when the server or database is not ready */
function showBootError(msg) {
  var el = document.getElementById('app');
  el.innerHTML = '<div style="max-width:620px;margin:64px auto;padding:28px;border:1px solid #E2E8F0;border-radius:14px;font-family:system-ui,Segoe UI,Tahoma,sans-serif;background:#fff;color:#0F172A">' +
    '<h1 style="margin:0 0 8px;color:#1B365D;font-size:24px">E-COOP cannot start</h1><p style="color:#475569;line-height:1.6"></p>' +
    '<ol style="color:#475569;line-height:1.8"><li>Open XAMPP and start <b>Apache</b> and <b>MySQL</b>.</li>' +
    '<li>Open <a href="install.php">install.php</a> once to create the database.</li>' +
    '<li>Open the site through the server, e.g. <code>http://localhost/E-COOP-PHP/</code> or <code>http://localhost:8000</code> (not by double-clicking index.html).</li></ol></div>';
  el.querySelector('p').textContent = msg;
}
