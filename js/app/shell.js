/* ================= SHELL ================= */
var ROUTES = {
  Student: [['dashboard', 'navDashboard', StudentDashboard], ['opportunities', 'navOpportunities', StudentOpportunities], ['applications', 'navApplications', StudentApplications], ['attendance', 'navAttendance', StudentAttendance], ['report', 'navReport', StudentReport], ['settings', 'navSettings', Settings]],
  Company: [['overview', 'navOverview', CompanyOverview], ['postings', 'navPostings', PostingsPage], ['applicants', 'navApplicants', ApplicantsPage], ['dailycode', 'navDailyCode', DailyCodePage], ['trainees', 'navTrainees', TraineesPage], ['settings', 'navSettings', Settings]],
  Supervisor: [['students', 'navStudents', SupStudents], ['attendance', 'navAttendance', SupAttendance], ['reports', 'navReports', SupReports], ['evaluations', 'navEvaluations', SupEvals], ['academic', 'navAcademicReports', AcademicReports], ['settings', 'navSettings', Settings]],
  Admin: [['analytics', 'navAnalytics', Analytics], ['approvals', 'navApprovals', Approvals], ['users', 'navUsers', Users], ['assign', 'navAssign', Assign], ['audit', 'navAudit', Audit], ['reports', 'navInstReports', InstitutionReports], ['settings', 'navSettings', Settings]]
};
var ROLE_KEY = { Student: 'roleStudent', Company: 'roleCompany', Supervisor: 'roleSupervisor', Admin: 'roleAdmin' };

function Mark(p) {
  return h('span', { className: 'logo-tile', style: { height: p.size + 'px' }, 'aria-hidden': true }, h('img', { src: LOGO, alt: '', className: 'logo-img' }));
}


function SignIn() {
  var app = useApp(), s = app.state, t = app.t, err = R.useState(null);
  var accounts = [['u1', 'descFaisal'], ['u6', 'descReem'], ['u9', 'descCompany'], ['u13', 'descSupervisor'], ['u15', 'descAdmin']];
  return h('main', { className: 'signin coop-root' },
    h('div', { className: 'signin-hero' },
      h('button', { className: 'back', onClick: app.home }, (app.lang === 'ar' ? '→ ' : '← ') + LANDING[app.lang].backHome),
      h('div', { className: 'signin-brand' }, h(Mark, { size: 64, onDark: true }), h('p', { className: 'wordmark' }, 'E-COOP'), h('p', { className: 'signin-tag' }, t('appTagline')))),
    h('div', { className: 'signin-body' },
      h('h1', { className: 'signin-title' }, t('signInTitle')),
      h('p', { className: 'lead' }, t('signInLead')),
      err[0] ? h(C.Alert, { tone: 'danger', title: err[0] }) : null,
      h('p', { className: 'coop-label list-label' }, t('demoAccounts')),
      h('p', { className: 'caption muted' }, t('demoPasswordHint') + ' ', h('code', null, ECOOP_DEMO_PASSWORD)),
      h('ul', { className: 'accounts' }, accounts.map(function (a) {
        var u = by(s.users, a[0]);
        return h('li', { key: a[0] }, h('button', { className: 'account', onClick: function () { if (u.status !== 'Active') { err[1](t('suspendedSignIn')); return; } app.login(u.email, ECOOP_DEMO_PASSWORD).then(function (res) { if (!res.ok) err[1](res.error); }); } },
          h(Avatar, { name: u.name }),
          h('span', { className: 'account-main' },
            h('span', { className: 'account-top' }, h('span', { className: 'account-name' }, u.name), h('span', { className: 'account-role' }, t(ROLE_KEY[u.role]))),
            h('span', { className: 'account-desc' }, t(a[1])), h('span', { className: 'account-email' }, u.email))));
      })),
      h('div', { className: 'signin-foot' },
        h(C.Button, { variant: 'ghost', size: 'sm', onClick: app.toggleLang }, t('language')),
        h(C.Button, { variant: 'ghost', size: 'sm', onClick: function () { app.dispatch({ type: 'reset' }); } }, t('resetDemo'))),
      h('p', { className: 'caption muted' }, t('college'))));
}

