/* =====================================================================
   E-COOP - public pages: home (contact form), sign in, register
   ===================================================================== */

/* ---------- Home page ---------- */
function renderHome() {
  // role lists are translated as a whole list
  document.querySelectorAll('[data-t-list]').forEach(function (ul) {
    var items = I18N[LANG][ul.getAttribute('data-t-list')];
    if (items && items.map) ul.innerHTML = items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  });
  if (ME) {                                   // already signed in: the header button opens the app
    var link = document.getElementById('open-app');
    link.href = homeOf(ME.role);
    link.textContent = t('openApp');
  }
  document.getElementById('contact-form').onsubmit = sendContact;
}

function sendContact(e) {
  e.preventDefault();
  var name = document.getElementById('c-name').value.trim();
  var email = document.getElementById('c-email').value.trim();
  var msg = document.getElementById('c-msg').value.trim();
  var topic = document.getElementById('c-topic');
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setText('c-name-err', name.length < 3 ? t('eName') : '');
  setText('c-email-err', emailOk ? '' : t('eEmail'));
  setText('c-msg-err', msg.length < 20 ? t('msgLeft', { n: 20 - msg.length }) : '');
  if (name.length < 3 || !emailOk || msg.length < 20) return;
  api('action.php', { type: 'contact', msg: { name: name, email: email, topic: topic.selectedOptions[0].textContent, topicKey: topic.value, msg: msg } })
    .then(function (res) {
      if (!res.ok) { toast(res.error, true); return; }
      document.getElementById('contact-form').hidden = true;
      document.getElementById('contact-done').hidden = false;
    });
}

function contactAgain() {
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').hidden = false;
  document.getElementById('contact-done').hidden = true;
}

/* ---------- Sign in ---------- */
function renderLogin() {
  if (ME) { location.href = homeOf(ME.role); return; }

  document.getElementById('login-form').onsubmit = function (e) {
    e.preventDefault();
    var email = document.getElementById('h-email').value.trim(), pass = document.getElementById('h-pass').value;
    if (!email) { setText('login-error', t('eEmail')); return; }
    if (!pass) { setText('login-error', t('ePass')); return; }
    login(email, pass);
  };
  // demo account buttons
  document.querySelectorAll('.demo-list button').forEach(function (btn) {
    btn.onclick = function () { login(btn.dataset.email, DEMO_PASSWORD); };
  });
}

/* PHP checks the password with password_verify() and starts the session */
function login(email, password) {
  setText('login-error', '');
  api('auth.php', { op: 'login', email: email, password: password }).then(function (res) {
    if (res.ok) {
      var me = find(res.state.users, res.me);
      location.href = homeOf(me.role);
      return;
    }
    var messages = { no_user: 'eNoUser', suspended: 'eSuspended', wrong_password: 'rePassWrong' };
    setText('login-error', messages[res.code] ? t(messages[res.code]) : res.error);
  });
}

/* ---------- Register ---------- */
function renderRegister() {
  if (ME) { location.href = homeOf(ME.role); return; }
  setHTML('r-city', SA_CITIES.map(function (c) { return '<option value="' + esc(c.en) + '">' + esc(LANG === 'ar' ? c.ar : c.en) + '</option>'; }).join(''));
  document.getElementById('r-city').value = 'Jubail';

  document.querySelectorAll('input[name=kind]').forEach(function (radio) { radio.onchange = showKindFields; });
  showKindFields();
  document.getElementById('register-form').onsubmit = register;
}

function kind() { return document.querySelector('input[name=kind]:checked').value; }

/* show the fields of the chosen account type */
function showKindFields() {
  var k = kind();
  document.getElementById('student-fields').hidden = k !== 'Student';
  document.getElementById('supervisor-fields').hidden = k !== 'Supervisor';
  document.getElementById('company-fields').hidden = k !== 'Company';
  setText('r-name-label', k === 'Company' ? t('rCompanyName') : t('rFullName'));
  setText('r-email-label', k === 'Company' ? t('rEmail') : t('rCollegeEmail'));
  document.querySelectorAll('.kinds .chip').forEach(function (c) { c.classList.toggle('on', c.querySelector('input').checked); });
}

function register(e) {
  e.preventDefault();
  var k = kind();
  var v = {
    name: document.getElementById('r-name').value.trim(), email: document.getElementById('r-email').value.trim().toLowerCase(),
    phone: document.getElementById('r-phone').value.replace(/\s/g, ''), gpa: document.getElementById('r-gpa').value.trim(),
    pass: document.getElementById('r-pass').value, pass2: document.getElementById('r-pass2').value
  };
  var errors = {
    'r-name-err': v.name.length < 3 ? (k === 'Company' ? t('reCompany') : t('reName')) : '',
    'r-email-err': !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? t('reEmail') : (k !== 'Company' && !/@jic\.edu\.sa$/.test(v.email) ? t('reCollege') : ''),
    'r-phone-err': !/^05\d{8}$/.test(v.phone) ? t('rePhone') : '',
    'r-gpa-err': k === 'Student' && (isNaN(parseFloat(v.gpa)) || +v.gpa < 0 || +v.gpa > 5) ? t('reGpa') : '',
    'r-pass-err': v.pass.length < 8 || !/[A-Za-z]/.test(v.pass) || !/\d/.test(v.pass) ? t('rePass') : '',
    'r-pass2-err': v.pass !== v.pass2 ? t('rePass2') : '',
    'r-agree-err': !document.getElementById('r-agree').checked ? t('reAgree') : ''
  };
  var ok = true;
  Object.keys(errors).forEach(function (id) { setText(id, errors[id]); if (errors[id]) ok = false; });
  if (!ok) return;

  var btn = document.getElementById('r-submit'); btn.disabled = true;
  document.getElementById('server-error').hidden = true;
  api('auth.php', {
    op: 'register', kind: k, name: v.name, email: v.email, phone: v.phone, password: v.pass,
    major: document.getElementById('r-major').value, gpa: k === 'Student' ? String(parseFloat(v.gpa)) : '',
    city: document.getElementById('r-city').value, dept: document.getElementById('r-dept').value
  }).then(function (res) {
    if (res.ok) { location.href = homeOf(find(res.state.users, res.me).role); return; }
    btn.disabled = false;
    var box = document.getElementById('server-error');
    box.textContent = res.code === 'email_taken' ? t('reTaken') : res.code === 'email_domain' ? t('reCollege') : res.error;
    box.hidden = false;
  });
}
