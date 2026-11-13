/* =====================================================================
   E-COOP - company pages
   overview.html, postings.html, applicants.html, dailycode.html, trainees.html
   ===================================================================== */

/* the company's opportunities, placements and trainees */
function myCompanyData() {
  var opps = S.opps.filter(function (o) { return o.company === ME.ref; });
  var oppIds = opps.map(function (o) { return o.id; });
  var placements = S.placements.filter(function (p) { return oppIds.indexOf(p.opp) >= 0; });
  var pids = placements.map(function (p) { return p.id; });
  var trainees = S.students.filter(function (x) { return pids.indexOf(x.placement) >= 0; });
  return { opps: opps, oppIds: oppIds, placements: placements, pids: pids, trainees: trainees };
}

/* ---------- Overview ---------- */
function renderOverview() {
  var k = myCompanyData();
  var newApps = S.apps.filter(function (a) { return k.oppIds.indexOf(a.opp) >= 0 && a.status === 'Submitted'; }).length;
  var todays = S.attendance.filter(function (a) { return k.pids.indexOf(a.placement) >= 0 && a.date === TODAY; }).length;
  var pct = k.trainees.length ? Math.round(todays * 100 / k.trainees.length) : 0;
  setText('eyebrow', longToday());
  setText('greeting', greeting() + ', ' + ME.name);
  setText('lead', t('companyOverview'));
  setText('glass-label', t('todaysCheckins'));
  setText('glass-value', todays + ' / ' + k.trainees.length);
  document.getElementById('glass-bar').style.width = pct + '%';
  setText('glass-note', k.trainees.length + ' ' + t('activeTrainees').toLowerCase());
  var n = document.getElementById('new-apps'); n.textContent = newApps; n.hidden = !newApps;
  setHTML('code-cards', codeCards(k.placements, 'renderOverview'));
  setHTML('activity', activityList(null, { pids: k.pids, oppIds: k.oppIds }));
}

/* ---------- Daily code ---------- */
function codeCards(placements, renderName) {
  if (!placements.length) return emptyBox(t('noRecords'));
  return placements.map(function (pl) {
    var code = S.codes.filter(function (c) { return c.placement === pl.id && c.date === TODAY && c.status === 'Active'; })[0];
    var trainees = S.students.filter(function (x) { return x.placement === pl.id; }).length;
    var ins = S.attendance.filter(function (a) { return a.placement === pl.id && a.date === TODAY; }).length;
    var title = esc(oppOfPlacement(pl.id).title);
    var btn = '<button class="btn' + (code ? ' btn-light btn-sm' : '') + '" type="button" onclick="makeCode(\'' + pl.id + '\', ' + renderName + ')">' +
      (code ? t('regenerateCode') : t('generateCode')) + '</button>';
    if (!code) return '<div class="card"><h3>' + title + '</h3><p class="muted">' + t('noCodeYet') + '</p>' + btn + '</div>';
    return '<div class="card"><div class="row" style="justify-content:space-between"><h3>' + title + '</h3>' + badge('Active') + '</div>' +
      '<div class="big-code">' + code.code.slice(0, 3) + ' ' + code.code.slice(3) + '</div>' +
      '<p class="muted small">' + t('expiresToday') + ' · ' + ins + ' / ' + trainees + ' ' + t('checkedIn') + '</p>' + btn + '</div>';
  }).join('');
}

function makeCode(pid, render) {
  act({ type: 'genCode', placement: pid }, t('codeGenerated'), render);
}

function renderDailyCode() {
  var k = myCompanyData();
  setText('lead', t('expiresToday'));
  setHTML('code-cards', codeCards(k.placements, 'renderDailyCode'));
  var past = S.codes.filter(function (c) { return k.pids.indexOf(c.placement) >= 0 && c.status === 'Expired'; }).slice().reverse();
  setHTML('codes-body', tableRows(past.map(function (c) {
    return [fmtDate(c.date), esc(oppOfPlacement(c.placement).title), '<span class="mono">' + c.code.slice(0, 3) + ' ' + c.code.slice(3) + '</span>', badge(c.status)];
  }), 4));
}

/* ---------- Postings ---------- */
var postFormReady = false;

function showPostForm(show) {
  document.getElementById('post-box').hidden = !show;
  document.getElementById('new-btn').hidden = show;
  if (show) document.getElementById('o-title').focus();
}

