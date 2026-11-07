/* ================= STUDENT ================= */
/* student's overall COOP progress: placement 20%, training days 50%, final report 15%, two evaluations 15% */
function studentProgress(s, st) {
  var pl = st.placement ? by(s.placements, st.placement) : null;
  var total = pl ? workdays(pl.start, pl.end).length : 0;
  var done = pl ? Math.min(total, workdays(pl.start, TODAY < pl.end ? TODAY : pl.end).length) : 0;
  var rep = s.reports.filter(function (r) { return r.student === st.id; })[0];
  var evals = s.evals.filter(function (e) { return e.student === st.id; });
  var evalTypes = ['Company', 'Academic'].filter(function (ty) { return evals.some(function (e) { return e.type === ty; }); }).length;
  var today = s.attendance.filter(function (x) { return x.student === st.id && x.date === TODAY; })[0];
  var pct = (pl ? 20 : 0) + (total ? 50 * done / total : 0) + (rep ? (rep.status === 'Approved' ? 15 : rep.status === 'Submitted' ? 7.5 : 0) : 0) + evalTypes * 7.5;
  return { pl: pl, total: total, done: done, rep: rep, evalTypes: evalTypes, today: today, pct: Math.round(pct) };
}
function MyProgress(p) {
  var app = useApp(), s = app.state, t = app.t, g = studentProgress(s, p.st);
  var steps = [
    { label: t('stepPlacement'), value: g.pl ? t('stepDone') : t('stepNotYet'), state: g.pl ? 'done' : 'now' },
    { label: t('stepTraining'), value: g.pl ? frac(g.done, g.total) + ' ' + t('stepDays') : '—', state: !g.pl ? 'todo' : g.done >= g.total ? 'done' : 'now' },
    { label: t('stepReport'), value: g.rep ? (app.lang === 'ar' ? (STATUS_AR[g.rep.status] || g.rep.status) : g.rep.status) : t('stepNotYet'), state: g.rep && g.rep.status === 'Approved' ? 'done' : g.rep ? 'now' : 'todo' },
    { label: t('stepEvals'), value: frac(g.evalTypes, 2), state: g.evalTypes === 2 ? 'done' : g.evalTypes ? 'now' : 'todo' }
  ];
  var next = !g.pl ? t('nextApply') : !g.today && g.done < g.total ? t('nextCheckIn') : g.rep && g.rep.status === 'Request Revision' ? t('nextRevision') : g.done < g.total ? t('nextKeepGoing') : !g.rep ? t('nextReport') : t('nextEvals');
  return h('div', { className: 'glass progress-card' },
    h('div', { className: 'glass-top' }, h('span', { className: 'glass-label' }, t('yourProgress')), h('span', { className: 'glass-value' }, g.pct + '%')),
    h('div', { className: 'glass-bar', role: 'progressbar', 'aria-valuenow': g.pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': t('yourProgress') }, h('span', { style: { width: g.pct + '%' } })),
    h('ol', { className: 'psteps' }, steps.map(function (x) {
      return h('li', { key: x.label, className: 'pstep pstep-' + x.state },
        h('span', { className: 'pstep-dot', 'aria-hidden': true }, x.state === 'done' ? h(Icon, { name: 'check', size: 14 }) : null),
        h('span', { className: 'pstep-text' }, h('span', { className: 'pstep-label' }, x.label), h('span', { className: 'pstep-val' }, x.value)));
    })),
    h('p', { className: 'glass-note' }, h('b', null, t('nextStep') + ': '), next));
}

function StudentDashboard() {
  var app = useApp(), s = app.state, t = app.t, st = by(s.students, app.me.ref);
  var opp = st.placement ? oppOfPlacement(s, st.placement) : null;
  var today = s.attendance.filter(function (x) { return x.student === st.id && x.date === TODAY; })[0];
  var report = s.reports.filter(function (x) { return x.student === st.id; })[0];
  var myApps = s.apps.filter(function (x) { return x.student === st.id; });
  var rate = attRate(s, st.id);
  var first = app.me.name.split(' ')[0];
  var extra = h(MyProgress, { st: st });
  var tiles = opp ? [
    { icon: 'key', label: t('logAttendance'), onClick: function () { app.go('attendance'); } },
    { icon: 'doc', label: t('navReport'), onClick: function () { app.go('report'); } },
    { icon: 'brief', label: t('navOpportunities'), onClick: function () { app.go('opportunities'); } }]
    : [{ icon: 'search', label: t('browseOpps'), onClick: function () { app.go('opportunities'); } }, { icon: 'list', label: t('navApplications'), count: myApps.length || null, onClick: function () { app.go('applications'); } }];
  return h(Page, { eyebrow: longToday(app.lang), title: greeting(t) + ', ' + first, lead: st.major, extra: extra },
    h(Tiles, { label: t('quickActions'), items: tiles }),
    opp ? h(R.Fragment, null,
      !today ? h(C.Alert, { tone: 'warning', title: t('checkInToday') }, h('button', { className: 'link', onClick: function () { app.go('attendance'); } }, t('logAttendance'))) : null,
      report && report.status === 'Request Revision' ? h(C.Alert, { tone: 'danger', title: t('revisionNote') }) : null,
      h('div', { className: 'split' },
        h(Section, { title: t('yourPlacement') },
          h(C.OpportunityCard, { title: opp.title, company: compName(s, opp.company), description: opp.description, city: opp.city, majors: opp.majors, labels: { city: t('city'), majors: t('majors'), capacity: t('seats') },
            status: 'Active', footnote: fmtDate(by(s.placements, st.placement).start, app.lang) + ' – ' + fmtDate(by(s.placements, st.placement).end, app.lang) }),
          h(Card, { className: 'mini-row' }, h('span', { className: 'coop-label' }, t('supervisor')), h('span', { className: 'who' }, h(Avatar, { name: supName(s, st.supervisor) || '?', size: 'sm' }), supName(s, st.supervisor) || t('unassigned'))),
          h(Card, { className: 'mini-row' }, h('span', { className: 'coop-label' }, t('finalReport')), h(Badge, { status: report ? report.status : 'Not submitted' }))),
        h(Section, { title: t('activity') }, h(Feed, { items: activityFor(app, { students: [st.id], self: true }) }))))
    : h(R.Fragment, null,
      h(Empty, { title: t('noPlacementTitle') }, h('p', null, t('noPlacementBody'))),
      myApps.length ? h(Section, { title: t('myApplications') }, h(AppsTable, { apps: myApps })) : null));
}

function AppsTable(p) {
  var app = useApp(), s = app.state, t = app.t;
  return h(C.DataTable, { caption: t('myApplications'), empty: t('noApps'), columns: [
    { key: 'opp', header: t('opportunity') }, { key: 'company', header: t('company') }, { key: 'date', header: t('appliedOn') },
    { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } }],
    rows: p.apps.map(function (a) { var o = by(s.opps, a.opp); return { id: a.id, opp: o.title, company: compName(s, o.company), date: fmtDate(a.date, app.lang), status: a.status }; }) });
}

function StudentOpportunities() {
  var app = useApp(), s = app.state, t = app.t, st = by(s.students, app.me.ref);
  var q = R.useState(''), major = R.useState(st.major), city = R.useState('');
  var visible = s.opps.filter(function (o) { var c = by(s.companies, o.company); return o.status === 'Open' && c.status === 'Approved'; });
  var majors = [], cities = [];
  visible.forEach(function (o) { o.majors.split(', ').forEach(function (m) { if (majors.indexOf(m) < 0) majors.push(m); }); if (cities.indexOf(o.city) < 0) cities.push(o.city); });
  var list = visible.filter(function (o) {
    var text = (o.title + ' ' + compName(s, o.company)).toLowerCase();
    return (!q[0] || text.indexOf(q[0].toLowerCase()) >= 0) && (!major[0] || o.majors.indexOf(major[0]) >= 0) && (!city[0] || o.city === city[0]);
  });
  var allOpt = { value: '', label: t('all') };
  return h(Page, { title: t('browseOpps'), lead: list.length + ' ' + t('oppsFound') },
    st.placement ? h(C.Alert, { tone: 'info' }, t('alreadyPlaced')) : null,
    h(Card, { className: 'filters' },
      h(C.TextField, { id: 'f-q', label: t('searchOpps'), value: q[0], onChange: function (e) { q[1](e.target.value); }, type: 'search' }),
      h(C.TextField, { id: 'f-major', label: t('filterMajor'), value: major[0], onChange: function (e) { major[1](e.target.value); }, options: [allOpt].concat(majors.sort()) }),
      h(C.TextField, { id: 'f-city', label: t('filterCity'), value: city[0], onChange: function (e) { city[1](e.target.value); }, options: [allOpt].concat(cities.sort()) })),
    list.length ? h(Grid, null, list.map(function (o) {
      var mine = s.apps.filter(function (a) { return a.student === st.id && a.opp === o.id; })[0];
      var taken = s.placements.filter(function (p) { return p.opp === o.id; }).map(function (p) { return s.students.filter(function (x) { return x.placement === p.id; }).length; })[0] || 0;
      return h(C.OpportunityCard, { key: o.id, title: o.title, company: compName(s, o.company), description: o.description, city: o.city, majors: o.majors, capacity: frac(o.capacity - taken, o.capacity),
        labels: { city: t('city'), majors: t('majors'), capacity: t('seats') }, status: mine ? mine.status : null,
        footnote: t('postedOn') + ' ' + fmtDate(o.posted, app.lang),
        actions: mine ? h(C.Button, { size: 'sm', variant: 'secondary', onClick: function () { app.go('applications'); } }, t('viewApplication'))
          : h(C.Button, { size: 'sm', disabled: !!st.placement || taken >= o.capacity, onClick: function () { app.act({ type: 'apply', student: st.id, opp: o.id }, t('appliedToast'), 'success', true); } }, taken >= o.capacity ? t('full') : t('apply')) });
    })) : h(Empty, { title: t('noOppsMatch') }));
}

function StudentApplications() {
  var app = useApp(), t = app.t;
  return h(Page, { title: t('myApplications') }, h(AppsTable, { apps: app.state.apps.filter(function (a) { return a.student === app.me.ref; }) }));
}

function StudentAttendance() {
  var app = useApp(), s = app.state, t = app.t, st = by(s.students, app.me.ref);
  var res = R.useState(null), nonce = R.useState(0);
  if (!st.placement) return h(Page, { title: t('attendanceTitle') }, h(Empty, { title: t('noPlacementAttendance') }, h(C.Button, { onClick: function () { app.go('opportunities'); } }, t('browseOpps'))));
  var mine = s.attendance.filter(function (a) { return a.student === st.id; }).slice().reverse();
  var todayRec = mine.filter(function (a) { return a.date === TODAY; })[0];
  var p = by(s.placements, st.placement), dayN = workdays(p.start, TODAY).length, dayM = workdays(p.start, p.end).length;
  /* the code is checked by PHP against MySQL (BR-14, BR-15, BR-16); 5 wrong codes block check-in for 10 minutes */
  function submit(code) {
    if (todayRec) { res[1]({ error: t('codeDuplicate') }); nonce[1](nonce[0] + 1); return; }
    app.server({ type: 'checkIn', student: st.id, code: code }).then(function (r) {
      if (r.ok) { var tm = nowTime(); app.toast('success', t('codeOk') + ' ' + tm); res[1]({ success: t('codeOk') + ' ' + tm + '. ' + t('awaitingApproval') }); return; }
      var key = { code_duplicate: 'codeDuplicate', code_expired: 'codeExpired', code_none: 'codeNone', code_invalid: 'codeInvalid', code_locked: 'codeLocked' }[r.code];
      res[1]({ error: key && (app.lang === 'ar' || r.code !== 'code_invalid') ? t(key) : r.error }); nonce[1](nonce[0] + 1);
    });
  }
  var rate = attRate(s, st.id);
  return h(Page, { eyebrow: fill(t('trainingDay'), { n: dayN, m: dayM }), title: t('attendanceTitle'), lead: oppOfPlacement(s, st.placement).title + ' · ' + compName(s, oppOfPlacement(s, st.placement).company),
    extra: h(HeroProgress, { label: t('termProgress'), value: rate + '%', pct: rate, note: mine.length + ' ' + t('daysLogged').toLowerCase() }) },
    h(Card, { className: 'stack checkin' },
      todayRec && !(res[0] && res[0].success) ? h(C.Alert, { tone: 'success', title: t('checkedInToday') + ' ' + todayRec.time }, t('awaitingApproval')) : null,
      h(C.DailyCodeInput, { key: nonce[0], label: t('codeLabel'), help: t('codeHelp'), error: res[0] && res[0].error, success: res[0] && res[0].success, disabled: !!(res[0] && res[0].success),
        digitLabel: app.lang === 'ar' ? 'الرقم' : 'Digit', onChange: function () { if (res[0] && res[0].error) res[1](null); }, onComplete: submit }),
      h('p', { className: 'demo-note' }, h('span', { className: 'demo-tag' }, t('demo')), t('demoCodeHint'))),
    h(Section, { title: t('history') },
      h(C.DataTable, { caption: t('history'), columns: [{ key: 'date', header: t('date') }, { key: 'time', header: t('checkInTime') }, { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } }],
        rows: mine.slice(0, 12).map(function (a) { return { id: a.id, date: fmtDate(a.date, app.lang), time: a.time, status: a.status }; }) })));
}

