/* =====================================================================
   E-COOP - COOP office (admin) pages
   analytics.html, approvals.html, users.html, assign.html, audit.html, reports.html
   ===================================================================== */

/* ---------- Analytics ---------- */
function renderAnalytics() {
  var active = S.students.filter(function (x) { return find(S.users, x.user).status === 'Active'; });
  var placedN = active.filter(function (x) { return x.placement; }).length;
  var rate = active.length ? Math.round(placedN * 100 / active.length) : 0;
  var pc = S.companies.filter(function (c) { return c.status === 'Pending Approval'; }).length;
  var po = S.opps.filter(function (o) { return o.status === 'Pending Approval'; }).length;
  var placed = S.students.filter(function (x) { return x.placement; });
  var avgAtt = placed.length ? Math.round(placed.reduce(function (sum, x) { return sum + attendanceRate(x.id); }, 0) / placed.length) : 0;

  setText('eyebrow', longToday());
  setText('lead', ME.name);
  setText('glass-label', t('placementRate'));
  setText('glass-value', rate + '%');
  document.getElementById('glass-bar').style.width = rate + '%';
  setText('glass-note', placedN + ' / ' + active.length + ' ' + t('placedOf'));
  var p = document.getElementById('pending-count'); p.textContent = pc + po; p.hidden = !(pc + po);

  setText('st-att', avgAtt + '%');
  document.getElementById('st-att-bar').style.width = avgAtt + '%';
  setText('st-placements', S.placements.filter(function (x) { return x.status === 'Active'; }).length);
  setText('st-pending', pc + po);
  setText('st-pending-note', pc + ' ' + t('companiesShort') + ' · ' + po + ' ' + t('opportunitiesShort'));

  // bar chart: trainees and open seats per approved company
  var perCompany = S.companies.filter(function (c) { return c.status === 'Approved'; }).map(function (c) {
    var n = placed.filter(function (x) { return oppOfPlacement(x.placement).company === c.id; }).length;
    var seats = S.opps.filter(function (o) { return o.company === c.id && o.status === 'Open'; }).reduce(function (sum, o) { return sum + o.capacity; }, 0);
    return { name: c.name, n: n, seats: seats };
  });
  var max = Math.max.apply(null, perCompany.map(function (c) { return Math.max(c.n, c.seats); }).concat([1]));
  setHTML('chart', perCompany.map(function (c) {
    return '<div class="chart-row"><span>' + esc(c.name) + '</span><span class="chart-track"><span class="cap" style="width:' + (c.seats * 100 / max) +
      '%"></span><span class="fill" style="width:' + (c.n * 100 / max) + '%"></span></span><span class="num">' + c.n + ' / ' + c.seats + '</span></div>';
  }).join(''));
  setHTML('audit-feed', auditFeed(S.audit.slice(0, 5)));
}

function auditFeed(rows) {
  if (!rows.length) return emptyBox(t('noActivity'));
  return '<ul class="feed">' + rows.map(function (l) {
    var tone = /Rejected|Suspended|FAILED/.test(l.action) ? 'danger' : /Approved|Accepted|Activated/.test(l.action) ? 'success' : '';
    return '<li><span class="dot ' + tone + '"></span><div><div class="top"><b>' + esc(userName(l.user) || '—') + '</b><span>' +
      relDay(l.ts) + ' · ' + l.ts.slice(11) + '</span></div><p>' + esc(l.action) + '</p></div></li>';
  }).join('') + '</ul>';
}

/* ---------- Approvals ---------- */
function renderApprovals() {
  var comps = S.companies.filter(function (c) { return c.status === 'Pending Approval'; });
  var opps = S.opps.filter(function (o) { return o.status === 'Pending Approval'; });
  setText('lead', (comps.length + opps.length) + ' ' + t('pendingApprovals').toLowerCase());
  setText('comp-count', comps.length);
  setText('opp-count', opps.length);
  setHTML('companies-body', tableRows(comps.map(function (c) {
    return [esc(c.name), esc(cityLabel(c.city, LANG)), esc(find(S.users, c.user).email), badge(c.status),
      buttons("decide('companyDecision', '" + c.id + "', 'Approved')", "decide('companyDecision', '" + c.id + "', 'Rejected')")];
  }), 5, t('nothingPending')));
  setHTML('opps-body', tableRows(opps.map(function (o) {
    return [esc(o.title), esc(companyName(o.company)), esc(o.majors), o.capacity, o.minGpa || '—',
      buttons("decide('oppDecision', '" + o.id + "', 'Open')", "decide('oppDecision', '" + o.id + "', 'Rejected')")];
  }), 6, t('nothingPending')));
}

