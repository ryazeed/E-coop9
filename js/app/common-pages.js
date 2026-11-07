/* ================= SETTINGS (all roles) ================= */
var PREFS = [['attendance', 'pAttendance', 'pAttendanceD'], ['applications', 'pApplications', 'pApplicationsD'], ['reports', 'pReports', 'pReportsD'], ['summary', 'pSummary', 'pSummaryD']];
function Settings() {
  var app = useApp(), s = app.state, t = app.t, me = app.me;
  function pref(k) { var v = s.prefs[me.id + ':' + k]; return v == null ? k !== 'summary' : v; }
  function onPhoto(e) {
    var f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    readAvatar(f).then(function (photo) { app.act({ type: 'avatar', user: me.id, photo: photo }, t('photoUpdated'), 'success', true); },
      function (err) { app.toast('danger', err.message === 'size' ? t('photoTooBig') : t('photoType')); });
  }
  return h(Page, { title: t('settingsTitle'), extra: h('div', { className: 'glass glass-me' },
    h('div', { className: 'me-photo' }, h(Avatar, { name: me.name, size: 'xl' }),
      h('button', { type: 'button', className: 'photo-edit', title: me.avatar ? t('changePhoto') : t('addPhoto'), 'aria-label': me.avatar ? t('changePhoto') : t('addPhoto'), onClick: function () { var el = document.getElementById('avatar-input'); if (el) el.click(); } }, h(Icon, { name: 'camera', size: 18 })),
      h('input', { id: 'avatar-input', type: 'file', accept: 'image/png,image/jpeg,image/webp', className: 'sr-only', tabIndex: -1, 'aria-hidden': 'true', onChange: onPhoto })),
    h('div', { className: 'me-info' }, h('p', { className: 'glass-value' }, me.name), h('p', { className: 'glass-note' }, t(ROLE_KEY[me.role]) + ' · ' + me.email),
      h('div', { className: 'photo-actions' },
        me.avatar ? h('button', { className: 'glass-btn', onClick: function () { app.act({ type: 'avatar', user: me.id, photo: null }, t('photoRemoved'), 'info', true); } }, t('removePhoto')) : null,
        h('span', { className: 'glass-note' }, t('photoHint'))))) },
    h('div', { className: 'split split-even' },
      h('div', { className: 'stack' },
        h(Section, { title: t('profileSection') }, h(Card, null, me.role === 'Student' ? h(ProfileForm) : me.role === 'Company' ? h(CompanyProfileForm) : h('div', { className: 'kv-list' },
          h('div', null, h('span', null, t('fullName')), h('b', null, me.name)), h('div', null, h('span', null, t('email')), h('b', { className: 'ltr' }, me.email)), userPhone(s, me) ? h('div', null, h('span', null, t('phone')), h('b', { className: 'ltr' }, userPhone(s, me))) : null, h('div', null, h('span', null, t('role')), h('b', null, t(ROLE_KEY[me.role])))))),
        h(Section, { title: t('helpSection') }, h(Card, { className: 'stack' }, h(C.Button, { variant: 'secondary', onClick: app.startTour }, t('showTour')), h(C.Button, { variant: 'danger', onClick: app.signOut }, t('signOut'))))),
      h('div', { className: 'stack' },
        h(Section, { title: t('notifSection') }, h(Card, { className: 'switches' }, PREFS.map(function (p) {
          return h(Switch, { key: p[0], id: 'pref-' + p[0], title: t(p[1]), desc: t(p[2]), on: pref(p[0]), onChange: function (v) { app.act({ type: 'pref', user: me.id, key: p[0], value: v }, t('prefSaved'), 'success', false); } });
        }))),
        h(Section, { title: t('appearance') }, h(Card, { className: 'stack' },
          h(Segmented, { id: 'set-lang', label: t('languageLabel'), value: app.lang, onChange: app.setLang, options: [{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }] }),
          h(Segmented, { id: 'set-theme', label: t('themeLabel'), value: app.theme, onChange: app.setTheme, options: [{ value: 'light', label: t('themeLight') }, { value: 'dark', label: t('themeDark') }] }))))));
}

/* ================= ONBOARDING ================= */
var TOUR = { Student: 'tStudent', Company: 'tCompany', Supervisor: 'tSupervisor', Admin: 'tAdmin' };
var TOUR_ICON = { Student: ['brief', 'key', 'doc'], Company: ['plus', 'users', 'key'], Supervisor: ['users', 'check', 'star'], Admin: ['shield', 'users', 'chart'] };
function Tour(p) {
  var app = useApp(), t = app.t, step = R.useState(0), n = step[0], pre = TOUR[app.me.role];
  return h(Sheet, { label: t(pre + (n + 1) + 't'), onClose: p.onClose, hideClose: true },
    h('div', { className: 'tour' },
      h('span', { className: 'tour-icon' }, h(Icon, { name: TOUR_ICON[app.me.role][n], size: 32 })),
      h('p', { className: 'tour-step' }, fill(t('tourStep'), { n: n + 1, m: 3 })),
      h('h2', { className: 'tour-title' }, t(pre + (n + 1) + 't')),
      h('p', { className: 'tour-text' }, t(pre + (n + 1) + 'd')),
      h('div', { className: 'dots', 'aria-hidden': true }, [0, 1, 2].map(function (i) { return h('span', { key: i, className: 'dot' + (i === n ? ' on' : '') }); })),
      h('div', { className: 'tour-actions' },
        n > 0 ? h(C.Button, { variant: 'secondary', onClick: function () { step[1](n - 1); } }, t('tourBack')) : h(C.Button, { variant: 'ghost', onClick: p.onClose }, t('tourSkip')),
        n < 2 ? h(C.Button, { onClick: function () { step[1](n + 1); } }, t('tourNext')) : h(C.Button, { onClick: p.onClose }, t('tourDone')))));
}

/* ================= NOTIFICATIONS ================= */
function Notifications(p) {
  var app = useApp(), s = app.state, t = app.t;
  var mine = s.notifs.filter(function (n) { return n.user === app.me.id; }).slice(0, 20);
  return h(Sheet, { label: t('notifications'), onClose: p.onClose,
    head: h('div', { className: 'sheet-head sheet-head-row' }, h('p', { className: 'sheet-name' }, t('notifications')), mine.some(function (n) { return !n.read; }) ? h(C.Button, { variant: 'ghost', size: 'sm', onClick: function () { app.dispatch({ type: 'readNotifs', user: app.me.id }); } }, t('markAllRead')) : null) },
    mine.length ? h('ul', { className: 'notifs' }, mine.map(function (n) {
      return h('li', { key: n.id, className: 'notif' + (n.read ? '' : ' unread') }, h('span', { className: 'notif-dot', 'aria-hidden': true }),
        h('div', null, h('p', { className: 'notif-text' }, fill(t(n.key), Object.assign({}, n.args, n.args.d ? { d: fmtDate(n.args.d, app.lang) } : {}))), h('p', { className: 'notif-when' }, relDay(n.ts, t) + ' · ' + n.ts.slice(11))));
    })) : h(Empty, { title: t('noNotifs') }));
}

/* ================= SHARED HELPERS ================= */
function userPhone(s, u) { if (!u) return ''; if (u.phone) return u.phone; if (u.role === 'Student') { var st = by(s.students, u.ref); return st ? st.phone : ''; } return USER_PHONES[u.id] || ''; }