function EvalList(p) {
  var app = useApp(), s = app.state, t = app.t;
  if (!p.evals.length) return h(Empty, { title: p.empty || t('noEvals') });
  return h('div', { className: 'eval-list' }, p.evals.map(function (e) {
    return h(Card, { key: e.id, className: 'eval' },
      h('div', { className: 'eval-top' }, h('div', null, p.showStudent ? h('span', { className: 'who' }, h(Avatar, { name: stuName(s, e.student), size: 'sm' }), stuName(s, e.student)) : null,
        h('span', { className: 'eval-type' }, (e.type === 'Company' ? t('companyEval') : t('academicEval')) + ' · ' + fmtDate(e.date, app.lang))),
        h('span', { className: 'eval-score' + (e.score < 60 ? ' low' : '') }, h('b', null, e.score), '/100', e.score < 60 ? h('span', { className: 'low-tag' }, t('belowPass')) : null)),
      h('div', { className: 'bar' + (e.score < 60 ? ' bar-low' : '') }, h('span', { style: { width: e.score + '%' } })),
      h('p', { className: 'eval-text' }, e.comments));
  }));
}

function StudentReport() {
  var app = useApp(), s = app.state, t = app.t, st = by(s.students, app.me.ref);
  var rep = s.reports.filter(function (r) { return r.student === st.id; })[0];
  var file = R.useState(null), err = R.useState(null), viewing = R.useState(false), busy = R.useState(false);
  var evals = s.evals.filter(function (e) { return e.student === st.id; });
  function doSubmit() {
    var f = file[0], key = 'f' + Date.now(); busy[1](true);
    FileStore.put(key, f.file).then(function () { app.act({ type: 'submitReport', student: st.id, file: f.name, fileKey: key }, t('reportSubmitted'), 'success', true); file[1](null); busy[1](false); },
      function (e) { busy[1](false); err[1]((e && e.message) || t('storageError')); });
  }
  var canSubmit = !!st.placement && (!rep || rep.status === 'Request Revision');
  return h(Page, { title: t('reportTitle'), lead: t('reportLead') },
    !st.placement ? h(Empty, { title: t('noPlacementAttendance') }) : h(Card, { className: 'stack narrow' },
      rep ? h('div', { className: 'kv' }, h(FileButton, { file: rep.file, label: t('openFile'), openText: t('openReport'), onClick: function () { viewing[1](true); } }), h(Badge, { status: rep.status })) : null,
      rep && rep.status === 'Approved' ? h(C.Alert, { tone: 'success', title: t('reportApproved') }) : null,
      rep && rep.status === 'Request Revision' ? h(C.Alert, { tone: 'warning', title: t('revisionNote') }) : null,
      canSubmit ? h(R.Fragment, null,
        h(C.FileUpload, { label: t('reportFile'), prompt: t('chooseFile'), hint: t('fileHint'), removeLabel: t('remove'), file: file[0], error: err[0],
          onFile: function (f) { if (!validFile(f)) { err[1](t('fileTypeError')); file[1](null); } else { err[1](null); file[1]({ name: f.name, file: f }); } },
          onRemove: function () { file[1](null); } }),
        h(Row, { end: true }, h(C.Button, { disabled: !file[0] || busy[0], onClick: doSubmit }, t('submitReport')))) : null),
    viewing[0] && rep ? h(ReportViewer, { reportId: rep.id, onClose: function () { viewing[1](false); } }) : null,
    h(Section, { title: t('evaluations') }, h(EvalList, { evals: evals })));
}

