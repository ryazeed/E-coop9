/* =====================================================================
   E-COOP - student pages
   dashboard.html, opportunities.html, applications.html, attendance.html, report.html
   ===================================================================== */

/* ---------- Dashboard ---------- */
/* progress: placement 20%, training days 50%, final report 15%, two evaluations 15% */
function studentProgress(st) {
  var pl = st.placement ? find(S.placements, st.placement) : null;
  var total = pl ? workdays(pl.start, pl.end).length : 0;
  var done = pl ? Math.min(total, workdays(pl.start, TODAY < pl.end ? TODAY : pl.end).length) : 0;
  var rep = S.reports.filter(function (r) { return r.student === st.id; })[0];
  var evals = S.evals.filter(function (e) { return e.student === st.id; });
  var evalTypes = ['Company', 'Academic'].filter(function (ty) { return evals.some(function (e) { return e.type === ty; }); }).length;
  var today = S.attendance.filter(function (a) { return a.student === st.id && a.date === TODAY; })[0];
  var pct = (pl ? 20 : 0) + (total ? 50 * done / total : 0) + (rep ? (rep.status === 'Approved' ? 15 : rep.status === 'Submitted' ? 7.5 : 0) : 0) + evalTypes * 7.5;
  return { pl: pl, total: total, done: done, rep: rep, evalTypes: evalTypes, today: today, pct: Math.round(pct) };
}

function renderDashboard() {
  var st = myStudent(), g = studentProgress(st);
  setText('eyebrow', longToday());
  setText('greeting', greeting() + ', ' + ME.name.split(' ')[0]);
  setText('lead', st.major);

  // progress card in the page title
  setText('progress-value', g.pct + '%');
  document.getElementById('progress-bar').style.width = g.pct + '%';
  var steps = [
    [t('stepPlacement'), g.pl ? t('stepDone') : t('stepNotYet'), g.pl ? 'done' : 'now'],
    [t('stepTraining'), g.pl ? g.done + ' / ' + g.total + ' ' + t('stepDays') : '—', !g.pl ? '' : g.done >= g.total ? 'done' : 'now'],
    [t('stepReport'), g.rep ? statusText(g.rep.status) : t('stepNotYet'), g.rep && g.rep.status === 'Approved' ? 'done' : g.rep ? 'now' : ''],
    [t('stepEvals'), g.evalTypes + ' / 2', g.evalTypes === 2 ? 'done' : g.evalTypes ? 'now' : '']
  ];
  setHTML('progress-steps', steps.map(function (s) { return '<li class="' + s[2] + '"><b>' + esc(s[0]) + '</b>' + esc(s[1]) + '</li>'; }).join(''));
  var next = !g.pl ? t('nextApply') : !g.today && g.done < g.total ? t('nextCheckIn') : g.rep && g.rep.status === 'Request Revision' ? t('nextRevision')
    : g.done < g.total ? t('nextKeepGoing') : !g.rep ? t('nextReport') : t('nextEvals');
  setText('next-step', next);

  var myApps = S.apps.filter(function (a) { return a.student === st.id; });
  var count = document.getElementById('apps-count');
  count.textContent = myApps.length; count.hidden = !myApps.length;

  var opp = st.placement ? oppOfPlacement(st.placement) : null;
  document.getElementById('placed').hidden = !opp;
  document.getElementById('not-placed').hidden = !!opp;

  if (opp) {
    var pl = find(S.placements, st.placement);
    var alerts = '';
    if (!g.today) alerts += '<div class="alert alert-warning"><b>' + t('checkInToday') + '</b> <a href="attendance.html">' + t('logAttendance') + '</a></div>';
    if (g.rep && g.rep.status === 'Request Revision') alerts += '<div class="alert alert-danger">' + t('revisionNote') + '</div>';
    setHTML('alerts', alerts);
    setHTML('placement-card', badge('Active') + '<h3>' + esc(opp.title) + '</h3><p class="company">' + esc(companyName(opp.company)) + '</p>' +
      '<p>' + esc(opp.description) + '</p><div class="meta"><span>&#128205; ' + esc(cityLabel(opp.city, LANG)) + '</span><span>&#127891; ' + esc(opp.majors) + '</span></div>' +
      '<p class="muted small">' + fmtDate(pl.start) + ' – ' + fmtDate(pl.end) + '</p>');
    setText('sup-name', supervisorName(st.supervisor) || t('unassigned'));
    setHTML('report-status', badge(g.rep ? g.rep.status : 'Not submitted'));
    setHTML('activity', activityList([st.id], { self: true }));
  } else {
    setHTML('alerts', '');
    document.getElementById('my-apps-box').hidden = !myApps.length;
    setHTML('apps-body', appRows(myApps));
  }
}

