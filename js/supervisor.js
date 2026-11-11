/* =====================================================================
   E-COOP - academic supervisor pages
   students.html, attendance.html, reports.html, evaluations.html, academic.html
   ===================================================================== */

function myStudents() { return S.students.filter(function (x) { return x.supervisor === ME.ref; }); }
function myStudentIds() { return myStudents().map(function (x) { return x.id; }); }

/* ---------- Students (home) ---------- */
function renderStudents() {
  var mine = myStudents(), ids = myStudentIds();
  var pending = S.attendance.filter(function (a) { return ids.indexOf(a.student) >= 0 && a.status === 'Pending'; }).length;
  var reports = S.reports.filter(function (r) { return ids.indexOf(r.student) >= 0 && r.status === 'Submitted'; }).length;
  var placed = mine.filter(function (x) { return x.placement; });
  var avg = placed.length ? Math.round(placed.reduce(function (sum, x) { return sum + attendanceRate(x.id); }, 0) / placed.length) : 0;

  setText('eyebrow', longToday());
  setText('greeting', greeting() + ', ' + ME.name);
  setText('lead', mine.length + ' ' + t('myStudents').toLowerCase());
  setText('glass-label', t('attendanceRate'));
  setText('glass-value', avg + '%');
  document.getElementById('glass-bar').style.width = avg + '%';
  setText('glass-note', pending + ' ' + t('pendingAttendance').toLowerCase());
  var p = document.getElementById('pending-count'); p.textContent = pending; p.hidden = !pending;
  var r = document.getElementById('reports-count'); r.textContent = reports; r.hidden = !reports;

  setHTML('student-cards', studentCards(mine, function (x) {
    var rep = S.reports.filter(function (y) { return y.student === x.id; })[0];
    return rep ? rep.status : 'Not submitted';
  }));
  setHTML('activity', activityList(ids));
}

