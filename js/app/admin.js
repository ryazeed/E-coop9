/* ================= ADMIN ================= */
function Analytics() {
  var app = useApp(), s = app.state, t = app.t;
  var studentsActive = s.students.filter(function (x) { return by(s.users, x.user).status === 'Active'; });
  var placed = studentsActive.filter(function (x) { return x.placement; }).length;
  var rate = studentsActive.length ? Math.round(placed * 100 / studentsActive.length) : 0;
  var pc = s.companies.filter(function (c) { return c.status === 'Pending Approval'; }).length, po = s.opps.filter(function (o) { return o.status === 'Pending Approval'; }).length;
  var placedStudents = s.students.filter(function (x) { return x.placement; });
  var att = placedStudents.map(function (x) { return attRate(s, x.id); }); var avgAtt = att.length ? Math.round(att.reduce(function (a, b) { return a + b; }, 0) / att.length) : 0;
  var perCo = s.companies.filter(function (c) { return c.status === 'Approved'; }).map(function (c) {
    var n = placedStudents.filter(function (x) { return oppOfPlacement(s, x.placement).company === c.id; }).length;
    var cap = s.opps.filter(function (o) { return o.company === c.id && o.status === 'Open'; }).reduce(function (a, o) { return a + o.capacity; }, 0);
    return { name: c.name, n: n, cap: cap };
  });
  var max = Math.max.apply(null, perCo.map(function (x) { return Math.max(x.cap, x.n); }).concat([1]));
  return h(Page, { eyebrow: longToday(app.lang), title: t('analyticsTitle'), lead: app.me.name,
    extra: h(HeroProgress, { label: t('placementRate'), value: rate + '%', pct: rate, note: frac(placed, studentsActive.length) + ' ' + t('placedOf') }) },
    h(Tiles, { label: t('quickActions'), items: [
      { icon: 'shield', label: t('navApprovals'), count: (pc + po) || null, onClick: function () { app.go('approvals'); } },
      { icon: 'users', label: t('navUsers'), onClick: function () { app.go('users'); } },
      { icon: 'list', label: t('navAudit'), onClick: function () { app.go('audit'); } }] }),
    h(Grid, { min: 'sm' },
      h(C.StatCard, { label: t('attendanceRate'), value: avgAtt + '%', progress: avgAtt, note: fmtDate('2026-09-06', app.lang) + ' – ' + fmtDate(TODAY, app.lang) }),
      h(C.StatCard, { label: t('activePlacements'), value: String(s.placements.filter(function (p) { return p.status === 'Active'; }).length) }),
      h(C.StatCard, { label: t('pendingApprovals'), value: String(pc + po), note: pc + ' ' + t('companiesShort') + ' · ' + po + ' ' + t('opportunitiesShort') })),
    h('div', { className: 'split' },
      h(Section, { title: t('placementsByCompany') },
        h(Card, { className: 'bars' },
          perCo.map(function (c) { return h('div', { key: c.name, className: 'bar-row' },
            h('span', { className: 'bar-label' }, c.name),
            h('span', { className: 'bar-track' }, h('span', { className: 'bar-cap', style: { width: (c.cap * 100 / max) + '%' } }), h('span', { className: 'bar-fill', style: { width: (c.n * 100 / max) + '%' } })),
            h('span', { className: 'bar-val' }, c.n + ' / ' + c.cap)); }),
          h('p', { className: 'legend' }, h('span', { className: 'sw sw-fill' }), (app.lang === 'ar' ? 'متدربون' : 'Trainees placed'), h('span', { className: 'sw sw-cap' }), (app.lang === 'ar' ? 'المقاعد المفتوحة' : 'Open seats')))),
      h(Section, { title: t('navAudit'), aside: h(C.Button, { variant: 'ghost', size: 'sm', onClick: function () { app.go('audit'); } }, t('seeAll')) }, h(AuditFeed, { limit: 5 }))));
}

function AuditFeed(p) {
  var app = useApp(), s = app.state;
  var rows = (p.rows || s.audit).slice(0, p.limit || 25);
  return h(Feed, { items: rows.map(function (l) { var tone = /Rejected|Suspended/.test(l.action) ? 'danger' : /Approved|Accepted|Activated/.test(l.action) ? 'success' : 'info';
    return { key: l.id, icon: /code/i.test(l.action) ? 'key' : /company|opportunity/i.test(l.action) ? 'shield' : /account/i.test(l.action) ? 'users' : 'list', tone: tone, who: userName(s, l.user), date: l.ts.slice(0, 10), time: l.ts.slice(11), text: l.action }; }) });
}

