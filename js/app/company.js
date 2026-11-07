/* ================= COMPANY ================= */
function companyCtx(app) {
  var s = app.state, cid = app.me.ref;
  var opps = s.opps.filter(function (o) { return o.company === cid; });
  var oppIds = opps.map(function (o) { return o.id; });
  var placements = s.placements.filter(function (p) { return oppIds.indexOf(p.opp) >= 0; });
  var pids = placements.map(function (p) { return p.id; });
  var trainees = s.students.filter(function (x) { return pids.indexOf(x.placement) >= 0; });
  return { cid: cid, opps: opps, oppIds: oppIds, placements: placements, pids: pids, trainees: trainees };
}

function CompanyOverview() {
  var app = useApp(), s = app.state, t = app.t, k = companyCtx(app);
  var newApps = s.apps.filter(function (a) { return k.oppIds.indexOf(a.opp) >= 0 && a.status === 'Submitted'; });
  var todays = s.attendance.filter(function (a) { return k.pids.indexOf(a.placement) >= 0 && a.date === TODAY; });
  var pct = k.trainees.length ? Math.round(todays.length * 100 / k.trainees.length) : 0;
  return h(Page, { eyebrow: longToday(app.lang), title: greeting(t) + ', ' + app.me.name, lead: t('companyOverview'),
    extra: h(HeroProgress, { label: t('todaysCheckins'), value: frac(todays.length, k.trainees.length), pct: pct, note: k.trainees.length + ' ' + t('activeTrainees').toLowerCase() }) },
    h(Tiles, { label: t('quickActions'), items: [
      { icon: 'plus', label: t('postOpp'), onClick: function () { app.go('postings', { compose: true }); } },
      { icon: 'users', label: t('navApplicants'), count: newApps.length || null, onClick: function () { app.go('applicants'); } },
      { icon: 'key', label: t('navDailyCode'), onClick: function () { app.go('dailycode'); } }] }),
    h('div', { className: 'split' },
      h(Section, { title: t('dailyCodeTitle') }, h(CodeCards, { placements: k.placements })),
      h(Section, { title: t('activity') }, h(Feed, { items: activityFor(app, { pids: k.pids, oppIds: k.oppIds, limit: 6 }).concat([]).slice(0, 6) }))));
}

var TEMPLATES = [
  { title: 'Supply Chain Analyst Trainee', majors: 'Business Administration', description: 'Track inbound shipments, reconcile warehouse stock counts and prepare weekly KPI summaries.' },
  { title: 'HR Operations Trainee', majors: 'Business Administration', description: 'Help run onboarding, update employee records and prepare attendance reports for payroll.' },
  { title: 'Procurement Assistant Trainee', majors: 'Business Administration', description: 'Prepare purchase requests, compare supplier quotations and follow up delivery dates.' },
  { title: 'Accounts Payable Trainee', majors: 'Business Administration', description: 'Match invoices to purchase orders, prepare payment batches and reconcile vendor statements.' },
  { title: 'Maintenance Planning Trainee', majors: 'Mechanical Engineering', description: 'Schedule preventive maintenance work orders and follow up spare-part requests with stores.' },
  { title: 'Process Engineering Trainee', majors: 'Chemical Engineering', description: 'Support the operations team with process monitoring, shift logs and daily production reports.' },
  { title: 'IT Support Trainee', majors: 'Computer Science', description: 'Handle first-line support tickets, set up user devices and keep the asset register current.' }
];

