/* ================= SUPERVISOR ================= */
function supStudents(app) { return app.state.students.filter(function (x) { return x.supervisor === app.me.ref; }); }

function SupStudents() {
  var app = useApp(), s = app.state, t = app.t, mine = supStudents(app), ids = mine.map(function (x) { return x.id; });
  var pend = s.attendance.filter(function (a) { return ids.indexOf(a.student) >= 0 && a.status === 'Pending'; }).length;
  var reps = s.reports.filter(function (r) { return ids.indexOf(r.student) >= 0 && r.status === 'Submitted'; }).length;
  var placed = mine.filter(function (x) { return x.placement; });
  var avg = placed.length ? Math.round(placed.reduce(function (a, x) { return a + attRate(s, x.id); }, 0) / placed.length) : 0;
  return h(Page, { eyebrow: longToday(app.lang), title: greeting(t) + ', ' + app.me.name, lead: mine.length + ' ' + t('myStudents').toLowerCase(),
    extra: h(HeroProgress, { label: t('attendanceRate'), value: avg + '%', pct: avg, note: pend + ' ' + t('pendingAttendance').toLowerCase() }) },
    h(Tiles, { label: t('quickActions'), items: [
      { icon: 'check', label: t('attendanceApprovals'), count: pend || null, onClick: function () { app.go('attendance'); } },
      { icon: 'doc', label: t('reportsTitle'), count: reps || null, onClick: function () { app.go('reports'); } },
      { icon: 'star', label: t('navEvaluations'), onClick: function () { app.go('evaluations'); } }] }),
    h('div', { className: 'split' },
      h(Section, { title: t('myStudents') }, h(StudentCards, { students: mine, badge: function (x) { var r = s.reports.filter(function (y) { return y.student === x.id; })[0]; return r ? r.status : 'Not submitted'; } })),
      h(Section, { title: t('activity') }, h(Feed, { items: activityFor(app, { students: ids }) }))));
}

function SupAttendance() {
  var app = useApp(), s = app.state, t = app.t, ids = supStudents(app).map(function (x) { return x.id; });
  var pend = s.attendance.filter(function (a) { return ids.indexOf(a.student) >= 0 && a.status === 'Pending'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  function decide(list, status) { app.act({ type: 'attDecision', ids: list, status: status, by: app.me.id }, (status === 'Approved' ? t('approvedToast') : t('rejectedToast2')) + ' (' + list.length + ')', status === 'Approved' ? 'success' : 'info', true); }
  return h(Page, { title: t('attendanceApprovals'), lead: pend.length ? pend.length + ' ' + t('pendingAttendance').toLowerCase() : t('nothingPending'),
    action: pend.length ? h('button', { className: 'hero-btn', onClick: function () { decide(pend.map(function (a) { return a.id; }), 'Approved'); } }, h(Icon, { name: 'check', size: 18 }), t('approveAll') + ' (' + pend.length + ')') : null },
    h(C.DataTable, { caption: t('attendanceApprovals'), empty: t('nothingPending'), columns: [
      { key: 'name', header: t('student'), render: function (r) { return h('span', { className: 'who' }, h(Avatar, { name: r.name, size: 'sm' }), r.name); } }, { key: 'pl', header: t('placement') }, { key: 'date', header: t('date') }, { key: 'time', header: t('checkInTime') },
      { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } },
      { key: 'act', header: t('actions'), align: 'end', render: function (r) { return h('div', { className: 'btns' },
        h(C.Button, { size: 'sm', onClick: function () { decide([r.id], 'Approved'); } }, t('approve')),
        h(C.Button, { size: 'sm', variant: 'danger', onClick: function () { decide([r.id], 'Rejected'); } }, t('reject'))); } }],
      rows: pend.map(function (a) { return { id: a.id, name: stuName(s, a.student), pl: compName(s, oppOfPlacement(s, a.placement).company), date: fmtDate(a.date, app.lang), time: a.time, status: a.status }; }) }));
}

function SupReports() {
  var app = useApp(), s = app.state, t = app.t, ids = supStudents(app).map(function (x) { return x.id; });
  var reps = s.reports.filter(function (r) { return ids.indexOf(r.student) >= 0; });
  var viewing = R.useState(null);
  return h(Page, { title: t('reportsTitle'), lead: t('reportsLead') },
    viewing[0] ? h(ReportViewer, { reportId: viewing[0], onClose: function () { viewing[1](null); } }) : null,
    h(C.DataTable, { caption: t('reportsTitle'), empty: t('noRecords'), columns: [
      { key: 'name', header: t('student'), render: function (r) { return h('span', { className: 'who' }, h(Avatar, { name: r.name, size: 'sm' }), r.name); } }, { key: 'file', header: t('file'), render: function (r) { return h(FileButton, { file: r.file, label: t('openFile'), openText: t('openReport'), onClick: function () { viewing[1](r.id); } }); } }, { key: 'date', header: t('submitted') },
      { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } },
      { key: 'act', header: t('actions'), align: 'end', render: function (r) { return r.status !== 'Submitted' ? null : h('div', { className: 'btns' },
        h(C.Button, { size: 'sm', onClick: function () { app.act({ type: 'reportDecision', id: r.id, status: 'Approved', by: app.me.id }, t('reportApprovedToast'), 'success', true); } }, t('approve')),
        h(C.Button, { size: 'sm', variant: 'secondary', onClick: function () { app.act({ type: 'reportDecision', id: r.id, status: 'Request Revision', by: app.me.id }, t('revisionToast'), 'info', true); } }, t('requestRevision'))); } }],
      rows: reps.map(function (r) { return { id: r.id, name: stuName(s, r.student), file: r.file, date: fmtDate(r.date, app.lang), status: r.status }; }) }));
}

function SupEvals() {
  var app = useApp(), s = app.state, t = app.t, mine = supStudents(app).filter(function (x) { return x.placement; }), ids = mine.map(function (x) { return x.id; });
  return h(Page, { title: t('academicEvalTitle') },
    h(EvalForm, { students: mine, evalType: 'Academic' }),
    h(Section, { title: t('evaluations') }, h(EvalList, { evals: s.evals.filter(function (e) { return ids.indexOf(e.student) >= 0; }), showStudent: true, empty: t('noRecords') })));
}