/* ---------- Applications ---------- */
function appRows(apps) {
  return tableRows(apps.map(function (a) {
    var o = find(S.opps, a.opp);
    return [esc(o.title), esc(companyName(o.company)), fmtDate(a.date), badge(a.status)];
  }), 4, t('noApps'));
}

function renderApplications() {
  setHTML('apps-body', appRows(S.apps.filter(function (a) { return a.student === ME.ref; })));
}

/* ---------- Opportunities ---------- */
var filtersReady = false;

function renderOpportunities() {
  var st = myStudent();
  document.getElementById('placed-alert').hidden = !st.placement;

  // only approved opportunities of approved companies
  var visible = S.opps.filter(function (o) { var c = find(S.companies, o.company); return o.status === 'Open' && c && c.status === 'Approved'; });

  if (!filtersReady) {          // fill the drop-downs once
    var majors = [], cities = [];
    visible.forEach(function (o) {
      o.majors.split(', ').forEach(function (m) { if (majors.indexOf(m) < 0) majors.push(m); });
      if (cities.indexOf(o.city) < 0) cities.push(o.city);
    });
    var all = '<option value="">' + t('all') + '</option>';
    setHTML('f-major', all + majors.sort().map(function (m) { return '<option>' + esc(m) + '</option>'; }).join(''));
    setHTML('f-city', all + cities.sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(cityLabel(c, LANG)) + '</option>'; }).join(''));
    if (majors.indexOf(st.major) >= 0) document.getElementById('f-major').value = st.major;
    ['f-q', 'f-major', 'f-city'].forEach(function (id) { document.getElementById(id).oninput = renderOpportunities; });
    filtersReady = true;
  }

  var q = document.getElementById('f-q').value.toLowerCase();
  var major = document.getElementById('f-major').value;
  var city = document.getElementById('f-city').value;
  var list = visible.filter(function (o) {
    var text = (o.title + ' ' + companyName(o.company)).toLowerCase();
    return (!q || text.indexOf(q) >= 0) && (!major || o.majors.indexOf(major) >= 0) && (!city || o.city === city);
  });
  setText('lead', list.length + ' ' + t('oppsFound'));

  if (!list.length) { setHTML('opp-list', emptyBox(t('noOppsMatch'))); return; }
  setHTML('opp-list', list.map(function (o) {
    var mine = S.apps.filter(function (a) { return a.student === st.id && a.opp === o.id; })[0];
    var pl = S.placements.filter(function (p) { return p.opp === o.id; })[0];
    var taken = pl ? S.students.filter(function (x) { return x.placement === pl.id; }).length : 0;
    var button = mine
      ? '<a class="btn btn-sm btn-light" href="applications.html">' + t('viewApplication') + '</a>'
      : '<button class="btn btn-sm" type="button" onclick="applyTo(\'' + o.id + '\')"' + (st.placement || taken >= o.capacity ? ' disabled' : '') + '>' + (taken >= o.capacity ? t('full') : t('apply')) + '</button>';
    return '<div class="card opp">' + (mine ? badge(mine.status) : '') +
      '<h3>' + esc(o.title) + '</h3><p class="company">' + esc(companyName(o.company)) + '</p><p>' + esc(o.description) + '</p>' +
      '<div class="meta"><span>&#128205; ' + esc(cityLabel(o.city, LANG)) + '</span><span>&#127891; ' + esc(o.majors) + '</span><span>&#128186; ' + t('seats') + ': ' + (o.capacity - taken) + ' / ' + o.capacity + '</span></div>' +
      '<div class="foot"><span class="muted small">' + t('postedOn') + ' ' + fmtDate(o.posted) + '</span>' + button + '</div></div>';
  }).join(''));
}

function applyTo(oppId) {
  act({ type: 'apply', opp: oppId }, t('appliedToast'), renderOpportunities);
}