function PostingsPage() {
  var app = useApp(), s = app.state, t = app.t, k = companyCtx(app);
  var open = R.useState(!!(app.params && app.params.compose));
  var blank = { title: '', city: by(s.companies, k.cid).city, majors: 'Business Administration', capacity: 2, description: '' };
  var f = useForm(blank, function (v) {
    var e = {};
    if (v.title.trim().length < 5) e.title = t('titleRequired');
    if (v.description.trim().length < 20) e.description = t('descRequired');
    return e;
  });
  function submit(e) {
    e.preventDefault(); if (!f.submit()) return;
    var v = f.values;
    app.act({ type: 'postOpp', by: app.me.id, opp: { company: k.cid, title: v.title.trim(), city: v.city, majors: v.majors, capacity: v.capacity, description: v.description.trim() } }, t('postedToast'), 'success', true);
    f.reset(blank); open[1](false);
  }
  var descLeft = Math.max(0, 20 - f.values.description.trim().length);
  var approved = by(s.companies, k.cid).status === 'Approved';
  return h(Page, { title: t('myPostings'), lead: t('postHelp'), action: open[0] || !approved ? null : h('button', { className: 'hero-btn', onClick: function () { open[1](true); } }, h(Icon, { name: 'plus', size: 18 }), t('postOpp')) },
    !approved ? h(C.Alert, { tone: 'warning', title: t('companyPendingTitle') }, t('companyPendingBody')) : null,
    open[0] && approved ? h(Card, null, h('form', { className: 'form', onSubmit: submit, noValidate: true },
      h('h2', { className: 'h2' }, t('postTitle')),
      h('div', { className: 'coop-field' },
        h('span', { className: 'coop-label' }, t('quickTemplates')),
        h('div', { className: 'chips' }, TEMPLATES.map(function (tp) {
          var on = f.values.title === tp.title;
          return h('button', { key: tp.title, type: 'button', className: 'chip', 'aria-pressed': on ? 'true' : 'false', onClick: function () { f.setAll({ title: tp.title, majors: tp.majors, description: tp.description }); } }, tp.title);
        })),
        h('span', { className: 'coop-help' }, t('templatesHelp'))),
      f.tried && Object.keys(f.errors).length ? h(C.Alert, { tone: 'danger', title: t('fixErrors') }) : null,
      h(C.TextField, { id: 'o-title', label: t('oppTitle'), required: true, value: f.values.title, error: f.err('title'), placeholder: 'e.g. Procurement Analyst Trainee', onChange: function (e) { f.set('title', e.target.value); } }),
      h('div', { className: 'form-3' },
        h(C.TextField, { id: 'o-city', label: t('city'), value: f.values.city, options: SA_CITIES.map(function (c) { return { value: c.en, label: app.lang === 'ar' ? c.ar : c.en }; }).sort(function (p, q) { return p.label.localeCompare(q.label, app.lang); }), onChange: function (e) { f.set('city', e.target.value); } }),
        h(C.TextField, { id: 'o-majors', label: t('majorReq'), value: f.values.majors, options: ['Business Administration', 'Chemical Engineering', 'Industrial Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Computer Science'], onChange: function (e) { f.set('majors', e.target.value); } }),
        h(Stepper, { id: 'o-cap', label: t('capacity'), value: f.values.capacity, min: 1, max: 20, help: '1 – 20', onChange: function (n) { f.set('capacity', n); } })),
      h(C.TextField, { id: 'o-desc', label: t('description'), required: true, multiline: true, value: f.values.description, error: f.err('description'), help: descLeft ? fill(t('charsLeft'), { n: descLeft }) : null, onChange: function (e) { f.set('description', e.target.value); } }),
      h(Row, { end: true }, h(C.Button, { variant: 'secondary', onClick: function () { open[1](false); f.reset(blank); } }, t('cancel')), h(C.Button, { type: 'submit' }, t('postOpp'))))) : null,
    h(C.DataTable, { caption: t('myPostings'), columns: [
      { key: 'title', header: t('opportunity') }, { key: 'city', header: t('city') }, { key: 'cap', header: t('seats'), align: 'end' }, { key: 'apps', header: t('navApplicants'), align: 'end' }, { key: 'posted', header: t('postedOn') },
      { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } }],
      rows: k.opps.map(function (o) { return { id: o.id, title: o.title, city: o.city, cap: o.capacity, apps: s.apps.filter(function (a) { return a.opp === o.id; }).length, posted: fmtDate(o.posted, app.lang), status: o.status }; }) }));
}

