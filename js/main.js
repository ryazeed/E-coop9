/* =====================================================================
   E-COOP - shared JavaScript for every page
   - talks to the PHP back end (api/state.php, api/action.php, api/auth.php)
   - English / Arabic text, dark theme, header, notifications, toast
   - small helpers used by the role files (student.js, company.js, ...)
   ===================================================================== */

/* folder of the site, so pages inside student/, company/ ... can reach api/ */
var ROOT = (function () {
  var src = document.currentScript.src;
  return src.slice(0, src.lastIndexOf('js/main.js'));
})();

var S = null;       // data from the server: users, students, opps, apps, attendance ...
var ME = null;      // signed-in user
var TODAY = '';     // today's date from the server (YYYY-MM-DD)
var DEMO_PASSWORD = 'Coop@2026';

/* ---------- language ---------- */
function t(key, args) {
  var text = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  if (args) text = String(text).replace(/\{(\w+)\}/g, function (m, k) { return args[k] != null ? args[k] : m; });
  return text;
}

/* replace the English text written in the HTML with the chosen language */
function translatePage() {
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var k = el.getAttribute('data-t');
    if (I18N[LANG][k] || I18N.en[k]) el.textContent = t(k);
  });
  document.querySelectorAll('[data-t-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-t-ph')); });
  var title = document.querySelector('title[data-t]');
  if (title) document.title = t(title.getAttribute('data-t')) + ' · E-COOP';
}

function switchLanguage() {
  localStorage.setItem('ecoop-lang', LANG === 'ar' ? 'en' : 'ar');
  location.reload();
}

/* ---------- talking to the server ---------- */
function api(path, body) {
  return fetch(ROOT + 'api/' + path, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) { return r.json(); })
    .catch(function () { return { ok: false, error: 'Cannot reach the server. Is Apache (XAMPP) or the PHP server running?' }; });
}

/* load the data, check the user may open this page, then draw it.
   role = 'Student' | 'Company' | 'Supervisor' | 'Admin' | null (public page) */
function startPage(role, render) {
  if (location.protocol === 'file:') { showStartError('Open E-COOP through the web server, e.g. http://localhost/E-COOP-PHP/'); return; }
  api('state.php').then(function (res) {
    if (!res.ok) { showStartError(res.error); return; }
    TODAY = res.today;
    S = res.state;
    ME = res.me ? find(S.users, res.me) : null;
    if (role && !ME) { location.href = ROOT + 'login.html'; return; }                        // not signed in
    if (role && ME.role !== role) { location.href = homeOf(ME.role); return; }                // wrong role
    translatePage();
    if (ME) fillHeader();
    render();
  });
}

/* send one action (apply, approve, check-in ...) and redraw the page with the saved data */
function act(action, okMessage, render) {
  return api('action.php', action).then(function (res) {
    if (res.state) S = res.state;
    if (res.ok) { if (okMessage) toast(okMessage); }
    else toast(res.error, true);
    if (ME) { ME = find(S.users, ME.id) || ME; fillHeader(); }
    if (render) render();
    return res;
  });
}

function homeOf(role) {
  return ROOT + { Student: 'student/dashboard.html', Company: 'company/overview.html', Supervisor: 'supervisor/students.html', Admin: 'admin/analytics.html' }[role];
}

function signOut() {
  api('auth.php', { op: 'logout' }).then(function () { location.href = ROOT + 'login.html'; });
}

function showStartError(msg) {
  document.body.innerHTML = '<main class="wrap"><div class="card" style="margin-top:40px">' +
    '<h1 style="color:var(--navy)">E-COOP cannot start</h1><p class="muted">' + esc(msg) + '</p>' +
    '<ol><li>Start <b>Apache</b> and <b>MySQL</b> in XAMPP.</li><li>Open <a href="' + ROOT + 'install.php">install.php</a> once to create the database.</li>' +
    '<li>Open the site from <span class="ltr">http://localhost/E-COOP-PHP/</span></li></ol></div></main>';
}

