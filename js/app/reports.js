/* ================= REPORTS (UC-17, FR-21) ================= */
function stLabel(app, v) { return app.lang === 'ar' ? (STATUS_AR[v] || v) : v; }
function attCounts(s, sid) {
  var r = s.attendance.filter(function (a) { return a.student === sid; });
  var c = { days: 0, approved: 0, pending: 0, rejected: 0 };
  r.forEach(function (a) { if (a.status === 'Approved') c.approved++; else if (a.status === 'Pending') c.pending++; else if (a.status === 'Rejected') c.rejected++; });
  c.days = c.approved + c.pending; return c;
}
function latestScore(s, sid, type) { var e = s.evals.filter(function (x) { return x.student === sid && x.type === type; })[0]; return e ? e.score : null; }
function avg(list) { var v = list.filter(function (x) { return x != null; }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null; }
function dash(v) { return v == null || v === '' ? '—' : v; }

/* rows: array of plain objects; cols: [{key, header, align}] — CSV with BOM so Excel opens Arabic correctly */
function downloadCSV(name, cols, rows, meta) {
  function esc(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var lines = (meta || []).map(function (m) { return esc(m); });
  if (lines.length) lines.push('');
  lines.push(cols.map(function (c) { return esc(c.header); }).join(','));
  rows.forEach(function (r) { lines.push(cols.map(function (c) { var v = r[c.key]; return esc(v === '—' ? '' : v); }).join(',')); });
  var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name + '.csv'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
}

/* shared shell: parameters card, export buttons, print header, stats and table */
function ReportView(p) {
  var app = useApp(), t = app.t;
  var empty = !p.rows.length;
  var meta = [p.title, t('generatedOn') + ': ' + fmtDate(TODAY, app.lang) + ' ' + t('generatedBy') + ' ' + app.me.name].concat(p.filters ? [t('filtersLabel') + ': ' + p.filters] : []);
  function doPrint() { app.dispatch({ type: 'logExport', by: app.me.id, report: p.logName, format: 'PDF' }); setTimeout(function () { window.print(); }, 50); }
  function doCSV() { downloadCSV(p.file, p.columns, p.rows.concat(p.totalRow ? [p.totalRow] : []), meta); app.act({ type: 'logExport', by: app.me.id, report: p.logName, format: 'CSV' }, t('exportedToast'), 'success', false); }
  return h('div', { className: 'stack' },
    h(Card, { className: 'no-print' }, h('div', { className: 'report-params' }, h('div', { className: 'report-fields' }, p.params),
      h('div', { className: 'report-actions' },
        h(C.Button, { variant: 'secondary', disabled: empty, onClick: doPrint }, t('printPdf')),
        h(C.Button, { disabled: empty, onClick: doCSV }, t('exportExcel'))))),
    empty ? h(C.Alert, { tone: 'warning', title: t('noReportData') }) : h('div', { className: 'report-out' },
      h('div', { className: 'print-head' },
        h('p', { className: 'print-college' }, t('college')),
        h('h1', { className: 'print-title' }, 'E-COOP · ' + p.title),
        meta.slice(1).map(function (m, i) { return h('p', { key: i, className: 'print-meta' }, m); })),
      p.stats ? h(Grid, { min: 'sm' }, p.stats.map(function (st, i) { return h(C.StatCard, { key: i, label: st[0], value: st[1], progress: st[2] }); })) : null,
      h(C.DataTable, { caption: p.title, columns: p.columns.map(function (c) { return c.badge ? Object.assign({}, c, { render: function (r) { return r[c.key] === '—' ? '—' : h(Badge, { status: r['_' + c.key] }); } }) : c; }),
        rows: p.totalRow ? p.rows.concat([Object.assign({ id: '_total' }, p.totalRow)]) : p.rows })));
}

function AcademicReports() {
  var app = useApp(), s = app.state, t = app.t, mine = supStudents(app);
  var major = R.useState(''), pl = R.useState(''), sem = R.useState('481');
  var majors = [], pls = [];
  mine.forEach(function (x) { if (majors.indexOf(x.major) < 0) majors.push(x.major); if (x.placement && pls.indexOf(x.placement) < 0) pls.push(x.placement); });
  var plOpts = pls.map(function (id) { var o = oppOfPlacement(s, id); return { value: id, label: compName(s, o.company) + ' · ' + o.title }; });
  var list = mine.filter(function (x) { return (!major[0] || x.major === major[0]) && (!pl[0] || x.placement === pl[0]); });
  var rows = list.map(function (x) {
    var c = attCounts(s, x.id), o = x.placement ? oppOfPlacement(s, x.placement) : null, rep = s.reports.filter(function (r) { return r.student === x.id; })[0];
    var repSt = rep ? rep.status : 'Not submitted';
    return { id: x.id, student: stuName(s, x.id), major: x.major, placement: o ? compName(s, o.company) + ' · ' + o.title : '—', days: c.days, approved: c.approved, pending: c.pending, rejected: c.rejected,
      att: x.placement ? attRate(s, x.id) : '—', report: stLabel(app, repSt), _report: repSt, cScore: dash(latestScore(s, x.id, 'Company')), aScore: dash(latestScore(s, x.id, 'Academic')) };
  });
  var cols = [{ key: 'student', header: t('colStudent') }, { key: 'major', header: t('colMajor') }, { key: 'placement', header: t('colPlacement') },
    { key: 'days', header: t('colDays'), align: 'end' }, { key: 'approved', header: t('colApproved'), align: 'end' }, { key: 'pending', header: t('colPending'), align: 'end' }, { key: 'rejected', header: t('colRejected'), align: 'end' },
    { key: 'att', header: t('colAttRate'), align: 'end' }, { key: 'report', header: t('colReport'), badge: true }, { key: 'cScore', header: t('colCompanyScore'), align: 'end' }, { key: 'aScore', header: t('colAcademicScore'), align: 'end' }];
  var placed = list.filter(function (x) { return x.placement; });
  var avgAtt = avg(placed.map(function (x) { return attRate(s, x.id); }));
  var appr = rows.filter(function (r) { return r._report === 'Approved'; }).length;
  var avgC = avg(list.map(function (x) { return latestScore(s, x.id, 'Company'); }));
  var all = { value: '', label: t('all') };
  var filters = [t('semester') + ' ' + sem[0], major[0] || t('all'), pl[0] ? plOpts.filter(function (o) { return o.value === pl[0]; })[0].label : t('allPlacements')].join(' · ');
  return h(Page, { title: t('academicReportsTitle'), lead: t('academicReportsLead') },
    h(ReportView, { title: t('academicReportsTitle'), logName: 'academic cohort', file: 'E-COOP_Academic_Report_' + TODAY, filters: filters, columns: cols, rows: rows,
      stats: [[t('stStudents'), String(rows.length)], [t('stAvgAtt'), avgAtt == null ? '—' : avgAtt + '%', avgAtt], [t('stReportsApproved'), frac(appr, rows.length)], [t('stAvgCompany'), avgC == null ? '—' : avgC + '/100', avgC]],
      params: h('div', { className: 'form-3' },
        h(C.TextField, { id: 'ar-sem', label: t('semester'), value: sem[0], options: [{ value: '481', label: t('semester481') }], onChange: function (e) { sem[1](e.target.value); } }),
        h(C.TextField, { id: 'ar-major', label: t('filterMajor'), value: major[0], options: [all].concat(majors.sort()), onChange: function (e) { major[1](e.target.value); } }),
        h(C.TextField, { id: 'ar-pl', label: t('cohort'), value: pl[0], options: [{ value: '', label: t('allPlacements') }].concat(plOpts), onChange: function (e) { pl[1](e.target.value); } })) }));
}

function InstitutionReports() {
  var app = useApp(), s = app.state, t = app.t, kind = R.useState('placement');
  var active = s.students.filter(function (x) { return by(s.users, x.user).status === 'Active'; });
  var cols, rows, totalRow = null, stats, title;
  if (kind[0] === 'placement') {
    title = t('rPlacement');
    var majors = []; active.forEach(function (x) { if (majors.indexOf(x.major) < 0) majors.push(x.major); }); majors.sort();
    var T = { n: 0, p: 0, a: 0, acc: 0 };
    rows = majors.map(function (m) {
      var st = active.filter(function (x) { return x.major === m; }), ids = st.map(function (x) { return x.id; });
      var placedN = st.filter(function (x) { return x.placement; }).length, ap = s.apps.filter(function (a) { return ids.indexOf(a.student) >= 0; });
      var acc = ap.filter(function (a) { return a.status === 'Accepted'; }).length;
      T.n += st.length; T.p += placedN; T.a += ap.length; T.acc += acc;
      return { id: m, major: m, students: st.length, placed: placedN, unplaced: st.length - placedN, rate: Math.round(placedN * 100 / st.length), apps: ap.length, acc: acc };
    });
    totalRow = { major: t('total'), students: T.n, placed: T.p, unplaced: T.n - T.p, rate: T.n ? Math.round(T.p * 100 / T.n) : 0, apps: T.a, acc: T.acc };
    cols = [{ key: 'major', header: t('colMajor') }, { key: 'students', header: t('colStudents'), align: 'end' }, { key: 'placed', header: t('colPlaced'), align: 'end' }, { key: 'unplaced', header: t('colUnplaced'), align: 'end' },
      { key: 'rate', header: t('colPlacementRate'), align: 'end' }, { key: 'apps', header: t('colApplications'), align: 'end' }, { key: 'acc', header: t('colAccepted'), align: 'end' }];
    stats = [[t('stStudents'), String(T.n)], [t('stPlacementRate'), totalRow.rate + '%', totalRow.rate], [t('colApplications'), String(T.a)]];
  } else if (kind[0] === 'companies') {
    title = t('rCompanies');
    rows = s.companies.map(function (c) {
      var opps = s.opps.filter(function (o) { return o.company === c.id; }), oids = opps.map(function (o) { return o.id; });
      var open = opps.filter(function (o) { return o.status === 'Open'; });
      var ap = s.apps.filter(function (a) { return oids.indexOf(a.opp) >= 0; });
      var pids = s.placements.filter(function (p) { return oids.indexOf(p.opp) >= 0; }).map(function (p) { return p.id; });
      var tr = s.students.filter(function (x) { return pids.indexOf(x.placement) >= 0; });
      return { id: c.id, company: c.name, city: cityLabel(c.city, app.lang), status: stLabel(app, c.status), _status: c.status, opps: open.length + ' / ' + opps.length,
        seats: open.reduce(function (a, o) { return a + o.capacity; }, 0), apps: ap.length, acc: ap.filter(function (a) { return a.status === 'Accepted'; }).length, trainees: tr.length,
        score: dash(avg(tr.map(function (x) { return latestScore(s, x.id, 'Company'); }))) };
    });
    cols = [{ key: 'company', header: t('colCompany') }, { key: 'city', header: t('colCity') }, { key: 'status', header: t('colStatus'), badge: true }, { key: 'opps', header: t('colOpps'), align: 'end' },
      { key: 'seats', header: t('colSeats'), align: 'end' }, { key: 'apps', header: t('colApplications'), align: 'end' }, { key: 'acc', header: t('colAccepted'), align: 'end' },
      { key: 'trainees', header: t('colTrainees'), align: 'end' }, { key: 'score', header: t('colAvgScore'), align: 'end' }];
    stats = [[t('stCompanies'), frac(s.companies.filter(function (c) { return c.status === 'Approved'; }).length, s.companies.length)], [t('colTrainees'), String(rows.reduce(function (a, r) { return a + r.trainees; }, 0))]];
  } else {
    title = t('rCompletion');
    var placed = s.students.filter(function (x) { return x.placement; });
    rows = placed.map(function (x) {
      var o = oppOfPlacement(s, x.placement), rep = s.reports.filter(function (r) { return r.student === x.id; })[0], repSt = rep ? rep.status : 'Not submitted';
      var cS = latestScore(s, x.id, 'Company'), aS = latestScore(s, x.id, 'Academic');
      var done = repSt === 'Approved' && cS != null && aS != null;
      return { id: x.id, student: stuName(s, x.id), major: x.major, company: compName(s, o.company), sup: supName(s, x.supervisor) || '—', att: attRate(s, x.id),
        report: stLabel(app, repSt), _report: repSt, cScore: dash(cS), aScore: dash(aS), status: done ? t('completedLbl') : t('inProgress'), _status: done ? 'Completed' : 'In progress' };
    });
    cols = [{ key: 'student', header: t('colStudent') }, { key: 'major', header: t('colMajor') }, { key: 'company', header: t('colCompany') }, { key: 'sup', header: t('colSupervisor') },
      { key: 'att', header: t('colAttRate'), align: 'end' }, { key: 'report', header: t('colReport'), badge: true }, { key: 'cScore', header: t('colCompanyScore'), align: 'end' },
      { key: 'aScore', header: t('colAcademicScore'), align: 'end' }, { key: 'status', header: t('colStatus'), badge: true }];
    var doneN = rows.filter(function (r) { return r._status === 'Completed'; }).length, cr = rows.length ? Math.round(doneN * 100 / rows.length) : 0;
    var aa = avg(placed.map(function (x) { return attRate(s, x.id); }));
    stats = [[t('stCompletion'), cr + '%', cr], [t('stAvgAtt'), aa == null ? '—' : aa + '%', aa], [t('stReportsApproved'), frac(rows.filter(function (r) { return r._report === 'Approved'; }).length, rows.length)]];
  }
  var files = { placement: 'Placement_by_Major', companies: 'Company_Participation', completion: 'Completion_and_Evaluations' };
  return h(Page, { title: t('instReportsTitle'), lead: t('instReportsLead') },
    h(ReportView, { title: title, logName: title.toLowerCase(), file: 'E-COOP_' + files[kind[0]] + '_' + TODAY, filters: t('semester') + ' 481', columns: cols, rows: rows, totalRow: totalRow, stats: stats,
      params: h(Segmented, { id: 'ir-kind', label: t('reportType'), value: kind[0], onChange: kind[1], options: [{ value: 'placement', label: t('rPlacement') }, { value: 'companies', label: t('rCompanies') }, { value: 'completion', label: t('rCompletion') }] }) }));
}