function Approvals() {
  var app = useApp(), s = app.state, t = app.t;
  var comps = s.companies.filter(function (c) { return c.status === 'Pending Approval'; });
  var opps = s.opps.filter(function (o) { return o.status === 'Pending Approval'; });
  function btns(onA, onR) { return h('div', { className: 'btns' }, h(C.Button, { size: 'sm', onClick: onA }, t('approve')), h(C.Button, { size: 'sm', variant: 'danger', onClick: onR }, t('reject'))); }
  return h(Page, { title: t('approvalsTitle'), lead: (comps.length + opps.length) + ' ' + t('pendingApprovals').toLowerCase() },
    h(Section, { title: t('companiesPending') + ' (' + comps.length + ')' }, h(C.DataTable, { caption: t('companiesPending'), empty: t('nothingPending'), columns: [
      { key: 'name', header: t('company') }, { key: 'city', header: t('city') }, { key: 'email', header: t('email') }, { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } },
      { key: 'act', header: t('actions'), align: 'end', render: function (r) { return btns(function () { app.act({ type: 'companyDecision', id: r.id, status: 'Approved', by: app.me.id }, t('approvedToast'), 'success', true); }, function () { app.act({ type: 'companyDecision', id: r.id, status: 'Rejected', by: app.me.id }, t('rejectedToast2'), 'info', true); }); } }],
      rows: comps.map(function (c) { return { id: c.id, name: c.name, city: c.city, email: by(s.users, c.user).email, status: c.status }; }) })),
    h(Section, { title: t('oppsPending') + ' (' + opps.length + ')' }, h(C.DataTable, { caption: t('oppsPending'), empty: t('nothingPending'), columns: [
      { key: 'title', header: t('opportunity') }, { key: 'co', header: t('company') }, { key: 'majors', header: t('majors') }, { key: 'cap', header: t('seats'), align: 'end' },
      { key: 'act', header: t('actions'), align: 'end', render: function (r) { return btns(function () { app.act({ type: 'oppDecision', id: r.id, status: 'Open', by: app.me.id }, t('approvedToast'), 'success', true); }, function () { app.act({ type: 'oppDecision', id: r.id, status: 'Rejected', by: app.me.id }, t('rejectedToast2'), 'info', true); }); } }],
      rows: opps.map(function (o) { return { id: o.id, title: o.title, co: compName(s, o.company), majors: o.majors, cap: o.capacity }; }) })));
}

function Users() {
  var app = useApp(), s = app.state, t = app.t, role = R.useState('');
  var roles = { Student: t('roleStudent'), Company: t('roleCompany'), Supervisor: t('roleSupervisor'), Admin: t('roleAdmin') };
  var rows = s.users.filter(function (u) { return !role[0] || u.role === role[0]; });
  return h(Page, { title: t('usersTitle'), lead: s.users.length + ' ' + (app.lang === 'ar' ? 'حسابًا' : 'accounts') },
    h('div', { className: 'chips', role: 'group', 'aria-label': t('role') }, [['', t('all')]].concat(Object.keys(roles).map(function (k) { return [k, roles[k]]; })).map(function (r) {
      return h('button', { key: r[0] || 'all', type: 'button', className: 'chip', 'aria-pressed': role[0] === r[0] ? 'true' : 'false', onClick: function () { role[1](r[0]); } }, r[1]);
    })),
    h(C.DataTable, { caption: t('usersTitle'), columns: [
      { key: 'name', header: t('fullName'), render: function (r) { return h('span', { className: 'who' }, h(Avatar, { name: r.name, size: 'sm' }), r.name); } }, { key: 'email', header: t('email') }, { key: 'role', header: t('role') }, { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } },
      { key: 'act', header: t('actions'), align: 'end', render: function (r) { if (r.id === app.me.id) return null; var sus = r.status === 'Active';
        return h(C.Button, { size: 'sm', variant: sus ? 'danger' : 'secondary', onClick: function () { app.act({ type: 'userStatus', id: r.id, status: sus ? 'Suspended' : 'Active', by: app.me.id }, sus ? t('suspendedToast') : t('activatedToast'), sus ? 'info' : 'success', true); } }, sus ? t('suspend') : t('activate')); } }],
      rows: rows.map(function (u) { return { id: u.id, name: u.name, email: u.email, role: roles[u.role], status: u.status }; }) }));
}

function Assign() {
  var app = useApp(), s = app.state, t = app.t;
  var sups = s.users.filter(function (u) { return u.role === 'Supervisor'; });
  return h(Page, { title: t('assignTitle'), lead: t('assignHelp') },
    h(C.DataTable, { caption: t('assignTitle'), columns: [
      { key: 'name', header: t('student'), render: function (r) { return h('span', { className: 'who' }, h(Avatar, { name: r.name, size: 'sm' }), r.name); } }, { key: 'major', header: t('major') }, { key: 'pl', header: t('placement') },
      { key: 'sup', header: t('supervisor'), render: function (r) {
        return h('select', { className: 'coop-input select-sm', id: 'sup-' + r.id, 'aria-label': t('supervisor') + ' – ' + r.name, value: r.sup || '', onChange: function (e) { if (!e.target.value) return; app.act({ type: 'assign', student: r.id, supervisor: e.target.value, by: app.me.id }, t('assignedToast'), 'success', true); } },
          r.sup ? null : h('option', { value: '' }, t('unassigned')), sups.map(function (u) { return h('option', { key: u.ref, value: u.ref }, u.name); })); } }],
      rows: s.students.map(function (x) { var o = x.placement ? oppOfPlacement(s, x.placement) : null; return { id: x.id, name: stuName(s, x.id), major: x.major, pl: o ? compName(s, o.company) : '—', sup: x.supervisor }; }) }));
}

function Audit() {
  var app = useApp(), s = app.state, t = app.t, q = R.useState('');
  var rows = s.audit.filter(function (l) { return !q[0] || (userName(s, l.user) + ' ' + l.action).toLowerCase().indexOf(q[0].toLowerCase()) >= 0; });
  return h(Page, { title: t('auditTitle'), lead: rows.length + ' ' + (app.lang === 'ar' ? 'سجل' : 'entries') },
    h(Card, { className: 'filters filters-1' }, h(C.TextField, { id: 'a-q', label: t('filterUser'), type: 'search', value: q[0], onChange: function (e) { q[1](e.target.value); } })),
    h(AuditFeed, { rows: rows, limit: 25 }));
}


