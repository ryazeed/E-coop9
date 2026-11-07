var R = React, h = R.createElement, C = window.COOP;
var STORE = 'easy-coop-demo-v6';

/* ---------- lookups ---------- */
function by(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function userName(s, uid) { var u = by(s.users, uid); return u ? u.name : ''; }
function stuName(s, sid) { var st = by(s.students, sid); return st ? userName(s, st.user) : ''; }
function supUser(s, supId) { return s.users.filter(function (x) { return x.ref === supId; })[0] || null; }
function supName(s, supId) { var u = supUser(s, supId); return u ? u.name : ''; }
function oppOfPlacement(s, pid) { var p = by(s.placements, pid); return p ? by(s.opps, p.opp) : null; }
function compName(s, cid) { var c = by(s.companies, cid); return c ? c.name : ''; }
function compUser(s, cid) { var c = by(s.companies, cid); return c ? c.user : null; }
function frac(x, y) { return '⁦' + x + ' / ' + y + '⁩'; }
function nowTime() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function fill(str, args) { return String(str).replace(/\{(\w+)\}/g, function (m, k) { return args && args[k] != null ? args[k] : m; }); }
function initials(name) { var p = String(name).replace(/^Dr\.\s*/, '').split(/\s+/); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
function attRate(s, sid) {
  var st = by(s.students, sid); if (!st || !st.placement) return null;
  var p = by(s.placements, st.placement);
  var days = workdays(p.start, TODAY < p.end ? TODAY : p.end).length;
  var got = s.attendance.filter(function (a) { return a.student === sid && a.status !== 'Rejected'; }).length;
  return days ? Math.min(100, Math.round(got * 100 / days)) : 0;
}
function validFile(f) { return f && /\.(pdf|docx)$/i.test(f.name) && f.size <= 10 * 1024 * 1024; }

/* ---------- state ---------- */
/* the data comes from MySQL through api/state.php; the browser only keeps settings like language and theme */
function load() { return (window.ECOOP_BOOT && window.ECOOP_BOOT.state) || seed(); }
function save(s) { /* saved by the server */ }
function lsGet(k, d) { try { var v = localStorage.getItem(STORE + '-' + k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(STORE + '-' + k); else localStorage.setItem(STORE + '-' + k, v); } catch (e) {} }
function id(s, p) { s.seq += 1; return p + s.seq; }
function stamp() { return TODAY + 'T' + nowTime(); }
function log(s, uid, action) { s.audit.unshift({ id: id(s, 'l'), user: uid, action: action, ts: stamp() }); }
function notify(s, uid, key, args) { if (uid) s.notifs.unshift({ id: id(s, 'n'), user: uid, key: key, args: args || {}, ts: stamp(), read: false }); }

function reducer(state, a) {
  if (a.type === 'reset') return seed();
  if (a.type === 'restore') return a.state;
  var s = JSON.parse(JSON.stringify(state));
  switch (a.type) {
    case 'apply': {
      s.apps.unshift({ id: id(s, 'a'), student: a.student, opp: a.opp, status: 'Submitted', date: TODAY });
      var op = by(s.opps, a.opp); notify(s, compUser(s, op.company), 'nNewApp', { n: stuName(s, a.student), o: op.title }); break;
    }
    case 'appDecision': {
      var ap = by(s.apps, a.id), o0 = by(s.opps, ap.opp); ap.status = a.status;
      if (a.status === 'Accepted') {
        var pl = s.placements.filter(function (p) { return p.opp === ap.opp; })[0];
        if (!pl) { pl = { id: id(s, 'p'), opp: ap.opp, start: '2026-10-04', end: '2026-12-24', status: 'Active' }; s.placements.push(pl); }
        by(s.students, ap.student).placement = pl.id;
      }
      notify(s, by(s.students, ap.student).user, a.status === 'Accepted' ? 'nAppAccepted' : 'nAppRejected', { o: o0.title });
      log(s, a.by, (a.status === 'Accepted' ? 'Accepted' : 'Rejected') + ' application from ' + stuName(s, ap.student) + ' for ' + o0.title);
      break;
    }
    case 'postOpp': {
      s.opps.unshift(Object.assign({ id: id(s, 'o'), status: 'Pending Approval', posted: TODAY }, a.opp)); log(s, a.by, 'Posted opportunity ' + a.opp.title);
      s.users.filter(function (u) { return u.role === 'Admin'; }).forEach(function (u) { notify(s, u.id, 'nOppNew', { o: a.opp.title }); });
      break;
    }
    case 'oppDecision': { var o = by(s.opps, a.id); o.status = a.status; notify(s, compUser(s, o.company), a.status === 'Open' ? 'nOppApproved' : 'nOppRejected', { o: o.title }); log(s, a.by, (a.status === 'Open' ? 'Approved' : 'Rejected') + ' opportunity ' + o.title); break; }
    case 'companyDecision': { var c = by(s.companies, a.id); c.status = a.status; log(s, a.by, a.status + ' company ' + c.name); break; }
    case 'genCode': {
      s.codes.forEach(function (k) { if (k.placement === a.placement && k.status === 'Active') k.status = 'Expired'; });
      s.codes.push({ id: id(s, 'k'), placement: a.placement, code: String(100000 + Math.floor(Math.random() * 900000)), date: TODAY, status: 'Active' });
      log(s, a.by, 'Generated daily code for ' + oppOfPlacement(s, a.placement).title); break;
    }
    case 'checkIn': {
      s.attendance.push({ id: id(s, 't'), student: a.student, placement: a.placement, date: TODAY, time: a.time, status: 'Pending' });
      var sv = supUser(s, by(s.students, a.student).supervisor); if (sv) notify(s, sv.id, 'nCheckIn', { n: stuName(s, a.student) }); break;
    }
    case 'attDecision': a.ids.forEach(function (x) { var r = by(s.attendance, x); r.status = a.status; notify(s, by(s.students, r.student).user, a.status === 'Approved' ? 'nAttApproved' : 'nAttRejected', { d: r.date }); }); log(s, a.by, a.status + ' ' + a.ids.length + ' attendance record(s)'); break;
    case 'submitReport': {
      var r = s.reports.filter(function (x) { return x.student === a.student; })[0];
      if (r) { r.file = a.file; r.fileKey = a.fileKey; r.date = TODAY; r.status = 'Submitted'; } else s.reports.push({ id: id(s, 'r'), student: a.student, file: a.file, fileKey: a.fileKey, date: TODAY, status: 'Submitted' });
      var sv2 = supUser(s, by(s.students, a.student).supervisor); if (sv2) notify(s, sv2.id, 'nReportIn', { n: stuName(s, a.student) }); break;
    }
    case 'reportDecision': { var rp = by(s.reports, a.id); rp.status = a.status; notify(s, by(s.students, rp.student).user, a.status === 'Approved' ? 'nReportApproved' : 'nReportRevision'); log(s, a.by, a.status + ' final report of ' + stuName(s, rp.student)); break; }
    case 'submitEval': s.evals.unshift({ id: id(s, 'e'), student: a.student, type: a.evalType, by: a.by, score: a.score, comments: a.comments, date: TODAY }); notify(s, by(s.students, a.student).user, 'nEvalIn', { x: a.evalType === 'Company' ? 'company' : 'academic', s: a.score }); log(s, a.by, 'Submitted ' + a.evalType.toLowerCase() + ' evaluation for ' + stuName(s, a.student)); break;
    case 'userStatus': { var u = by(s.users, a.id); u.status = a.status; log(s, a.by, (a.status === 'Suspended' ? 'Suspended' : 'Activated') + ' account ' + u.name); break; }
    case 'assign': { by(s.students, a.student).supervisor = a.supervisor; notify(s, by(s.students, a.student).user, 'nSupervisor', { n: supName(s, a.supervisor) }); log(s, a.by, 'Assigned ' + supName(s, a.supervisor) + ' to ' + stuName(s, a.student)); break; }
    case 'profile': Object.assign(by(s.students, a.student), a.fields); Object.assign(by(s.users, by(s.students, a.student).user), a.userFields); break;
    case 'readNotifs': s.notifs.forEach(function (n) { if (n.user === a.user) n.read = true; }); break;
    case 'pref': s.prefs[a.user + ':' + a.key] = a.value; break;
    case 'contact': s.users.filter(function (u) { return u.role === 'Admin'; }).forEach(function (u) { notify(s, u.id, 'nContact', { n: a.msg.name, e: a.msg.email, x: a.msg.topic, m: a.msg.msg.length > 120 ? a.msg.msg.slice(0, 117) + '\u2026' : a.msg.msg }); }); break;
    case 'register': {
      s.users.push({ id: a.uid, name: a.name, email: a.email, role: a.kind, status: 'Active', ref: a.ref, phone: a.phone, dept: a.kind === 'Supervisor' ? a.dept : undefined, pwHash: a.pwHash, pwSalt: a.pwSalt });
      if (a.kind === 'Student') s.students.push({ id: a.ref, user: a.uid, major: a.major, gpa: a.gpa, phone: a.phone, cv: '', supervisor: null, placement: null });
      else if (a.kind === 'Company') s.companies.push({ id: a.ref, user: a.uid, name: a.name, city: a.city, status: 'Pending Approval' });
      notify(s, a.uid, 'nWelcome', {});
      s.users.filter(function (u) { return u.role === 'Admin' && u.id !== a.uid; }).forEach(function (u) { notify(s, u.id, a.kind === 'Company' ? 'nCompanyPending' : a.kind === 'Supervisor' ? 'nNewSupervisor' : a.kind === 'Admin' ? 'nNewAdmin' : 'nNewStudent', { n: a.name, dp: a.dept, e: a.email }); });
      log(s, a.uid, 'Created ' + a.kind.toLowerCase() + ' account ' + a.name);
      break;
    }
    case 'companyProfile': {
      var cp = by(s.companies, a.company), cu = by(s.users, a.user);
      cp.name = a.name; cp.city = a.city; cu.name = a.name; cu.phone = a.phone;
      log(s, a.user, 'Updated company profile ' + a.name); break;
    }
    case 'logExport': log(s, a.by, 'Exported ' + a.report + ' report (' + a.format + ')'); break;
    case 'avatar': by(s.users, a.user).avatar = a.photo || null; break;
  }
  return s;
}

/* ---------- context + formatting ---------- */
var Ctx = R.createContext(null);
function useApp() { return R.useContext(Ctx); }
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d, lang) {
  if (!d) return '';
  var y = d.slice(0, 4), m = +d.slice(5, 7), day = +d.slice(8, 10);
  if (lang !== 'ar') return day + ' ' + MON[m - 1] + ' ' + y;
  try { return new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d.slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d.slice(0, 10); }
}
function longToday(lang) {
  try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(TODAY + 'T12:00:00Z')); } catch (e) { return TODAY; }
}
function relDay(d, t) {
  var diff = Math.round((new Date(TODAY + 'T12:00:00Z') - new Date(d.slice(0, 10) + 'T12:00:00Z')) / 864e5);
  if (diff <= 0) return t('today'); if (diff === 1) return t('yesterday'); return fill(t('daysAgo'), { n: diff });
}
function greeting(t) { var hr = new Date().getHours(); return hr < 12 ? t('goodMorning') : hr < 17 ? t('goodAfternoon') : t('goodEvening'); }

