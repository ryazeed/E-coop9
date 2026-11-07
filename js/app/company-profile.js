/* ================= COMPANY PROFILE (UC-07) ================= */
function CompanyProfileForm() {
  var app = useApp(), s = app.state, t = app.t, me = app.me, co = by(s.companies, me.ref);
  var f = useForm({ name: co.name, city: co.city, phone: userPhone(s, me) || '' }, function (v) {
    var e = {};
    if (v.name.trim().length < 2) e.name = t('companyNameError');
    if (!v.city) e.city = t('cityError');
    if (!/^0\d{8,9}$/.test(v.phone)) e.phone = t('companyPhoneError');
    return e;
  });
  function onSave(e) {
    e.preventDefault(); if (!f.submit()) return;
    app.act({ type: 'companyProfile', company: co.id, user: me.id, name: f.values.name.trim(), city: f.values.city, phone: f.values.phone }, t('companySaved'), 'success', true);
  }
  var cities = SA_CITIES.map(function (c) { return { value: c.en, label: app.lang === 'ar' ? c.ar : c.en }; }).sort(function (p, q) { return p.label.localeCompare(q.label); });
  return h('form', { className: 'form', onSubmit: onSave, noValidate: true },
    f.tried && Object.keys(f.errors).length ? h(C.Alert, { tone: 'danger', title: t('fixErrors') }) : null,
    h(C.TextField, { id: 'c-name', label: t('companyName'), required: true, value: f.values.name, error: f.err('name'), onChange: function (e) { f.set('name', e.target.value); } }),
    h('div', { className: 'form-2' },
      h(C.TextField, { id: 'c-city', label: t('city'), required: true, value: f.values.city, error: f.err('city'), options: cities, onChange: function (e) { f.set('city', e.target.value); } }),
      h(C.TextField, { id: 'c-phone', label: t('contactPhone'), required: true, value: f.values.phone, inputMode: 'numeric', error: f.err('phone'), help: '0138001200', onChange: function (e) { f.set('phone', e.target.value.trim()); } })),
    h(C.TextField, { id: 'c-email', label: t('companyEmail'), value: me.email, disabled: true }),
    h('div', { className: 'kv' }, h('span', { className: 'coop-label' }, t('approvalStatus')), h(Badge, { status: co.status })),
    h(Row, { end: true }, h(C.Button, { type: 'submit' }, t('saveCompany'))));
}