function ApplicantsTable(p) {
  var app = useApp(), s = app.state, t = app.t;
  return h(C.DataTable, { caption: t('applicantsTitle'), empty: t('noRecords'), columns: [
    { key: 'student', header: t('student'), render: function (r) { return h('span', { className: 'who' }, h(Avatar, { name: r.student, size: 'sm' }), r.student); } }, { key: 'major', header: t('major') }, { key: 'gpa', header: t('gpa'), align: 'end' }, { key: 'opp', header: t('opportunity') }, { key: 'date', header: t('submitted') },
    { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } },
    { key: 'act', header: t('actions'), align: 'end', render: function (r) { return r.status !== 'Submitted' ? null : h('div', { className: 'btns' },
      h(C.Button, { size: 'sm', onClick: function () { app.act({ type: 'appDecision', id: r.id, status: 'Accepted', by: app.me.id }, t('acceptedToast'), 'success', true); } }, t('accept')),
      h(C.Button, { size: 'sm', variant: 'danger', onClick: function () { app.act({ type: 'appDecision', id: r.id, status: 'Rejected', by: app.me.id }, t('rejectedToast'), 'info', true); } }, t('reject'))); } }],
    rows: p.apps.map(function (a) { var st = by(s.students, a.student); return { id: a.id, student: stuName(s, a.student), major: st.major, gpa: st.gpa, opp: by(s.opps, a.opp).title, date: fmtDate(a.date, app.lang), status: a.status }; }) });
}
function ApplicantsPage() {
  var app = useApp(), s = app.state, t = app.t, k = companyCtx(app);
  var apps = s.apps.filter(function (a) { return k.oppIds.indexOf(a.opp) >= 0; }).sort(function (a, b) { return (a.status === 'Submitted' ? 0 : 1) - (b.status === 'Submitted' ? 0 : 1) || (a.date < b.date ? 1 : -1); });
  var n = apps.filter(function (a) { return a.status === 'Submitted'; }).length;
  return h(Page, { title: t('applicantsTitle'), lead: n + ' ' + t('newApplicants').toLowerCase() }, h(ApplicantsTable, { apps: apps }));
}

function CodeCards(p) {
  var app = useApp(), s = app.state, t = app.t;
  if (!p.placements.length) return h(Empty, { title: t('noRecords') });
  return h('div', { className: 'stack' }, p.placements.map(function (pl) {
    var code = s.codes.filter(function (k) { return k.placement === pl.id && k.date === TODAY && k.status === 'Active'; })[0];
    var trainees = s.students.filter(function (x) { return x.placement === pl.id; }).length;
    var ins = s.attendance.filter(function (a) { return a.placement === pl.id && a.date === TODAY; }).length;
    var title = oppOfPlacement(s, pl.id).title;
    var gen = function () { app.act({ type: 'genCode', placement: pl.id, by: app.me.id }, t('codeGenerated'), 'success', true); };
    return code ? h(C.DailyCodeCard, { key: pl.id, code: code.code, status: 'Active', title: title, meta: t('expiresToday') + ' · ' + frac(ins, trainees) + ' ' + t('checkedIn'),
        actions: h(C.Button, { variant: 'secondary', size: 'sm', onClick: gen }, t('regenerateCode')) })
      : h('div', { key: pl.id, className: 'coop-dcard' }, h('span', { className: 'coop-dcard-title' }, title), h('p', { className: 'muted' }, t('noCodeYet')), h(C.Button, { onClick: gen }, t('generateCode')));
  }));
}
function DailyCodePage() {
  var app = useApp(), s = app.state, t = app.t, k = companyCtx(app);
  var past = s.codes.filter(function (c) { return k.pids.indexOf(c.placement) >= 0 && c.status === 'Expired'; }).slice().reverse();
  return h(Page, { title: t('dailyCodeTitle'), lead: t('expiresToday') },
    h(Grid, null, h(CodeCards, { placements: k.placements })),
    h(Section, { title: t('recentCodes') }, h(C.DataTable, { caption: t('recentCodes'), empty: t('noRecords'), columns: [
      { key: 'date', header: t('date') }, { key: 'opp', header: t('opportunity') }, { key: 'code', header: app.lang === 'ar' ? 'الرمز' : 'Code', render: function (r) { return h('span', { className: 'mono' }, r.code); } }, { key: 'status', header: t('status'), render: function (r) { return h(Badge, { status: r.status }); } }],
      rows: past.map(function (c) { return { id: c.id, date: fmtDate(c.date, app.lang), opp: oppOfPlacement(s, c.placement).title, code: c.code.slice(0, 3) + ' ' + c.code.slice(3), status: c.status }; }) })));
}