/* ---------- header: user, notifications ---------- */
function fillHeader() {
  var nameEl = document.getElementById('me-name');
  if (!nameEl) return;
  nameEl.textContent = ME.name.split(' ')[0];
  document.getElementById('me-avatar').outerHTML = avatar(ME, '', 'me-avatar');
  var unread = S.notifs.filter(function (n) { return !n.read; }).length;
  var c = document.getElementById('notif-count');
  c.textContent = unread;
  c.hidden = unread === 0;
  var list = document.getElementById('notif-list');
  list.innerHTML = S.notifs.length ? S.notifs.slice(0, 20).map(function (n) {
    var args = Object.assign({}, n.args);
    if (args.d) args.d = fmtDate(args.d);
    return '<li class="' + (n.read ? '' : 'unread') + '">' + esc(t(n.key, args)) +
      '<div class="when">' + relDay(n.ts) + ' · ' + n.ts.slice(11) + '</div></li>';
  }).join('') : '<li class="muted">' + t('noNotifs') + '</li>';
}

function toggleNotifications() {
  var panel = document.getElementById('notif-panel');
  panel.hidden = !panel.hidden;
  if (panel.hidden && S.notifs.some(function (n) { return !n.read; })) act({ type: 'readNotifs' });   // mark as read when closed
}

/* ---------- toast message ---------- */
var toastTimer = null;
function toast(msg, isError) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' danger' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, 4000);
}

/* ---------- helpers for the data ---------- */
function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function userName(uid) { var u = find(S.users, uid); return u ? u.name : ''; }
function studentName(sid) { var st = find(S.students, sid); return st ? userName(st.user) : ''; }
function supervisorUser(supId) { return S.users.filter(function (u) { return u.ref === supId; })[0] || null; }
function supervisorName(supId) { var u = supervisorUser(supId); return u ? u.name : ''; }
function companyName(cid) { var c = find(S.companies, cid); return c ? c.name : ''; }
function oppOfPlacement(pid) { var p = find(S.placements, pid); return p ? find(S.opps, p.opp) : null; }
function myStudent() { return find(S.students, ME.ref); }

