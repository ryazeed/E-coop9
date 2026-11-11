/* =====================================================================
   E-COOP - reports (UC-17 academic report, FR-21 institutional reports)
   Draws the report table and exports it to CSV (Excel) or prints it as PDF.
   ===================================================================== */

function attCounts(sid) {
  var c = { days: 0, approved: 0, pending: 0, rejected: 0 };
  S.attendance.filter(function (a) { return a.student === sid; }).forEach(function (a) {
    if (a.status === 'Approved') c.approved++; else if (a.status === 'Pending') c.pending++; else if (a.status === 'Rejected') c.rejected++;
  });
  c.days = c.approved + c.pending;
  return c;
}
function latestScore(sid, type) { var e = S.evals.filter(function (x) { return x.student === sid && x.type === type; })[0]; return e ? e.score : null; }
function average(list) { var v = list.filter(function (x) { return x != null; }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null; }
function dash(v) { return v == null || v === '' ? '—' : v; }

/* r = { title, file, logName, filters, cols: [[key, headerKey, isNumber, isStatus]], rows, totalRow, stats: [[label, value]] } */
var currentReport = null;

function showReport(r) {
  currentReport = r;
  var empty = !r.rows.length;
  setText('report-title', 'E-COOP · ' + r.title);
  setText('report-meta', t('generatedOn') + ': ' + fmtDate(TODAY) + ' ' + t('generatedBy') + ' ' + ME.name + ' · ' + r.filters);
  setHTML('report-stats', (r.stats || []).map(function (s) {
    return '<div class="card stat"><div class="label">' + esc(s[0]) + '</div><div class="value">' + esc(s[1]) + '</div></div>';
  }).join(''));
  setHTML('report-head', '<tr>' + r.cols.map(function (c) { return '<th' + (c[2] ? ' class="num"' : '') + '>' + esc(t(c[1])) + '</th>'; }).join('') + '</tr>');
  var rows = r.rows.concat(r.totalRow ? [r.totalRow] : []);
  setHTML('report-body', empty ? '<tr><td colspan="' + r.cols.length + '" class="muted">' + t('noReportData') + '</td></tr>' : rows.map(function (row, i) {
    var isTotal = r.totalRow && i === rows.length - 1;
    return '<tr' + (isTotal ? ' class="total"' : '') + '>' + r.cols.map(function (c) {
      var v = row[c[0]];
      return '<td' + (c[2] ? ' class="num"' : '') + '>' + (c[3] && v !== '—' && !isTotal ? badge(v) : esc(v)) + '</td>';
    }).join('') + '</tr>';
  }).join(''));
  document.getElementById('print-btn').disabled = empty;
  document.getElementById('csv-btn').disabled = empty;
  document.getElementById('print-btn').onclick = function () {
    act({ type: 'logExport', report: r.logName, format: 'PDF' });
    setTimeout(function () { window.print(); }, 100);
  };
  document.getElementById('csv-btn').onclick = function () {
    downloadCSV(r);
    act({ type: 'logExport', report: r.logName, format: 'CSV' }, t('exportedToast'));
  };
}

/* CSV with a BOM so Excel shows Arabic correctly */
function downloadCSV(r) {
  function cell(v) { v = v == null || v === '—' ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var lines = [cell(r.title), cell(t('generatedOn') + ': ' + TODAY + ' ' + t('generatedBy') + ' ' + ME.name), cell(r.filters), ''];
  lines.push(r.cols.map(function (c) { return cell(t(c[1])); }).join(','));
  r.rows.concat(r.totalRow ? [r.totalRow] : []).forEach(function (row) {
    lines.push(r.cols.map(function (c) { var v = row[c[0]]; return cell(c[3] && v !== '—' ? statusText(v) : v); }).join(','));
  });
  var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = r.file + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