function EvalForm(p) {
  var app = useApp(), s = app.state, t = app.t;
  var init = { student: p.students[0] ? p.students[0].id : '', score: 80, comments: '' };
  var f = useForm(init, function (v) { var e = {}; if (v.comments.trim().length < 10) e.comments = t('commentsRequired'); return e; });
  function submit(e) {
    e.preventDefault(); if (!f.submit()) return;
    app.act({ type: 'submitEval', student: f.values.student, evalType: p.evalType, by: app.me.id, score: f.values.score, comments: f.values.comments.trim() }, t('evalSaved'), 'success', true);
    f.reset({ student: f.values.student, score: 80, comments: '' });
  }
  if (!p.students.length) return null;
  return h(Card, null, h('form', { className: 'form', onSubmit: submit, noValidate: true },
    h('div', { className: 'form-2' },
      h(C.TextField, { id: 'ev-stu', label: t('student'), value: f.values.student, options: p.students.map(function (x) { return { value: x.id, label: stuName(s, x.id) }; }), onChange: function (e) { f.set('student', e.target.value); } }),
      h('div', { className: 'coop-field' },
        h('label', { className: 'coop-label', htmlFor: 'ev-score' }, t('score') + ': ', h('b', { className: 'score-out' + (f.values.score < 60 ? ' low' : '') }, f.values.score), ' / 100', f.values.score < 60 ? h('span', { className: 'low-tag' }, t('belowPass')) : null),
        h('input', { id: 'ev-score', className: 'range', type: 'range', min: 0, max: 100, step: 1, value: f.values.score, onChange: function (e) { f.set('score', +e.target.value); } }),
        h('span', { className: 'coop-help' }, t('scoreHelp')))),
    h(C.TextField, { id: 'ev-com', label: t('comments'), multiline: true, value: f.values.comments, error: f.err('comments'), help: f.values.comments.trim().length < 10 ? fill(t('charsLeft'), { n: 10 - f.values.comments.trim().length }) : null, onChange: function (e) { f.set('comments', e.target.value); } }),
    h(Row, { end: true }, h(C.Button, { type: 'submit' }, t('submitEval')))));
}
function TraineesPage() {
  var app = useApp(), s = app.state, t = app.t, k = companyCtx(app);
  var ids = k.trainees.map(function (x) { return x.id; });
  var evals = s.evals.filter(function (e) { return e.type === 'Company' && ids.indexOf(e.student) >= 0; });
  return h(Page, { title: t('traineesTitle'), lead: k.trainees.length + ' ' + t('activeTrainees').toLowerCase() },
    h(StudentCards, { students: k.trainees, badge: function (x) { return evals.some(function (e) { return e.student === x.id; }) ? 'Evaluated' : 'Pending Evaluation'; } }),
    h(Section, { title: t('submitEval') }, h(EvalForm, { students: k.trainees, evalType: 'Company' })),
    h(Section, { title: t('evaluations') }, h(EvalList, { evals: evals, showStudent: true, empty: t('noRecords') })));
}