/* ---------- Attendance (daily code) ---------- */
function renderAttendance() {
  var st = myStudent();
  document.getElementById('no-placement').hidden = !!st.placement;
  document.getElementById('attendance-box').hidden = !st.placement;
  if (!st.placement) return;

  var p = find(S.placements, st.placement), opp = oppOfPlacement(st.placement);
  var mine = S.attendance.filter(function (a) { return a.student === st.id; }).slice().reverse();
  var rate = attendanceRate(st.id);
  setText('eyebrow', t('trainingDay', { n: workdays(p.start, TODAY).length, m: workdays(p.start, p.end).length }));
  setText('lead', opp.title + ' · ' + companyName(opp.company));
  setText('glass-label', t('termProgress'));
  setText('glass-value', rate + '%');
  document.getElementById('glass-bar').style.width = rate + '%';
  setText('glass-note', mine.length + ' ' + t('daysLogged').toLowerCase());

  var todayRec = mine.filter(function (a) { return a.date === TODAY; })[0];
  var done = document.getElementById('today-done');
  done.hidden = !todayRec;
  if (todayRec) done.textContent = t('checkedInToday') + ' ' + todayRec.time + '. ' + t('awaitingApproval');

  setHTML('history-body', tableRows(mine.slice(0, 12).map(function (a) { return [fmtDate(a.date), a.time, badge(a.status)]; }), 3));
  setupCodeBoxes();
}

/* six boxes: typing moves to the next box, pasting fills all of them */
function setupCodeBoxes() {
  var boxes = document.querySelectorAll('#code-boxes input');
  boxes.forEach(function (box, i) {
    box.oninput = function () {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      setText('code-error', '');
      if (box.value && i < 5) boxes[i + 1].focus();
      checkCode();
    };
    box.onkeydown = function (e) { if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus(); };
    box.onpaste = function (e) {
      e.preventDefault();
      var digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      for (var k = 0; k < digits.length; k++) boxes[k].value = digits[k];
      checkCode();
    };
  });
}

/* when all six digits are in, PHP checks the code (BR-14, BR-15, BR-16; 5 wrong codes = 10 minutes block) */
function checkCode() {
  var boxes = document.querySelectorAll('#code-boxes input');
  var code = Array.prototype.map.call(boxes, function (b) { return b.value; }).join('');
  if (code.length < 6) return;
  boxes.forEach(function (b) { b.disabled = true; });
  api('action.php', { type: 'checkIn', code: code }).then(function (res) {
    if (res.state) S = res.state;
    boxes.forEach(function (b) { b.disabled = false; b.value = ''; });
    if (res.ok) {
      var msg = t('codeOk') + ' ' + nowTime() + '. ' + t('awaitingApproval');
      var ok = document.getElementById('code-ok'); ok.textContent = msg; ok.hidden = false;
      toast(t('codeOk') + ' ' + nowTime());
      renderAttendance();
    } else {
      var key = { code_duplicate: 'codeDuplicate', code_expired: 'codeExpired', code_none: 'codeNone', code_invalid: 'codeInvalid', code_locked: 'codeLocked' }[res.code];
      setText('code-error', key && (LANG === 'ar' || res.code !== 'code_invalid') ? t(key) : res.error);
      boxes[0].focus();
    }
  });
}

/* ---------- Final report ---------- */
function renderReport() {
  var st = myStudent();
  var rep = S.reports.filter(function (r) { return r.student === st.id; })[0];
  setText('lead', t('reportLead'));
  document.getElementById('no-placement').hidden = !!st.placement;
  document.getElementById('report-box').hidden = !st.placement;

  document.getElementById('current-report').hidden = !rep;
  if (rep) {
    document.getElementById('report-link').href = reportLink(rep);
    setText('report-file', rep.file);
    setHTML('report-badge', badge(rep.status));
  }
  document.getElementById('report-approved').hidden = !(rep && rep.status === 'Approved');
  document.getElementById('report-revision').hidden = !(rep && rep.status === 'Request Revision');
  document.getElementById('upload-form').hidden = !st.placement || (rep && rep.status !== 'Request Revision');

  document.getElementById('upload-form').onsubmit = function (e) {
    e.preventDefault();
    var file = document.getElementById('report-input').files[0];
    if (!file || !/\.(pdf|docx)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setText('upload-error', t('fileTypeError')); return; }
    setText('upload-error', '');
    var btn = document.getElementById('upload-btn'); btn.disabled = true;
    // 1) upload the file  2) save the report record
    var key = 'f' + Date.now(), data = new FormData();
    data.append('key', key); data.append('file', file, file.name);
    fetch(ROOT + 'api/upload.php', { method: 'POST', body: data, credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (up) {
      if (!up.ok) { btn.disabled = false; setText('upload-error', up.error); return; }
      act({ type: 'submitReport', file: file.name, fileKey: key }, t('reportSubmitted'), renderReport).then(function () {
        btn.disabled = false; document.getElementById('report-input').value = '';
      });
    });
  };

  setHTML('eval-list', evalCards(S.evals.filter(function (e) { return e.student === st.id; })));
}