function buttons(onApprove, onReject) {
  return '<div class="btns"><button class="btn btn-sm btn-green" type="button" onclick="' + onApprove + '">' + t('approve') + '</button>' +
    '<button class="btn btn-sm btn-danger" type="button" onclick="' + onReject + '">' + t('reject') + '</button></div>';
}

function decide(type, id, status) {
  act({ type: type, id: id, status: status }, status === 'Rejected' ? t('rejectedToast2') : t('approvedToast'), renderApprovals);
}

/* ---------- Users ---------- */
var roleFilter = '';

function renderUsers() {
  setText('lead', S.users.length + ' ' + t('accountsWord'));
  document.querySelectorAll('#role-filter .chip').forEach(function (chip) {
    chip.classList.toggle('on', chip.dataset.role === roleFilter);
    chip.onclick = function () { roleFilter = chip.dataset.role; renderUsers(); };
  });
  var roles = { Student: t('roleStudent'), Company: t('roleCompany'), Supervisor: t('roleSupervisor'), Admin: t('roleAdmin') };
  var list = S.users.filter(function (u) { return !roleFilter || u.role === roleFilter; });
  setHTML('users-body', tableRows(list.map(function (u) {
    var active = u.status === 'Active';
    var btn = u.id === ME.id ? '' : '<div class="btns"><button class="btn btn-sm ' + (active ? 'btn-danger' : 'btn-light') + '" type="button" onclick="setStatus(\'' + u.id + '\', \'' +
      (active ? 'Suspended' : 'Active') + '\')">' + (active ? t('suspend') : t('activate')) + '</button></div>';
    return [who(u.id), '<span class="ltr">' + esc(u.email) + '</span>', roles[u.role], badge(u.status), btn];
  }), 5));
}

function setStatus(id, status) {
  act({ type: 'userStatus', id: id, status: status }, status === 'Suspended' ? t('suspendedToast') : t('activatedToast'), renderUsers);
}