/* student cards + detail sheet (FamilyLink member cards) */
function StudentCards(p) {
  var app = useApp(), s = app.state, t = app.t, open = R.useState(null);
  if (!p.students.length) return h(Empty, { title: t('noRecords') });
  var sel = open[0] ? by(s.students, open[0]) : null;
  return h(R.Fragment, null,
    h('div', { className: 'people' }, p.students.map(function (x) {
      var rt = attRate(s, x.id), o = x.placement ? oppOfPlacement(s, x.placement) : null, name = stuName(s, x.id);
      return h('button', { key: x.id, className: 'person', onClick: function () { open[1](x.id); }, 'aria-label': t('viewDetails') + ': ' + name },
        h('span', { className: 'person-top' }, h(Avatar, { name: name }), h('span', { className: 'person-id' }, h('span', { className: 'person-name' }, name), h('span', { className: 'person-sub' }, o ? compName(s, o.company) : x.major)), p.badge ? h(Badge, { status: p.badge(x) }) : null),
        h('span', { className: 'person-stat' }, h('span', null, t('attendanceRate')), h('b', null, rt == null ? '—' : rt + '%')),
        h('span', { className: 'bar' }, h('span', { style: { width: (rt || 0) + '%' } })));
    })),
    sel ? h(StudentSheet, { student: sel, onClose: function () { open[1](null); } }) : null);
}
function StudentSheet(p) {
  var app = useApp(), s = app.state, t = app.t, x = p.student, name = stuName(s, x.id);
  var o = x.placement ? oppOfPlacement(s, x.placement) : null, rt = attRate(s, x.id);
  var rep = s.reports.filter(function (r) { return r.student === x.id; })[0];
  var recent = s.attendance.filter(function (a) { return a.student === x.id; }).slice(-5).reverse();
  var openRep = R.useState(null);
  if (openRep[0]) return h(ReportViewer, { reportId: openRep[0], onClose: function () { openRep[1](null); } });
  return h(Sheet, { label: t('studentDetails'), onClose: p.onClose,
    head: h('div', { className: 'sheet-head' }, h(Avatar, { name: name, size: 'lg' }), h('div', { className: 'sheet-id' }, h('p', { className: 'sheet-name' }, name), h('p', { className: 'sheet-sub' }, x.major + ' · GPA ' + x.gpa)), h('div', { className: 'sheet-kpi' }, h('b', null, rt == null ? '—' : rt + '%'), h('span', null, t('attendanceRate')))) },
    o ? h('div', { className: 'kv-list' },
      h('div', null, h('span', null, t('placement')), h('b', null, o.title + ' · ' + compName(s, o.company))),
      h('div', null, h('span', null, t('supervisor')), h('b', null, supName(s, x.supervisor) || t('unassigned'))),
      h('div', null, h('span', null, t('finalReport')), h('span', { className: 'row' }, rep ? h(FileButton, { file: rep.file, label: t('openFile'), openText: t('openReport'), onClick: function () { openRep[1](rep.id); } }) : null, h(Badge, { status: rep ? rep.status : 'Not submitted' })))) : h('p', { className: 'muted' }, t('noPlacementTitle')),
    recent.length ? h('div', { className: 'stack-sm' }, h('p', { className: 'coop-label' }, t('recentCheckins')),
      h('ul', { className: 'mini-list' }, recent.map(function (a) { return h('li', { key: a.id }, h('span', null, fmtDate(a.date, app.lang) + ' · ' + a.time), h(Badge, { status: a.status })); }))) : null,
    h('div', { className: 'stack-sm' }, h('p', { className: 'coop-label' }, t('evaluations')), h(EvalList, { evals: s.evals.filter(function (e) { return e.student === x.id; }) })));
}