/* ---------- icons (outline, 24 grid) ---------- */
var IC = {
  check: 'M20 6L9 17l-5-5', clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', brief: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  doc: 'M6 3h9l3 3v15H6zM9 11h6M9 15h6', star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z', chart: 'M4 20h16M7 16v-5M12 16V7M17 16v-8',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c1.9.7 3.2 2.6 3.5 5.2',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z', bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2 1.1L14.8 21h-4l-.3-2a7.6 7.6 0 0 1-2-1.1l-1.9.7-2-3.4 1.6-1.2a7.7 7.7 0 0 1 0-2.3L4.6 10.5l2-3.4 1.9.7a7.6 7.6 0 0 1 2-1.1l.3-2.2h4l.3 2.2a7.6 7.6 0 0 1 2 1.1l1.9-.7 2 3.4-1.6 1.2a7.7 7.7 0 0 1 0 2.3z',
  plus: 'M12 5v14M5 12h14', key: 'M4 5h16v14H4zM8 10v4M12 10v4M16 10v4', x: 'M6 6l12 12M18 6L6 18', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  minus: 'M5 12h14', camera: 'M4 8h3l2-2.5h6L17 8h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', chat: 'M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5', send: 'M4 12l16-8-6 16-3-7z', upload: 'M12 16V4M7 9l5-5 5 5M4 20h16', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'
};
function Icon(p) { return h('svg', { className: 'ic' + (p.className ? ' ' + p.className : ''), viewBox: '0 0 24 24', width: p.size || 20, height: p.size || 20, 'aria-hidden': true }, h('path', { d: IC[p.name] })); }
function Avatar(p) {
  var app = useApp(), photo = p.photo;
  if (!photo && app) { var u = app.state.users.filter(function (x) { return x.name === p.name; })[0]; photo = u && u.avatar; }
  var cls = 'avatar' + (p.size ? ' avatar-' + p.size : '');
  return photo ? h('img', { className: cls + ' avatar-img', src: photo, alt: '' }) : h('span', { className: cls, 'aria-hidden': true }, initials(p.name));
}
/* crop the chosen image to a centred square and shrink it to 256px so it fits in browser storage */
function readAvatar(file) {
  return new Promise(function (res, rej) {
    if (!file || !/^image\/(png|jpe?g|webp)$/.test(file.type)) return rej(new Error('type'));
    if (file.size > 5 * 1024 * 1024) return rej(new Error('size'));
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var side = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas'); c.width = c.height = 256;
      c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('read')); };
    img.src = url;
  });
}