/* ---------- Assign supervisors ---------- */
function renderAssign() {
  setText('lead', t('assignHelp'));
  var sups = S.users.filter(function (u) { return u.role === 'Supervisor'; });
  setHTML('assign-body', tableRows(S.students.map(function (x) {
    var o = x.placement ? oppOfPlacement(x.placement) : null;
    var select = '<select onchange="assignTo(\'' + x.id + '\', this.value)" aria-label="' + t('supervisor') + '">' +
      (x.supervisor ? '' : '<option value="">' + t('unassigned') + '</option>') +
      sups.map(function (u) { return '<option value="' + u.ref + '"' + (u.ref === x.supervisor ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>';
    return [who(x.user), esc(x.major), o ? esc(companyName(o.company)) : '—', select];
  }), 4));
}

function assignTo(studentId, supId) {
  if (supId) act({ type: 'assign', student: studentId, supervisor: supId }, t('assignedToast'), renderAssign);
}

/* ---------- Audit log ---------- */
function renderAudit() {
  var box = document.getElementById('audit-q');
  box.oninput = renderAudit;
  var q = box.value.toLowerCase();
  var rows = S.audit.filter(function (l) { return !q || (userName(l.user) + ' ' + l.action).toLowerCase().indexOf(q) >= 0; });
  setText('lead', rows.length + ' ' + t('entriesWord'));
  setHTML('audit-feed', auditFeed(rows.slice(0, 50)));
}

/* ---------- Institutional reports (FR-21) ---------- */
var reportKind = 'placement';

function renderInstReports() {
  setText('lead', t('instReportsLead'));
  document.querySelectorAll('#report-kind .chip').forEach(function (chip) {
    chip.classList.toggle('on', chip.dataset.kind === reportKind);
    chip.onclick = function () { reportKind = chip.dataset.kind; renderInstReports(); };
  });
  var active = S.students.filter(function (x) { return find(S.users, x.user).status === 'Active'; });
  var files = { placement: 'Placement_by_Major', companies: 'Company_Participation', completion: 'Completion_and_Evaluations' };
  var r = { file: 'E-COOP_' + files[reportKind] + '_' + TODAY, filters: t('semester') + ' 481' };

  if (reportKind === 'placement') {
    var majors = [];
    active.forEach(function (x) { if (majors.indexOf(x.major) < 0) majors.push(x.major); });
    var T = { n: 0, p: 0, a: 0, acc: 0 };
    r.rows = majors.sort().map(function (m) {
      var st = active.filter(function (x) { return x.major === m; }), ids = st.map(function (x) { return x.id; });
      var placedN = st.filter(function (x) { return x.placement; }).length;
      var apps = S.apps.filter(function (a) { return ids.indexOf(a.student) >= 0; });
      var acc = apps.filter(function (a) { return a.status === 'Accepted'; }).length;
      T.n += st.length; T.p += placedN; T.a += apps.length; T.acc += acc;
      return { major: m, students: st.length, placed: placedN, unplaced: st.length - placedN, rate: Math.round(placedN * 100 / st.length) + '%', apps: apps.length, acc: acc };
    });
    var totalRate = T.n ? Math.round(T.p * 100 / T.n) : 0;
    r.totalRow = { major: t('total'), students: T.n, placed: T.p, unplaced: T.n - T.p, rate: totalRate + '%', apps: T.a, acc: T.acc };
    r.title = t('rPlacement');
    r.cols = [['major', 'colMajor'], ['students', 'colStudents', 1], ['placed', 'colPlaced', 1], ['unplaced', 'colUnplaced', 1], ['rate', 'colPlacementRate', 1], ['apps', 'colApplications', 1], ['acc', 'colAccepted', 1]];
    r.stats = [[t('stStudents'), T.n], [t('stPlacementRate'), totalRate + '%'], [t('colApplications'), T.a]];
  } else if (reportKind === 'companies') {
    r.rows = S.companies.map(function (c) {
      var opps = S.opps.filter(function (o) { return o.company === c.id; }), oids = opps.map(function (o) { return o.id; });
      var open = opps.filter(function (o) { return o.status === 'Open'; });
      var apps = S.apps.filter(function (a) { return oids.indexOf(a.opp) >= 0; });
      var pids = S.placements.filter(function (p) { return oids.indexOf(p.opp) >= 0; }).map(function (p) { return p.id; });
      var trainees = S.students.filter(function (x) { return pids.indexOf(x.placement) >= 0; });
      return { company: c.name, city: cityLabel(c.city, LANG), status: c.status, opps: open.length + ' / ' + opps.length,
        seats: open.reduce(function (sum, o) { return sum + o.capacity; }, 0), apps: apps.length,
        acc: apps.filter(function (a) { return a.status === 'Accepted'; }).length, trainees: trainees.length,
        score: dash(average(trainees.map(function (x) { return latestScore(x.id, 'Company'); }))) };
    });
    r.title = t('rCompanies');
    r.cols = [['company', 'colCompany'], ['city', 'colCity'], ['status', 'colStatus', 0, 1], ['opps', 'colOpps', 1], ['seats', 'colSeats', 1], ['apps', 'colApplications', 1],
      ['acc', 'colAccepted', 1], ['trainees', 'colTrainees', 1], ['score', 'colAvgScore', 1]];
    r.stats = [[t('stCompanies'), S.companies.filter(function (c) { return c.status === 'Approved'; }).length + ' / ' + S.companies.length],
      [t('colTrainees'), r.rows.reduce(function (sum, x) { return sum + x.trainees; }, 0)]];
  } else {
    var placed = S.students.filter(function (x) { return x.placement; });
    r.rows = placed.map(function (x) {
      var o = oppOfPlacement(x.placement), rep = S.reports.filter(function (y) { return y.student === x.id; })[0];
      var repSt = rep ? rep.status : 'Not submitted', cS = latestScore(x.id, 'Company'), aS = latestScore(x.id, 'Academic');
      var done = repSt === 'Approved' && cS != null && aS != null;
      return { student: studentName(x.id), major: x.major, company: companyName(o.company), sup: supervisorName(x.supervisor) || '—',
        att: attendanceRate(x.id) + '%', report: repSt, cScore: dash(cS), aScore: dash(aS), status: done ? 'Completed' : 'In progress' };
    });
    var doneN = r.rows.filter(function (x) { return x.status === 'Completed'; }).length;
    var cr = r.rows.length ? Math.round(doneN * 100 / r.rows.length) : 0;
    var aa = average(placed.map(function (x) { return attendanceRate(x.id); }));
    r.title = t('rCompletion');
    r.cols = [['student', 'colStudent'], ['major', 'colMajor'], ['company', 'colCompany'], ['sup', 'colSupervisor'], ['att', 'colAttRate', 1],
      ['report', 'colReport', 0, 1], ['cScore', 'colCompanyScore', 1], ['aScore', 'colAcademicScore', 1], ['status', 'colStatus', 0, 1]];
    r.stats = [[t('stCompletion'), cr + '%'], [t('stAvgAtt'), aa == null ? '—' : aa + '%'],
      [t('stReportsApproved'), r.rows.filter(function (x) { return x.report === 'Approved'; }).length + ' / ' + r.rows.length]];
  }
  r.logName = r.title.toLowerCase();
  showReport(r);
}
