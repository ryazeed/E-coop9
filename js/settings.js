/* =====================================================================
   E-COOP - settings page (all roles): photo, profile, notification
   settings, language and theme
   ===================================================================== */

var ROLE_KEY = { Student: 'roleStudent', Company: 'roleCompany', Supervisor: 'roleSupervisor', Admin: 'roleAdmin' };
var settingsReady = false;

function renderSettings() {
  setHTML('photo-box', avatar(ME, 'avatar-lg'));
  setText('set-name', ME.name);
  setText('set-sub', t(ROLE_KEY[ME.role]) + ' · ' + ME.email);
  document.getElementById('photo-remove').hidden = !ME.avatar;

  // notification switches (on by default, except the weekly summary)
  document.querySelectorAll('.pref').forEach(function (box) {
    var key = box.dataset.key, saved = S.prefs[ME.id + ':' + key];
    box.checked = saved == null ? key !== 'summary' : saved;
    box.onchange = function () { act({ type: 'pref', key: key, value: box.checked }, t('prefSaved')); };
  });

  if (settingsReady) return;
  settingsReady = true;

  document.getElementById('set-lang').value = LANG;
  document.getElementById('set-lang').onchange = function () { localStorage.setItem('ecoop-lang', this.value); location.reload(); };
  document.getElementById('set-theme').value = document.documentElement.getAttribute('data-theme') || 'light';
  document.getElementById('set-theme').onchange = function () {
    localStorage.setItem('ecoop-theme', this.value);
    document.documentElement.setAttribute('data-theme', this.value);
  };

  // profile photo (resized in the browser, saved by PHP in storage/avatars)
  document.getElementById('photo-input').onchange = function () {
    var file = this.files[0]; this.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast(t('photoType'), true); return; }
    if (file.size > 5 * 1024 * 1024) { toast(t('photoTooBig'), true); return; }
    resizePhoto(file, function (dataUrl) { act({ type: 'avatar', photo: dataUrl }, t('photoUpdated'), renderSettings); });
  };
  document.getElementById('photo-remove').onclick = function () { act({ type: 'avatar', photo: null }, t('photoRemoved'), renderSettings); };

  if (ME.role === 'Student') setupStudentProfile();
  else if (ME.role === 'Company') setupCompanyProfile();
  else {
    var phone = ME.phone ? '<li><span>' + t('phone') + '</span><b class="ltr">' + esc(ME.phone) + '</b></li>' : '';
    setHTML('info-list', '<li><span>' + t('fullName') + '</span><b>' + esc(ME.name) + '</b></li>' +
      '<li><span>' + t('email') + '</span><b class="ltr">' + esc(ME.email) + '</b></li>' + phone +
      '<li><span>' + t('role') + '</span><b>' + t(ROLE_KEY[ME.role]) + '</b></li>');
  }
}

/* square 256px JPEG so the photo stays small */
function resizePhoto(file, done) {
  var img = new Image();
  img.onload = function () {
    var size = 256, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var side = Math.min(img.width, img.height);
    canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    done(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.src = URL.createObjectURL(file);
}

function setupStudentProfile() {
  var st = myStudent();
  document.getElementById('p-name').value = ME.name;
  document.getElementById('p-email').value = ME.email;
  document.getElementById('p-phone').value = st.phone || '';
  document.getElementById('p-gpa').value = st.gpa;
  document.getElementById('p-major').value = st.major;
  setText('p-cv-name', st.cv ? t('cv') + ': ' + st.cv : t('fileHint'));

  document.getElementById('profile-form').onsubmit = function (e) {
    e.preventDefault();
    var name = document.getElementById('p-name').value.trim();
    var phone = document.getElementById('p-phone').value.trim();
    var gpa = document.getElementById('p-gpa').value.trim(), g = parseFloat(gpa);
    var cvFile = document.getElementById('p-cv').files[0];
    var ok = true;
    setText('p-name-err', name.length < 3 ? t('enterFullName') : ''); if (name.length < 3) ok = false;
    setText('p-phone-err', !/^05\d{8}$/.test(phone) ? t('phoneError') : ''); if (!/^05\d{8}$/.test(phone)) ok = false;
    setText('p-gpa-err', isNaN(g) || g < 0 || g > 4 ? t('gpaError') : ''); if (isNaN(g) || g < 0 || g > 4) ok = false;
    if (cvFile && !/\.(pdf|docx)$/i.test(cvFile.name)) { toast(t('fileTypeError'), true); ok = false; }
    if (!ok) return;
    act({ type: 'profile', fields: { phone: phone, gpa: gpa, cv: cvFile ? cvFile.name : st.cv }, userFields: { name: name } }, t('profileSaved'), function () {
      setText('set-name', ME.name); fillHeader();
    });
  };
}

function setupCompanyProfile() {
  var c = find(S.companies, ME.ref);
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-email').value = ME.email;
  document.getElementById('c-phone').value = ME.phone || '';
  setHTML('c-city', SA_CITIES.map(function (x) { return '<option value="' + esc(x.en) + '">' + esc(LANG === 'ar' ? x.ar : x.en) + '</option>'; }).join(''));
  document.getElementById('c-city').value = c.city;

  document.getElementById('company-form').onsubmit = function (e) {
    e.preventDefault();
    var name = document.getElementById('c-name').value.trim(), phone = document.getElementById('c-phone').value.trim();
    var phoneOk = phone === '' || /^0\d{8,9}$/.test(phone);
    setText('c-name-err', name.length < 3 ? t('cpNameError') : '');
    setText('c-phone-err', phoneOk ? '' : t('cpPhoneError'));
    if (name.length < 3 || !phoneOk) return;
    act({ type: 'companyProfile', name: name, city: document.getElementById('c-city').value, phone: phone }, t('cpSaved'), function () {
      setText('set-name', ME.name); fillHeader();
    });
  };
}
