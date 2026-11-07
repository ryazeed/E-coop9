/* ================= REPORT VIEWER ================= */
function SampleReport(p) {
  var app = useApp(), s = app.state, rep = p.report, st = by(s.students, rep.student), name = stuName(s, rep.student);
  var o = st && st.placement ? oppOfPlacement(s, st.placement) : null, pl = st && st.placement ? by(s.placements, st.placement) : null;
  var co = o ? compName(s, o.company) : '—';
  var secs = [
    ['1. Introduction', 'This report summarises my cooperative training as ' + (o ? o.title : 'a trainee') + ' at ' + co + ' from ' + (pl ? fmtDate(pl.start, 'en') : '—') + ' to ' + (pl ? fmtDate(pl.end, 'en') : '—') + '. It covers the company, my tasks, the skills I built and the challenges I faced.'],
    ['2. Company overview', co + ' operates in the Eastern Province of Saudi Arabia. My department supports daily operations and reports to the operations manager. The team I joined has six full-time staff.'],
    ['3. Tasks and responsibilities', (o ? o.description : '') + ' I also attended the weekly KPI review and prepared short summaries for my line manager.'],
    ['4. Skills gained', 'I improved my Excel skills (pivot tables, lookups and charts), learned how the ERP system records stock movements, and practised presenting results clearly to non-specialists.'],
    ['5. Challenges', 'The main challenge was reconciling data from two systems that use different item codes. I built a mapping sheet with my supervisor, which cut the weekly reconciliation from one day to two hours.'],
    ['6. Conclusion', 'The placement connected my Business Administration courses to real operations. I recommend continuing the partnership between the college and ' + co + '.']
  ];
  return h('article', { className: 'paper', lang: 'en', dir: 'ltr' },
    h('p', { className: 'paper-kicker' }, 'Jubail Industrial College · Department of Business Administration'),
    h('h1', { className: 'paper-title' }, 'Final Cooperative Training Report'),
    h('dl', { className: 'paper-meta' },
      h('dt', null, 'Student'), h('dd', null, name),
      h('dt', null, 'Major'), h('dd', null, st ? st.major : ''),
      h('dt', null, 'Company'), h('dd', null, co),
      h('dt', null, 'Academic supervisor'), h('dd', null, st ? supName(s, st.supervisor) : ''),
      h('dt', null, 'Submitted'), h('dd', null, fmtDate(rep.date, 'en'))),
    secs.map(function (x) { return h('section', { key: x[0] }, h('h2', null, x[0]), h('p', null, x[1])); }));
}