function Shell() {
  var app = useApp(), t = app.t, routes = ROUTES[app.me.role];
  var cur = routes.filter(function (r) { return r[0] === app.page; })[0] || routes[0];
  var unread = app.state.notifs.filter(function (n) { return n.user === app.me.id && !n.read; }).length;
  var showN = R.useState(false);
  return h('div', { className: 'shell coop-root' },
    h('header', { className: 'topbar' },
      h('div', { className: 'wrap topbar-in' },
        h('a', { className: 'brand', href: '#', onClick: function (e) { e.preventDefault(); app.go(routes[0][0]); } }, h(Mark, { size: 30, onDark: true }), h('span', null, 'E-COOP')),
        h('nav', { className: 'topnav', 'aria-label': 'Main' }, routes.filter(function (r) { return r[0] !== 'settings'; }).map(function (r) {
          return h('a', { key: r[0], href: '#' + r[0], className: 'topnav-link', 'aria-current': r === cur ? 'page' : undefined, onClick: function (e) { e.preventDefault(); app.go(r[0]); } }, t(r[1]));
        })),
        h('div', { className: 'top-actions' },
          h('button', { className: 'icon-btn', onClick: function () { showN[1](true); }, 'aria-label': t('notifications') + (unread ? ' (' + unread + ')' : '') }, h(Icon, { name: 'bell', size: 20 }), unread ? h('span', { className: 'count' }, unread) : null, h('span', { className: 'icon-btn-label' }, t('notifications'))),
          h('button', { className: 'icon-btn', onClick: app.toggleLang, lang: app.lang === 'ar' ? 'en' : 'ar' }, h('span', { className: 'lang-txt' }, t('language'))),
          h('button', { className: 'me-btn', onClick: function () { app.go('settings'); }, 'aria-label': t('navSettings') }, h(Avatar, { name: app.me.name, size: 'sm' }), h('span', { className: 'me-role' }, t(ROLE_KEY[app.me.role])))))),
    h('nav', { className: 'tabs', 'aria-label': 'Main' }, routes.map(function (r) { return h('button', { key: r[0], className: 'tab', 'aria-current': r === cur ? 'page' : undefined, onClick: function () { app.go(r[0]); } }, t(r[1])); })),
    h('main', { className: 'main', key: cur[0] }, h(cur[2])),
    showN[0] ? h(Notifications, { onClose: function () { showN[1](false); app.dispatch({ type: 'readNotifs', user: app.me.id }); } }) : null,
    app.tourOpen ? h(Tour, { onClose: app.endTour }) : null);
}

function applyTheme(th) { document.documentElement.setAttribute('data-theme', th === 'dark' ? 'dark' : 'light'); }
function initialTheme() { var v = lsGet('theme', null); if (v === 'light' || v === 'dark') return v; try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; } }