/* ---------- building blocks ---------- */
function Badge(p) { var app = useApp(); return h(C.StatusBadge, { status: p.status }, app.lang === 'ar' ? (STATUS_AR[p.status] || p.status) : p.status); }
function Page(p) {
  return h('div', { className: 'page' },
    h('section', { className: 'hero' },
      h('div', { className: 'wrap hero-in' },
        h('div', { className: 'hero-text' }, p.eyebrow ? h('p', { className: 'hero-eyebrow' }, p.eyebrow) : null, h('h1', { className: 'hero-title' }, p.title), p.lead ? h('p', { className: 'hero-lead' }, p.lead) : null),
        p.action ? h('div', { className: 'hero-action' }, p.action) : null,
        p.extra ? h('div', { className: 'hero-extra' }, p.extra) : null)),
    h('div', { className: 'wrap content' }, p.children));
}
function Section(p) { return h('section', { className: 'section' }, h('div', { className: 'section-head' }, h('div', null, h('h2', { className: 'h2' }, p.title), p.lead ? h('p', { className: 'section-lead' }, p.lead) : null), p.aside || null), p.children); }
function Empty(p) { return h('div', { className: 'empty' }, h('p', { className: 'empty-title' }, p.title), p.children ? h('div', { className: 'empty-body' }, p.children) : null); }
function Grid(p) { return h('div', { className: 'grid grid-' + (p.min || 'md') }, p.children); }
function Row(p) { return h('div', { className: 'row' + (p.end ? ' row-end' : '') }, p.children); }
function Card(p) { return h('div', { className: 'card' + (p.className ? ' ' + p.className : '') }, p.children); }