function ProfileForm() {
  var app = useApp(), t = app.t, st = by(app.state.students, app.me.ref);
  var f = useForm({ name: app.me.name, phone: st.phone, gpa: st.gpa, cv: st.cv ? { name: st.cv } : null, cvErr: null }, function (v) {
    var e = {};
    if (v.name.trim().length < 3) e.name = app.lang === 'ar' ? 'أدخل اسمك الكامل.' : 'Enter your full name.';
    if (!/^05\d{8}$/.test(v.phone)) e.phone = t('phoneError');
    var g = parseFloat(v.gpa); if (isNaN(g) || g < 0 || g > 5) e.gpa = t('gpaError');
    return e;
  });
  function onSave(e) {
    e.preventDefault(); if (!f.submit()) return;
    app.act({ type: 'profile', student: st.id, fields: { phone: f.values.phone, gpa: f.values.gpa, cv: f.values.cv ? f.values.cv.name : '' }, userFields: { name: f.values.name.trim() } }, t('profileSaved'), 'success', true);
  }
  return h('form', { className: 'form', onSubmit: onSave, noValidate: true },
    f.tried && Object.keys(f.errors).length ? h(C.Alert, { tone: 'danger', title: t('fixErrors') }) : null,
    h(C.TextField, { id: 'p-name', label: t('fullName'), value: f.values.name, error: f.err('name'), onChange: function (e) { f.set('name', e.target.value); } }),
    h(C.TextField, { id: 'p-email', label: t('email'), value: app.me.email, disabled: true }),
    h('div', { className: 'form-2' },
      h(C.TextField, { id: 'p-phone', label: t('phone'), value: f.values.phone, inputMode: 'numeric', error: f.err('phone'), help: '05XXXXXXXX', onChange: function (e) { f.set('phone', e.target.value.trim()); } }),
      h(C.TextField, { id: 'p-gpa', label: t('gpa'), value: f.values.gpa, inputMode: 'decimal', error: f.err('gpa'), help: '0 – 5', onChange: function (e) { f.set('gpa', e.target.value.trim()); } })),
    h(C.TextField, { id: 'p-major', label: t('major'), value: st.major, disabled: true }),
    h(C.FileUpload, { label: t('cv'), prompt: t('chooseFile'), hint: t('fileHint'), removeLabel: t('remove'), file: f.values.cv, error: f.values.cvErr,
      onFile: function (file) { if (!validFile(file)) f.setAll({ cvErr: t('fileTypeError') }); else f.setAll({ cvErr: null, cv: { name: file.name } }); },
      onRemove: function () { f.setAll({ cv: null }); } }),
    h(Row, { end: true }, h(C.Button, { type: 'submit' }, t('saveProfile'))));
}