function App() {
  var st = R.useReducer(reducer, null, load), state = st[0], dispatch = st[1];
  var lang = R.useState(function () { return lsGet('lang', 'en'); });
  var theme = R.useState(initialTheme);
  var who = R.useState(function () { return window.ECOOP_BOOT ? window.ECOOP_BOOT.me : null; });
  var page = R.useState(function () { return (location.hash || '').slice(1) || null; });
  var params = R.useState(null);
  var toast = R.useState(null);
  var view = R.useState(function () { return window.ECOOP_BOOT && window.ECOOP_BOOT.me ? 'app' : 'landing'; });
  var tour = R.useState(false);
  var stateRef = R.useRef(state); stateRef.current = state;
  /* send an action to the server: update the screen at once, then replace it with what MySQL saved */
  function restore(res) { if (res && res.state) dispatch({ type: 'restore', state: res.state }); if (res && res.today) TODAY = res.today; return res; }
  function send(action) {
    if (action.type === 'reset') { location.href = 'install.php'; return Promise.resolve({ ok: true }); }
    if (action.type === 'restore') { dispatch(action); return Promise.resolve({ ok: true }); }
    dispatch(action);
    return API.action(action).then(function (res) { restore(res); if (!res.ok) toast[1]({ tone: 'danger', msg: res.error, n: Date.now() }); return res; });
  }
  function server(action) { return API.action(action).then(restore); }   /* no instant update: wait for the server's answer */
  R.useEffect(function () { document.documentElement.lang = lang[0]; document.documentElement.dir = lang[0] === 'ar' ? 'rtl' : 'ltr'; lsSet('lang', lang[0]); }, [lang[0]]);
  R.useEffect(function () { applyTheme(theme[0]); lsSet('theme', theme[0]); }, [theme[0]]);
  R.useEffect(function () { if (!toast[0]) return; var tm = setTimeout(function () { toast[1](null); }, toast[0].undo ? 6000 : 3500); return function () { clearTimeout(tm); }; }, [toast[0]]);
  var me = who[0] ? by(state.users, who[0]) : null;
  if (me && me.status !== 'Active') me = null;
  R.useEffect(function () { if (me && lsGet('toured-' + me.role, null) == null) tour[1](true); }, [me && me.id]);
  var dict = I18N[lang[0]];
  var t = function (k) { return dict[k] != null ? dict[k] : (I18N.en[k] != null ? I18N.en[k] : k); };
  var app = {
    state: state, dispatch: send, server: server, lang: lang[0], theme: theme[0], me: me, page: page[0], params: params[0], t: t, tourOpen: tour[0],
    go: function (p, prm) { page[1](p); params[1](prm || null); try { history.replaceState(null, '', '#' + p); } catch (e) {} window.scrollTo(0, 0); },
    toggleLang: function () { lang[1](lang[0] === 'ar' ? 'en' : 'ar'); },
    setLang: function (v) { lang[1](v); }, setTheme: function (v) { theme[1](v); },
    openApp: function () { view[1]('signin'); window.scrollTo(0, 0); },
    home: function () { view[1]('landing'); window.scrollTo(0, 0); },
    signIn: function (uid) { who[1](uid); page[1](null); view[1]('app'); },
    login: function (email, password) { return API.login(email, password).then(function (res) { restore(res); if (res.ok) app.signIn(res.me); return res; }); },
    signOut: function () { view[1]('signin'); who[1](null); window.scrollTo(0, 0); API.logout().then(restore); },
    startTour: function () { tour[1](true); },
    endTour: function () { tour[1](false); if (me) lsSet('toured-' + me.role, '1'); },
    toast: function (tone, msg, undoState) { toast[1]({ tone: tone, msg: msg, n: Date.now(), undo: undoState || null }); },
    /* dispatch with a snackbar; undoable actions keep the previous state for Undo */
    act: function (action, msg, tone) { send(action); if (msg) app.toast(tone || 'success', msg, null); }   /* no Undo: the server already saved it */
  };
  return h(Ctx.Provider, { value: app },
    me ? h(Shell) : view[0] === 'signin' ? h(SignIn) : h(Landing, { lang: lang[0], t: t, Mark: Mark, toggleLang: app.toggleLang, openApp: app.openApp, users: state.users, signIn: app.signIn, login: app.login, sendContact: function (m) { return API.action({ type: 'contact', msg: m }); }, register: function (r) { var k = Date.now().toString(36); return API.register(r).then(function (res) { restore(res); if (res.ok) app.signIn(res.me); return res; }); } }),
    toast[0] ? h('div', { className: 'snack-wrap', key: toast[0].n },
      h('div', { className: 'snack snack-' + toast[0].tone, role: 'status' },
        h('span', { className: 'snack-icon' }, h(Icon, { name: toast[0].tone === 'danger' ? 'x' : 'check', size: 18 })),
        h('span', { className: 'snack-msg' }, toast[0].msg),
        toast[0].undo ? h('button', { className: 'snack-btn', onClick: function () { var u = toast[0].undo; dispatch({ type: 'restore', state: u }); toast[1]({ tone: 'info', msg: t('undone'), n: Date.now() }); } }, t('undo')) : null,
        h('button', { className: 'snack-x', 'aria-label': t('close'), onClick: function () { toast[1](null); } }, h(Icon, { name: 'x', size: 16 })))) : null);
}

/* start: load the signed-in user and the data from the server, then draw the app */
(function boot() {
  if (location.protocol === 'file:') { showBootError('This page was opened as a file. E-COOP needs the PHP server and MySQL.'); return; }
  API.boot().then(function (res) {
    if (!res.ok) { showBootError(res.error); return; }
    TODAY = res.today; window.ECOOP_BOOT = res;
    ReactDOM.createRoot(document.getElementById('app')).render(h(App));
  });
})();