function Tiles(p) {
  return h('nav', { className: 'tiles', 'aria-label': p.label },
    p.items.map(function (it, i) {
      return h('button', { key: it.label, className: 'tile' + (it.wide ? ' tile-wide' : '') + (i % 4 === 1 || i % 4 === 2 ? ' tile-b' : ''), onClick: it.onClick },
        h(Icon, { name: it.icon, size: 22 }), h('span', { className: 'tile-label' }, it.label), it.count ? h('span', { className: 'tile-count' }, it.count) : null);
    }));
}

function HeroProgress(p) {
  return h('div', { className: 'glass' },
    h('div', { className: 'glass-top' }, h('span', { className: 'glass-label' }, p.label), h('span', { className: 'glass-value' }, p.value)),
    p.pct != null ? h('div', { className: 'glass-bar', role: 'progressbar', 'aria-valuenow': p.pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': p.label }, h('span', { style: { width: p.pct + '%' } })) : null,
    p.note ? h('p', { className: 'glass-note' }, p.note) : null);
}

function Feed(p) {
  var app = useApp(), t = app.t;
  if (!p.items.length) return h(Empty, { title: t('noActivity') });
  return h('ol', { className: 'feed' }, p.items.map(function (it) {
    return h('li', { key: it.key, className: 'feed-item feed-' + (it.tone || 'neutral') },
      h('span', { className: 'feed-dot' }, h(Icon, { name: it.icon, size: 18 })),
      h('div', { className: 'feed-body' },
        h('div', { className: 'feed-top' }, it.who ? h('span', { className: 'feed-who' }, h(Avatar, { name: it.who, size: 'sm' }), it.who) : h('span'), h('span', { className: 'feed-when' }, relDay(it.date, t) + (it.time ? ' · ' + it.time : ''))),
        h('p', { className: 'feed-text' }, it.text)));
  }));
}

function activityFor(app, scope) {
  var s = app.state, t = app.t, items = [];
  var inScope = scope.students ? function (sid) { return scope.students.indexOf(sid) >= 0; } : function () { return true; };
  s.attendance.forEach(function (a) { if (inScope(a.student) && (!scope.pids || scope.pids.indexOf(a.placement) >= 0)) items.push({ key: a.id, icon: 'check', tone: a.status === 'Rejected' ? 'danger' : 'success', who: scope.self ? null : stuName(s, a.student), date: a.date, time: a.time, text: scope.self ? fill(t('aYouCheckIn'), { x: a.time }) : fill(t('aCheckIn'), { n: stuName(s, a.student), x: a.time }) }); });
  s.apps.forEach(function (a) { var o = by(s.opps, a.opp); if (inScope(a.student) && (!scope.oppIds || scope.oppIds.indexOf(a.opp) >= 0)) items.push({ key: a.id, icon: 'brief', tone: a.status === 'Accepted' ? 'success' : a.status === 'Rejected' ? 'danger' : 'info', who: stuName(s, a.student), date: a.date, text: fill(t(a.status === 'Accepted' ? 'aAccepted' : a.status === 'Rejected' ? 'aRejectedApp' : 'aApplied'), { n: stuName(s, a.student), o: o.title }) }); });
  s.reports.forEach(function (r) { if (inScope(r.student) && !scope.oppIds) items.push({ key: r.id, icon: 'doc', tone: 'info', who: stuName(s, r.student), date: r.date, text: fill(t('aReport'), { n: stuName(s, r.student) }) }); });
  s.evals.forEach(function (e) { if (inScope(e.student) && (!scope.evalBy || scope.evalBy === e.by)) items.push({ key: e.id, icon: 'star', tone: 'warning', who: stuName(s, e.student), date: e.date, text: fill(t('aEval'), { n: stuName(s, e.student), x: e.type === 'Company' ? t('companyEval') : t('academicEval'), s: e.score }) }); });
  items.sort(function (a, b) { var x = a.date + (a.time || '00:00'), y = b.date + (b.time || '00:00'); return x < y ? 1 : x > y ? -1 : 0; });
  return items.slice(0, scope.limit || 6);
}

/* bottom sheet / dialog */
function Sheet(p) {
  var app = useApp(), ref = R.useRef(null);
  R.useEffect(function () {
    var prev = document.activeElement; if (ref.current) ref.current.focus();
    function onKey(e) { if (e.key === 'Escape') p.onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  return h('div', { className: 'sheet-wrap', onClick: function (e) { if (e.target === e.currentTarget) p.onClose(); } },
    h('div', { className: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.label, tabIndex: -1, ref: ref },
      h('div', { className: 'sheet-grip', 'aria-hidden': true }),
      p.head || null,
      h('div', { className: 'sheet-body' }, p.children),
      p.hideClose ? null : h('div', { className: 'sheet-foot' }, h(C.Button, { variant: 'secondary', block: true, onClick: p.onClose }, app.t('close')))));
}

function Stepper(p) {
  var app = useApp(), t = app.t;
  return h('div', { className: 'coop-field' },
    h('span', { className: 'coop-label', id: p.id + '-l' }, p.label),
    h('div', { className: 'stepper', role: 'group', 'aria-labelledby': p.id + '-l' },
      h('button', { type: 'button', className: 'step-btn', 'aria-label': t('decrease'), disabled: p.value <= p.min, onClick: function () { p.onChange(p.value - 1); } }, h(Icon, { name: 'minus', size: 18 })),
      h('output', { className: 'step-val', 'aria-live': 'polite' }, p.value),
      h('button', { type: 'button', className: 'step-btn', 'aria-label': t('increase'), disabled: p.value >= p.max, onClick: function () { p.onChange(p.value + 1); } }, h(Icon, { name: 'plus', size: 18 }))),
    p.help ? h('span', { className: 'coop-help' }, p.help) : null);
}
function Segmented(p) {
  return h('div', { className: 'coop-field' },
    h('span', { className: 'coop-label', id: p.id + '-l' }, p.label),
    h('div', { className: 'seg', role: 'radiogroup', 'aria-labelledby': p.id + '-l' }, p.options.map(function (o) {
      return h('button', { key: o.value, type: 'button', role: 'radio', 'aria-checked': p.value === o.value ? 'true' : 'false', className: 'seg-btn', onClick: function () { p.onChange(o.value); } }, o.label);
    })));
}
function Switch(p) {
  return h('div', { className: 'switch-row' },
    h('div', { className: 'switch-text' }, h('span', { className: 'switch-title', id: p.id + '-t' }, p.title), p.desc ? h('span', { className: 'switch-desc' }, p.desc) : null),
    h('button', { type: 'button', role: 'switch', className: 'switch', 'aria-checked': p.on ? 'true' : 'false', 'aria-labelledby': p.id + '-t', onClick: function () { p.onChange(!p.on); } }, h('span', { className: 'switch-knob' })));
}

/* live validation: errors show once a field is touched or the form was submitted */
function useForm(initial, validate) {
  var v = R.useState(initial), touched = R.useState({}), submitted = R.useState(false);
  var errs = validate(v[0]);
  return {
    values: v[0], errors: errs,
    err: function (k) { return (touched[0][k] || submitted[0]) ? errs[k] : null; },
    set: function (k, val) { var n = Object.assign({}, v[0]); n[k] = val; v[1](n); var tt = Object.assign({}, touched[0]); tt[k] = true; touched[1](tt); },
    setAll: function (obj) { v[1](Object.assign({}, v[0], obj)); },
    submit: function () { submitted[1](true); return Object.keys(errs).filter(function (k) { return errs[k]; }).length === 0; },
    reset: function (val) { v[1](val || initial); touched[1]({}); submitted[1](false); },
    tried: submitted[0]
  };
}