function renderPostings() {
  var k = myCompanyData(), company = find(S.companies, ME.ref), approved = company.status === 'Approved';
  setText('lead', t('postHelp'));
  document.getElementById('pending-alert').hidden = approved;
  document.getElementById('new-btn').hidden = !approved || !document.getElementById('post-box').hidden;

  if (!postFormReady) {
    setHTML('o-city', SA_CITIES.map(function (c) { return '<option value="' + esc(c.en) + '">' + esc(LANG === 'ar' ? c.ar : c.en) + '</option>'; }).join(''));
    document.getElementById('o-city').value = company.city;
    // template buttons fill the form
    document.querySelectorAll('#templates .chip').forEach(function (chip) {
      chip.onclick = function () {
        document.querySelectorAll('#templates .chip').forEach(function (c) { c.classList.remove('on'); });
        chip.classList.add('on');
        document.getElementById('o-title').value = chip.dataset.title;
        document.getElementById('o-major').value = chip.dataset.major;
        document.getElementById('o-desc').value = chip.dataset.desc;
      };
    });
    document.getElementById('post-form').onsubmit = submitPosting;
    if (approved && location.search.indexOf('new=1') >= 0) showPostForm(true);
    postFormReady = true;
  }

  setHTML('postings-body', tableRows(k.opps.map(function (o) {
    var apps = S.apps.filter(function (a) { return a.opp === o.id; }).length;
    return [esc(o.title), esc(cityLabel(o.city, LANG)), o.capacity, o.minGpa || '—', apps, fmtDate(o.posted), badge(o.status)];
  }), 7));
}

function submitPosting(e) {
  e.preventDefault();
  var title = document.getElementById('o-title').value.trim();
  var desc = document.getElementById('o-desc').value.trim();
  var cap = +document.getElementById('o-cap').value;
  setText('o-title-err', title.length < 5 ? t('titleRequired') : '');
  setText('o-desc-err', desc.length < 20 ? t('descRequired') : '');
  var gpa = document.getElementById('o-gpa').value.trim();                 // optional
  var gpaOk = gpa === '' || (!isNaN(gpa) && +gpa >= 0 && +gpa <= 5);
  setText('o-gpa-err', gpaOk ? '' : t('minGpaError'));
  if (title.length < 5 || desc.length < 20 || !gpaOk) return;
  if (!(cap >= 1 && cap <= 20)) { toast(t('capacityError'), true); return; }
  act({ type: 'postOpp', opp: { title: title, city: document.getElementById('o-city').value, majors: document.getElementById('o-major').value, capacity: cap, minGpa: gpa, description: desc } },
    t('postedToast'), renderPostings).then(function (res) {
    if (res.ok) { document.getElementById('post-form').reset(); document.getElementById('o-city').value = find(S.companies, ME.ref).city; showPostForm(false); }
  });
}

/* ---------- Applicants ---------- */
function renderApplicants() {
  var k = myCompanyData();
  var apps = S.apps.filter(function (a) { return k.oppIds.indexOf(a.opp) >= 0; }).sort(function (a, b) {
    return (a.status === 'Submitted' ? 0 : 1) - (b.status === 'Submitted' ? 0 : 1) || (a.date < b.date ? 1 : -1);
  });
  setText('lead', apps.filter(function (a) { return a.status === 'Submitted'; }).length + ' ' + t('newApplicants').toLowerCase());
  setHTML('applicants-body', tableRows(apps.map(function (a) {
    var st = find(S.students, a.student);
    var buttons = a.status !== 'Submitted' ? '' : '<div class="btns">' +
      '<button class="btn btn-sm btn-green" type="button" onclick="decideApp(\'' + a.id + '\', \'Accepted\')">' + t('accept') + '</button>' +
      '<button class="btn btn-sm btn-danger" type="button" onclick="decideApp(\'' + a.id + '\', \'Rejected\')">' + t('reject') + '</button></div>';
    return [who(st.user), esc(st.major), st.gpa, esc(find(S.opps, a.opp).title), fmtDate(a.date), badge(a.status), buttons];
  }), 7));
}

function decideApp(id, status) {
  act({ type: 'appDecision', id: id, status: status }, status === 'Accepted' ? t('acceptedToast') : t('rejectedToast'), renderApplicants);
}

/* ---------- Trainees and evaluations ---------- */
function renderTrainees() {
  var k = myCompanyData(), ids = k.trainees.map(function (x) { return x.id; });
  var evals = S.evals.filter(function (e) { return e.type === 'Company' && ids.indexOf(e.student) >= 0; });
  setText('lead', k.trainees.length + ' ' + t('activeTrainees').toLowerCase());
  setHTML('trainee-cards', studentCards(k.trainees, function (x) {
    return evals.some(function (e) { return e.student === x.id; }) ? 'Evaluated' : 'Pending Evaluation';
  }));
  setupEvalForm(k.trainees, 'Company', renderTrainees);
  setHTML('eval-list', evals.length ? evalCards(evals, true) : emptyBox(t('noRecords')));
}