/* working days are Sunday to Thursday */
function addDays(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
function workdays(from, to) {
  var out = [], d = from;
  while (d <= to) { var w = new Date(d + 'T12:00:00Z').getUTCDay(); if (w <= 4) out.push(d); d = addDays(d, 1); }
  return out;
}
/* attendance rate = days checked in (not rejected) / working days so far */
function attendanceRate(sid) {
  var st = find(S.students, sid);
  if (!st || !st.placement) return null;
  var p = find(S.placements, st.placement);
  var days = workdays(p.start, TODAY < p.end ? TODAY : p.end).length;
  var got = S.attendance.filter(function (a) { return a.student === sid && a.status !== 'Rejected'; }).length;
  return days ? Math.min(100, Math.round(got * 100 / days)) : 0;
}

/* ---------- small HTML builders ---------- */
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function statusText(st) { return LANG === 'ar' ? (STATUS_AR[st] || t(st)) : (I18N.en[st] || st); }
function badge(st) { return '<span class="badge badge-' + String(st).toLowerCase().replace(/\s+/g, '-') + '">' + esc(statusText(st)) + '</span>'; }
function initials(name) { var p = String(name).replace(/^Dr\.\s*/, '').split(/\s+/); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
function avatar(user, cls, id) {
  var idAttr = id ? ' id="' + id + '"' : '';
  if (user && user.avatar) return '<img class="avatar ' + (cls || '') + '"' + idAttr + ' src="' + ROOT + esc(user.avatar) + '" alt="">';
  return '<span class="avatar ' + (cls || '') + '"' + idAttr + '>' + esc(initials(user ? user.name : '?')) + '</span>';
}
function who(uid, sub) {
  var u = find(S.users, uid);
  return '<span class="who">' + avatar(u) + '<span>' + esc(u ? u.name : '') + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></span>';
}
function emptyBox(title, body) { return '<div class="empty"><b>' + esc(title) + '</b>' + (body ? esc(body) : '') + '</div>'; }
function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

/* table rows: rows = [[cell, cell, ...], ...]; cells are HTML */
function tableRows(rows, cols, emptyText) {
  if (!rows.length) return '<tr><td colspan="' + cols + '" class="muted">' + esc(emptyText || t('noRecords')) + '</td></tr>';
  return rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('');
}

/* ---------- dates ---------- */
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function fmtDate(d) {
  if (!d) return '';
  var m = +d.slice(5, 7) - 1, day = +d.slice(8, 10), y = d.slice(0, 4);
  return day + ' ' + (LANG === 'ar' ? MONTHS_AR[m] : MONTHS[m]) + ' ' + y;
}
function longToday() {
  var days = LANG === 'ar' ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(TODAY + 'T12:00:00Z').getUTCDay()] + ', ' + fmtDate(TODAY);
}
function relDay(d) {
  var diff = Math.round((new Date(TODAY + 'T12:00:00Z') - new Date(d.slice(0, 10) + 'T12:00:00Z')) / 864e5);
  if (diff <= 0) return t('today');
  if (diff === 1) return t('yesterday');
  return t('daysAgo', { n: diff });
}
function greeting() { var hr = new Date().getHours(); return hr < 12 ? t('goodMorning') : hr < 17 ? t('goodAfternoon') : t('goodEvening'); }
function nowTime() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

/* ---------- shared parts used by several roles ---------- */
/* list of evaluations (student, company, supervisor pages) */
function evalCards(evals, showStudent) {
  if (!evals.length) return emptyBox(t('noEvals'));
  return evals.map(function (e) {
    var low = e.score < 60;
    return '<div class="card eval"><div class="top"><div>' +
      (showStudent ? '<b>' + esc(studentName(e.student)) + '</b><br>' : '') +
      '<span class="muted">' + (e.type === 'Company' ? t('companyEval') : t('academicEval')) + ' · ' + fmtDate(e.date) + '</span></div>' +
      '<span class="score' + (low ? ' low' : '') + '">' + e.score + '<span class="muted small">/100</span></span></div>' +
      '<div class="bar' + (low ? ' low' : '') + '"><span style="width:' + e.score + '%"></span></div>' +
      '<p>' + esc(e.comments) + '</p></div>';
  }).join('');
}

/* recent activity list (dashboards) */
function activityList(studentIds, opts) {
  opts = opts || {};
  var items = [];
  var inScope = function (sid) { return !studentIds || studentIds.indexOf(sid) >= 0; };
  S.attendance.forEach(function (a) {
    if (inScope(a.student) && (!opts.pids || opts.pids.indexOf(a.placement) >= 0))
      items.push({ tone: a.status === 'Rejected' ? 'danger' : 'success', who: studentName(a.student), date: a.date, time: a.time,
        text: opts.self ? t('aYouCheckIn', { x: a.time }) : t('aCheckIn', { n: studentName(a.student), x: a.time }) });
  });
  S.apps.forEach(function (a) {
    var o = find(S.opps, a.opp), key = a.status === 'Accepted' ? 'aAccepted' : a.status === 'Rejected' ? 'aRejectedApp' : 'aApplied';
    if (inScope(a.student) && (!opts.oppIds || opts.oppIds.indexOf(a.opp) >= 0))
      items.push({ tone: a.status === 'Accepted' ? 'success' : a.status === 'Rejected' ? 'danger' : 'info', who: studentName(a.student), date: a.date, text: t(key, { n: studentName(a.student), o: o ? o.title : '' }) });
  });
  if (!opts.oppIds) S.reports.forEach(function (r) {
    if (inScope(r.student)) items.push({ tone: 'info', who: studentName(r.student), date: r.date, text: t('aReport', { n: studentName(r.student) }) });
  });
  S.evals.forEach(function (e) {
    if (inScope(e.student)) items.push({ tone: 'warning', who: studentName(e.student), date: e.date, text: t('aEval', { n: studentName(e.student), x: e.type === 'Company' ? t('companyEval') : t('academicEval'), s: e.score }) });
  });
  items.sort(function (a, b) { var x = a.date + (a.time || ''), y = b.date + (b.time || ''); return x < y ? 1 : x > y ? -1 : 0; });
  items = items.slice(0, opts.limit || 6);
  if (!items.length) return emptyBox(t('noActivity'));
  return '<ul class="feed">' + items.map(function (it) {
    return '<li><span class="dot ' + it.tone + '"></span><div><div class="top"><b>' + esc(opts.self ? '' : it.who) + '</b><span>' +
      relDay(it.date) + (it.time ? ' · ' + it.time : '') + '</span></div><p>' + esc(it.text) + '</p></div></li>';
  }).join('') + '</ul>';
}

/* student details pop-up (company trainees, supervisor students) */
function openStudent(sid) {
  var x = find(S.students, sid), name = studentName(sid), u = find(S.users, x.user);
  var o = x.placement ? oppOfPlacement(x.placement) : null, rate = attendanceRate(sid);
  var rep = S.reports.filter(function (r) { return r.student === sid; })[0];
  var recent = S.attendance.filter(function (a) { return a.student === sid; }).slice(-5).reverse();
  var html = '<div class="modal-head">' + avatar(u, 'avatar-lg') + '<div><h2>' + esc(name) + '</h2><p class="muted" style="margin:0">' +
    esc(x.major) + ' · GPA ' + esc(x.gpa) + '</p></div><div style="margin-inline-start:auto;text-align:center"><b style="font-size:22px">' +
    (rate == null ? '—' : rate + '%') + '</b><br><span class="small muted">' + t('attendanceRate') + '</span></div></div>';
  if (o) html += '<ul class="kv"><li><span>' + t('placement') + '</span><b>' + esc(o.title + ' · ' + companyName(o.company)) + '</b></li>' +
    '<li><span>' + t('supervisor') + '</span><b>' + esc(supervisorName(x.supervisor) || t('unassigned')) + '</b></li>' +
    '<li><span>' + t('finalReport') + '</span><span>' + (rep ? '<a href="' + reportLink(rep) + '" target="_blank">' + esc(rep.file) + '</a> ' : '') + badge(rep ? rep.status : 'Not submitted') + '</span></li></ul>';
  else html += '<p class="muted">' + t('noPlacementTitle') + '</p>';
  if (recent.length) html += '<h3 style="margin-top:16px">' + t('recentCheckins') + '</h3><ul class="kv">' +
    recent.map(function (a) { return '<li><span>' + fmtDate(a.date) + ' · ' + a.time + '</span>' + badge(a.status) + '</li>'; }).join('') + '</ul>';
  html += '<h3 style="margin:16px 0 8px">' + t('evaluations') + '</h3>' + evalCards(S.evals.filter(function (e) { return e.student === sid; }));
  html += '<button class="btn btn-light btn-block" onclick="closeModal()" style="margin-top:12px">' + t('close') + '</button>';
  var bg = document.createElement('div');
  bg.className = 'modal-bg'; bg.id = 'modal';
  bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
  bg.addEventListener('click', function (e) { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { var m = document.getElementById('modal'); if (m) m.remove(); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

/* student cards (company trainees / supervisor students) */
function studentCards(list, badgeFor) {
  if (!list.length) return emptyBox(t('noRecords'));
  return '<div class="people">' + list.map(function (x) {
    var rate = attendanceRate(x.id), o = x.placement ? oppOfPlacement(x.placement) : null;
    return '<button class="card person" onclick="openStudent(\'' + x.id + '\')">' +
      '<div class="row">' + who(x.user, o ? companyName(o.company) : x.major) + '<span style="margin-inline-start:auto">' + badge(badgeFor(x)) + '</span></div>' +
      '<div class="stat-row" style="margin-top:12px"><span>' + t('attendanceRate') + '</span><b>' + (rate == null ? '—' : rate + '%') + '</b></div>' +
      '<div class="bar"><span style="width:' + (rate || 0) + '%"></span></div></button>';
  }).join('') + '</div>';
}

/* final report file: opens through api/file.php (permission is checked by PHP) */
function reportLink(rep) { return ROOT + 'api/file.php?key=' + encodeURIComponent(rep.fileKey); }

/* evaluation form (company: Company evaluation, supervisor: Academic evaluation) */
function setupEvalForm(students, evalType, render) {
  var form = document.getElementById('eval-form');
  if (!students.length) { form.hidden = true; return; }
  var sel = document.getElementById('ev-student');
  var keep = sel.value;
  sel.innerHTML = students.map(function (x) { return '<option value="' + x.id + '">' + esc(studentName(x.id)) + '</option>'; }).join('');
  if (keep) sel.value = keep;
  var range = document.getElementById('ev-score');
  range.oninput = function () { setText('ev-score-out', range.value); };
  form.onsubmit = function (e) {
    e.preventDefault();
    var comments = document.getElementById('ev-comments').value.trim();
    if (comments.length < 10) { setText('ev-error', t('commentsRequired')); return; }
    setText('ev-error', '');
    act({ type: 'submitEval', student: sel.value, evalType: evalType, score: +range.value, comments: comments }, t('evalSaved'), render)
      .then(function (res) { if (res.ok) { document.getElementById('ev-comments').value = ''; range.value = 80; setText('ev-score-out', '80'); } });
  };
}

/* ---------- start: theme and language before the page is shown ---------- */
(function () {
  var theme = localStorage.getItem('ecoop-theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
})();