function ReportViewer(p) {
  var app = useApp(), s = app.state, t = app.t, rep = by(s.reports, p.reportId);
  var st = R.useState({ kind: 'loading' }), view = st[0], setView = st[1];
  var pagesRef = R.useRef(null), boxRef = R.useRef(null), closeRef = R.useRef(null);
  R.useEffect(function () {
    var prev = document.activeElement; if (closeRef.current) closeRef.current.focus();
    function onKey(e) { if (e.key === 'Escape') p.onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  R.useEffect(function () {
    var alive = true;
    if (!rep) return;
    if (!rep.fileKey) { setView({ kind: 'sample' }); return; }
    var isPdf = /\.pdf$/i.test(rep.file);
    FileStore.get(rep.fileKey).then(function (rec) {
      if (!alive) return;
      if (!rec) { setView({ kind: 'missing' }); return; }
      return rec.blob.arrayBuffer().then(function (buf) {
        if (isPdf) {
          return LibLoader.pdf().then(function (pdfjs) {
            return pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
          }).then(function (doc) {
            if (!alive) return;
            setView({ kind: 'pdf', pages: doc.numPages });
            var host = pagesRef.current; if (!host) return;
            host.innerHTML = '';
            var width = Math.min((boxRef.current ? boxRef.current.clientWidth : 800) - 32, 820);
            var chain = Promise.resolve();
            for (var i = 1; i <= doc.numPages; i++) (function (n) {
              chain = chain.then(function () {
                return doc.getPage(n).then(function (page) {
                  if (!alive) return;
                  var base = page.getViewport({ scale: 1 }), scale = width / base.width, dpr = window.devicePixelRatio || 1;
                  var vp = page.getViewport({ scale: scale * dpr });
                  var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
                  c.style.width = Math.round(vp.width / dpr) + 'px'; c.style.height = Math.round(vp.height / dpr) + 'px';
                  c.className = 'pdf-page'; c.setAttribute('aria-label', fill(t('pageN'), { n: n, m: doc.numPages }));
                  host.appendChild(c);
                  return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                });
              });
            })(i);
            return chain;
          });
        }
        return LibLoader.docx().then(function (mammoth) { return mammoth.convertToHtml({ arrayBuffer: buf }); }).then(function (out) { if (alive) setView({ kind: 'docx', html: out.value }); });
      });
    }).catch(function (e) { if (alive) setView({ kind: /unavailable|load /.test(String(e && e.message)) ? 'nolib' : 'error' }); });
    return function () { alive = false; };
  }, [p.reportId, rep && rep.fileKey]);
  if (!rep) return null;
  var name = stuName(s, rep.student);
  var canDecide = app.me.role === 'Supervisor' && rep.status === 'Submitted';
  return h('div', { className: 'viewer-wrap', onClick: function (e) { if (e.target === e.currentTarget) p.onClose(); } },
    h('div', { className: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': rep.file },
      h('header', { className: 'viewer-head' },
        h('span', { className: 'viewer-icon' }, h(Icon, { name: 'doc', size: 22 })),
        h('div', { className: 'viewer-id' }, h('p', { className: 'viewer-name' }, rep.file), h('p', { className: 'viewer-sub' }, name + ' · ' + t('submitted') + ' ' + fmtDate(rep.date, app.lang) + (view.kind === 'pdf' ? ' · ' + view.pages + ' ' + t('pagesWord') : ''))),
        h(Badge, { status: rep.status }),
        h('button', { className: 'viewer-close', ref: closeRef, onClick: p.onClose }, h(Icon, { name: 'x', size: 18 }), h('span', null, t('close')))),
      h('div', { className: 'viewer-body', ref: boxRef },
        view.kind === 'sample' ? h(R.Fragment, null, h('p', { className: 'viewer-note' }, h('span', { className: 'demo-tag' }, t('demo')), t('sampleNote')), h(SampleReport, { report: rep })) : null,
        view.kind === 'loading' ? h('p', { className: 'viewer-msg' }, t('loadingFile')) : null,
        view.kind === 'missing' ? h('div', { className: 'viewer-msg' }, h(C.Alert, { tone: 'warning', title: t('missingFile') })) : null,
        view.kind === 'nolib' ? h('div', { className: 'viewer-msg' }, h(C.Alert, { tone: 'danger', title: t('noViewer') })) : null,
        view.kind === 'error' ? h('div', { className: 'viewer-msg' }, h(C.Alert, { tone: 'danger', title: t('fileError') })) : null,
        view.kind === 'docx' ? h('article', { className: 'paper paper-docx', dangerouslySetInnerHTML: { __html: view.html } }) : null,
        h('div', { className: 'pdf-pages', ref: pagesRef, hidden: view.kind !== 'pdf' })),
      canDecide ? h('footer', { className: 'viewer-foot' },
        h(C.Button, { variant: 'secondary', onClick: function () { app.act({ type: 'reportDecision', id: rep.id, status: 'Request Revision', by: app.me.id }, t('revisionToast'), 'info', true); p.onClose(); } }, t('requestRevision')),
        h(C.Button, { onClick: function () { app.act({ type: 'reportDecision', id: rep.id, status: 'Approved', by: app.me.id }, t('reportApprovedToast'), 'success', true); p.onClose(); } }, t('approve'))) : null));
}

function FileButton(p) {
  return h('button', { className: 'file-btn', onClick: p.onClick, 'aria-label': p.label + ': ' + p.file }, h(Icon, { name: 'doc', size: 18 }), h('span', { className: 'file-btn-name' }, p.file), h('span', { className: 'file-btn-open' }, p.openText));
}