/* ---------- Attendance approvals ---------- */
function renderSupAttendance() {
  var ids = myStudentIds();
  var pending = S.attendance.filter(function (a) { return ids.indexOf(a.student) >= 0 && a.status === 'Pending'; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  setText('lead', pending.length ? pending.length + ' ' + t('pendingAttendance').toLowerCase() : t('nothingPending'));

  var all = document.getElementById('approve-all');
  all.hidden = !pending.length;
  setText('all-count', pending.length);
  all.onclick = function () { decideAttendance(pending.map(function (a) { return a.id; }), 'Approved'); };

  setHTML('attendance-body', tableRows(pending.map(function (a) {
    var st = find(S.students, a.student), opp = oppOfPlacement(a.placement);
    return [who(st.user), esc(companyName(opp.company)), fmtDate(a.date), a.time, badge(a.status),
      '<div class="btns"><button class="btn btn-sm btn-green" type="button" onclick="decideAttendance([\'' + a.id + '\'], \'Approved\')">' + t('approve') + '</button>' +
      '<button class="btn btn-sm btn-danger" type="button" onclick="decideAttendance([\'' + a.id + '\'], \'Rejected\')">' + t('reject') + '</button></div>'];
  }), 6, t('nothingPending')));
}

function decideAttendance(ids, status) {
  var msg = (status === 'Approved' ? t('approvedToast') : t('rejectedToast2')) + ' (' + ids.length + ')';
  act({ type: 'attDecision', ids: ids, status: status }, msg, renderSupAttendance);
}

/* ---------- Final reports ---------- */
function renderSupReports() {
  var ids = myStudentIds();
  var reports = S.reports.filter(function (r) { return ids.indexOf(r.student) >= 0; });
  setText('lead', t('reportsLead'));
  setHTML('reports-body', tableRows(reports.map(function (r) {
    var st = find(S.students, r.student);
    var buttons = r.status !== 'Submitted' ? '' : '<div class="btns">' +
      '<button class="btn btn-sm btn-green" type="button" onclick="decideReport(\'' + r.id + '\', \'Approved\')">' + t('approve') + '</button>' +
      '<button class="btn btn-sm btn-light" type="button" onclick="decideReport(\'' + r.id + '\', \'Request Revision\')">' + t('requestRevision') + '</button></div>';
    return [who(st.user), '<a href="' + reportLink(r) + '" target="_blank">&#128196; ' + esc(r.file) + '</a>', fmtDate(r.date), badge(r.status), buttons];
  }), 5));
}

function decideReport(id, status) {
  act({ type: 'reportDecision', id: id, status: status }, status === 'Approved' ? t('reportApprovedToast') : t('revisionToast'), renderSupReports);
}

/* ---------- Academic evaluations ---------- */
function renderSupEvals() {
  var placed = myStudents().filter(function (x) { return x.placement; }), ids = placed.map(function (x) { return x.id; });
  setupEvalForm(placed, 'Academic', renderSupEvals);
  var evals = S.evals.filter(function (e) { return ids.indexOf(e.student) >= 0; });
  setHTML('eval-list', evals.length ? evalCards(evals, true) : emptyBox(t('noRecords')));
}

/* ---------- Academic report (UC-17) ---------- */
var academicReady = false;

function renderAcademic() {
  var mine = myStudents();
  setText('lead', t('academicReportsLead'));
  if (!academicReady) {
    var majors = [], pls = [];
    mine.forEach(function (x) { if (majors.indexOf(x.major) < 0) majors.push(x.major); if (x.placement && pls.indexOf(x.placement) < 0) pls.push(x.placement); });
    setHTML('ar-major', '<option value="">' + t('all') + '</option>' + majors.sort().map(function (m) { return '<option>' + esc(m) + '</option>'; }).join(''));
    setHTML('ar-pl', '<option value="">' + t('allPlacements') + '</option>' + pls.map(function (id) {
      var o = oppOfPlacement(id); return '<option value="' + id + '">' + esc(companyName(o.company) + ' · ' + o.title) + '</option>';
    }).join(''));
    ['ar-major', 'ar-pl'].forEach(function (id) { document.getElementById(id).onchange = renderAcademic; });
    academicReady = true;
  }
  var major = document.getElementById('ar-major').value, pl = document.getElementById('ar-pl').value;
  var list = mine.filter(function (x) { return (!major || x.major === major) && (!pl || x.placement === pl); });

  var rows = list.map(function (x) {
    var c = attCounts(x.id), o = x.placement ? oppOfPlacement(x.placement) : null;
    var rep = S.reports.filter(function (r) { return r.student === x.id; })[0];
    return { student: studentName(x.id), major: x.major, placement: o ? companyName(o.company) + ' · ' + o.title : '—', days: c.days, approved: c.approved,
      pending: c.pending, rejected: c.rejected, att: x.placement ? attendanceRate(x.id) + '%' : '—', report: rep ? rep.status : 'Not submitted',
      cScore: dash(latestScore(x.id, 'Company')), aScore: dash(latestScore(x.id, 'Academic')) };
  });
  var cols = [['student', 'colStudent'], ['major', 'colMajor'], ['placement', 'colPlacement'], ['days', 'colDays', 1], ['approved', 'colApproved', 1],
    ['pending', 'colPending', 1], ['rejected', 'colRejected', 1], ['att', 'colAttRate', 1], ['report', 'colReport', 0, 1], ['cScore', 'colCompanyScore', 1], ['aScore', 'colAcademicScore', 1]];
  var placed = list.filter(function (x) { return x.placement; });
  var avgAtt = average(placed.map(function (x) { return attendanceRate(x.id); }));
  var approved = rows.filter(function (r) { return r.report === 'Approved'; }).length;
  var avgC = average(list.map(function (x) { return latestScore(x.id, 'Company'); }));
  var filters = t('semester') + ' 481 · ' + (major || t('all')) + ' · ' + (pl ? document.getElementById('ar-pl').selectedOptions[0].textContent : t('allPlacements'));

  showReport({
    title: t('academicReportsTitle'), file: 'E-COOP_Academic_Report_' + TODAY, logName: 'academic cohort', filters: filters, cols: cols, rows: rows,
    stats: [[t('stStudents'), rows.length], [t('stAvgAtt'), avgAtt == null ? '—' : avgAtt + '%'], [t('stReportsApproved'), approved + ' / ' + rows.length], [t('stAvgCompany'), avgC == null ? '—' : avgC + '/100']]
  });
}
