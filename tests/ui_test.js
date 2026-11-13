// Browser test of the HTML version: every page of every role + the main operations through the interface.
// usage: node ui_test.js http://127.0.0.1:8093 <screenshots dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2], SHOTS = process.argv[3] || '/tmp/html_shots';
fs.mkdirSync(SHOTS, { recursive: true });
const results = [], errors = [];
function ok(name, cond, info) { results.push(!!cond); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  -> ' + String(info || '').slice(0, 300))); }

const PAGES = {
  student: ['dashboard', 'opportunities', 'applications', 'attendance', 'report', 'chat', 'settings'],
  company: ['overview', 'postings', 'applicants', 'dailycode', 'trainees', 'chat', 'settings'],
  supervisor: ['students', 'attendance', 'reports', 'evaluations', 'academic', 'chat', 'settings'],
  admin: ['analytics', 'approvals', 'users', 'assign', 'audit', 'reports', 'chat', 'settings']
};

(async () => {
  await fetch(BASE + '/install.php', { method: 'POST' });
  const browser = await chromium.launch();
  async function open(lang) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    if (lang) await ctx.addInitScript((l) => localStorage.setItem('ecoop-lang', l), lang);
    const p = await ctx.newPage(); p.setDefaultTimeout(8000);
    p.on('pageerror', e => errors.push(p.url() + ' :: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(p.url() + ' :: console: ' + m.text()); });
    return { ctx, p };
  }
  async function login(p, email, pw) {
    await p.goto(BASE + '/login.html'); await p.waitForSelector('#h-email');
    await p.fill('#h-email', email); await p.fill('#h-pass', pw || 'Coop@2026');
    await p.click('#login-form button[type=submit]');
    await p.waitForTimeout(900);
  }
  const text = (p) => p.locator('body').innerText();
  async function visitAll(p, folder) {
    let good = 0;
    for (const name of PAGES[folder]) {
      await p.goto(BASE + '/' + folder + '/' + name + '.html'); await p.waitForTimeout(600);
      const filled = await p.evaluate(() => document.getElementById('me-name') && document.getElementById('me-name').textContent.length > 0);
      if (filled && p.url().includes('/' + folder + '/')) good++; else console.log('   page problem:', folder, name, p.url());
    }
    ok(folder + ': all ' + PAGES[folder].length + ' pages open with data', good === PAGES[folder].length, good);
  }

  // ---------- public pages
  let { ctx, p } = await open();
  await p.goto(BASE + '/'); await p.waitForTimeout(600);
  ok('home page loads', /Cooperative training/i.test(await text(p)));
  await p.screenshot({ path: SHOTS + '/01_home.png', fullPage: false });
  await p.fill('#c-name', 'Visitor Test'); await p.fill('#c-email', 'v@test.sa'); await p.fill('#c-msg', 'Hello, I would like more information about COOP.');
  await p.click('#contact-form button[type=submit]'); await p.waitForTimeout(800);
  ok('contact form sends to the COOP office', await p.isVisible('#contact-done'));
  await p.goto(BASE + '/student/dashboard.html'); await p.waitForTimeout(800);
  ok('protected page sends a guest to sign in', p.url().endsWith('/login.html'));
  await login(p, 'ahmed.almousa@jic.edu.sa', 'wrong-pass');
  ok('wrong password is refused', /incorrect/i.test(await p.textContent('#login-error')));
  await p.screenshot({ path: SHOTS + '/02_login.png' });
  await ctx.close();

  // ---------- company: daily code, post opportunity, accept applicant
  ({ ctx, p } = await open());
  await login(p, 'coop@easternlogistics.sa');
  ok('company signs in to Overview', p.url().endsWith('/company/overview.html'));
  await visitAll(p, 'company');
  await p.goto(BASE + '/company/dailycode.html'); await p.waitForTimeout(700);
  await p.locator('#code-cards button').first().click(); await p.waitForTimeout(900);
  const code = (await p.locator('.big-code').first().innerText()).replace(/\s/g, '');
  ok('company generates the 6-digit code', /^\d{6}$/.test(code), code);
  await p.screenshot({ path: SHOTS + '/03_company_code.png' });
  await p.goto(BASE + '/company/postings.html?new=1'); await p.waitForTimeout(700);
  await p.locator('#templates .chip').nth(2).click();
  await p.click('#post-form button[type=submit]'); await p.waitForTimeout(900);
  ok('company posts an opportunity from a template', /Procurement Assistant Trainee/.test(await p.textContent('#postings-body')));
  await p.goto(BASE + '/company/applicants.html'); await p.waitForTimeout(700);
  await p.locator('#applicants-body tr', { hasText: 'Hind' }).first().getByRole('button', { name: 'Accept' }).click(); await p.waitForTimeout(900);
  ok('company accepts an applicant (other application withdrawn)', /Accepted/.test(await p.textContent('#applicants-body')) && /Withdrawn/.test(await p.textContent('#applicants-body')));
  await p.goto(BASE + '/company/trainees.html'); await p.waitForTimeout(700);
  await p.selectOption('#ev-student', { label: 'Ahmed Abdulmohsen Almousa' });
  await p.fill('#ev-comments', 'Reliable trainee, good stock count work.'); await p.click('#eval-form button[type=submit]'); await p.waitForTimeout(900);
  ok('company submits an evaluation', /Reliable trainee/.test(await p.textContent('#eval-list')));
  await p.locator('.person').first().click(); await p.waitForTimeout(300);
  ok('student details pop-up opens', await p.isVisible('#modal'));
  await ctx.close();

  // ---------- student: wrong code, right code, apply, report upload
  ({ ctx, p } = await open());
  await login(p, 'ahmed.almousa@jic.edu.sa');
  ok('student signs in to Dashboard', p.url().endsWith('/student/dashboard.html'));
  await p.screenshot({ path: SHOTS + '/04_student_dashboard.png' });
  await visitAll(p, 'student');
  await p.goto(BASE + '/student/attendance.html'); await p.waitForTimeout(700);
  const boxes = p.locator('#code-boxes input');
  await boxes.first().click(); await p.keyboard.type(code === '000000' ? '111111' : '000000'); await p.waitForTimeout(1000);
  ok('wrong code refused by PHP', /wrong|invalid/i.test(await p.textContent('#code-error')));
  await boxes.first().click(); await p.keyboard.type(code); await p.waitForTimeout(1200);
  ok('right code: attendance saved', await p.isVisible('#today-done') && /waiting/i.test(await p.textContent('#today-done')));
  await p.screenshot({ path: SHOTS + '/05_student_attendance.png' });
  await p.goto(BASE + '/student/report.html'); await p.waitForTimeout(700);
  await p.setInputFiles('#report-input', { name: 'Ahmed_Final_Report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
  await p.click('#upload-btn'); await p.waitForTimeout(1500);
  ok('student uploads the final report', /Ahmed_Final_Report\.pdf/.test(await p.textContent('#report-file')));
  await p.goto(BASE + '/student/settings.html'); await p.waitForTimeout(700);
  await p.fill('#p-gpa', '3.40'); await p.click('#profile-form button[type=submit]'); await p.waitForTimeout(900);
  ok('student saves the profile', /Profile saved/i.test(await p.textContent('#toast')));
  await p.click('text=Sign Out'); await p.waitForTimeout(900);
  ok('sign out returns to sign in', p.url().endsWith('/login.html'));
  await ctx.close();

  ({ ctx, p } = await open());
  await login(p, 'yazeed.alqahtani@jic.edu.sa');
  await p.goto(BASE + '/student/opportunities.html'); await p.waitForTimeout(700);
  await p.selectOption('#f-major', '');
  const card = p.locator('#opp-list .card').filter({ has: p.locator('button:enabled', { hasText: 'Apply' }) }).first();
  const title = await card.locator('h3').innerText();
  await card.getByRole('button', { name: 'Apply' }).click(); await p.waitForTimeout(900);
  ok('student applies for an opportunity', /Submitted/.test(await p.locator('#opp-list .card', { hasText: title }).innerText()), title);
  await ctx.close();

  // ---------- supervisor: approve attendance, review report, academic report CSV
  ({ ctx, p } = await open());
  await login(p, 'abdullah.alrumi@jic.edu.sa');
  ok('supervisor signs in', p.url().endsWith('/supervisor/students.html'));
  await visitAll(p, 'supervisor');
  await p.goto(BASE + '/supervisor/attendance.html'); await p.waitForTimeout(700);
  await p.locator('#attendance-body tr').first().getByRole('button', { name: 'Approve' }).click(); await p.waitForTimeout(900);
  ok('supervisor approves attendance', /Approved/.test(await p.textContent('#toast')));
  await p.screenshot({ path: SHOTS + '/06_supervisor_attendance.png' });
  await p.goto(BASE + '/supervisor/reports.html'); await p.waitForTimeout(700);
  await p.locator('#reports-body tr', { hasText: 'Ahmed_Final_Report' }).getByRole('button', { name: 'Request Revision' }).click(); await p.waitForTimeout(900);
  ok('supervisor requests a revision', /Revision/.test(await p.locator('#reports-body tr', { hasText: 'Ahmed_Final_Report' }).innerText()));
  await p.goto(BASE + '/supervisor/academic.html'); await p.waitForTimeout(700);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv-btn')]);
  ok('academic report exports to CSV', /\.csv$/.test(dl.suggestedFilename()));
  await ctx.close();

  // ---------- admin (Arabic): approvals, users, assign, reports
  ({ ctx, p } = await open('ar'));
  await login(p, 'coop.office@jic.edu.sa');
  ok('admin signs in (Arabic, right-to-left)', p.url().endsWith('/admin/analytics.html') && await p.evaluate(() => document.dir) === 'rtl');
  await p.screenshot({ path: SHOTS + '/07_admin_analytics_ar.png' });
  await visitAll(p, 'admin');
  await p.goto(BASE + '/admin/approvals.html'); await p.waitForTimeout(700);
  const before = await p.locator('#opps-body tr').count();
  await p.locator('#opps-body tr').first().locator('button').first().click(); await p.waitForTimeout(900);
  ok('admin approves an opportunity', (await p.locator('#opps-body tr').count()) === before - 1 || /لا يوجد/.test(await p.textContent('#opps-body')));
  await p.goto(BASE + '/admin/users.html'); await p.waitForTimeout(700);
  await p.locator('#users-body tr', { hasText: 'Omar' }).locator('button').click(); await p.waitForTimeout(900);
  ok('admin suspends a user', /موقوف/.test(await p.locator('#users-body tr', { hasText: 'Omar' }).innerText()));
  await p.goto(BASE + '/admin/assign.html'); await p.waitForTimeout(700);
  await p.locator('#assign-body tr', { hasText: 'Yazeed' }).locator('select').selectOption('sup2'); await p.waitForTimeout(900);
  ok('admin assigns a supervisor', (await p.locator('#assign-body tr', { hasText: 'Yazeed' }).locator('select').inputValue()) === 'sup2');
  await p.goto(BASE + '/admin/reports.html'); await p.waitForTimeout(700);
  await p.locator('#report-kind .chip').nth(2).click(); await p.waitForTimeout(400);
  ok('admin switches institutional report', (await p.locator('#report-body tr').count()) > 0);
  await p.goto(BASE + '/admin/audit.html'); await p.waitForTimeout(700);
  ok('audit log shows the actions', /Assigned/.test(await p.textContent('#audit-feed')));
  await p.screenshot({ path: SHOTS + '/08_admin_audit_ar.png' });
  await ctx.close();

  // ---------- minimum GPA: company sets it, student with a lower GPA cannot apply
  ({ ctx, p } = await open());
  await login(p, 'yazeed.alqahtani@jic.edu.sa');
  await p.goto(BASE + '/student/opportunities.html'); await p.waitForTimeout(700);
  const low = p.locator('#opp-list .card', { hasText: 'Procurement Analyst Trainee' });
  ok('opportunity card shows the minimum GPA', /Minimum GPA: 3\.75/.test(await low.innerText()), await low.innerText());
  ok('student below the minimum GPA cannot apply', await low.locator('button').isDisabled() && /below the minimum/.test(await low.innerText()));
  await low.screenshot({ path: SHOTS + '/10_min_gpa_card.png' });
  await p.screenshot({ path: SHOTS + '/10_opportunities.png' });
  await ctx.close();
  ({ ctx, p } = await open());
  await login(p, 'coop@easternlogistics.sa');
  await p.goto(BASE + '/company/postings.html?new=1'); await p.waitForTimeout(700);
  await p.fill('#o-title', 'Inventory Control Trainee'); await p.fill('#o-desc', 'Count stock every week and report differences to the warehouse manager.');
  await p.fill('#o-gpa', '4.5'); await p.click('#post-form button[type=submit]'); await p.waitForTimeout(300);
  ok('minimum GPA above 4 is refused', /between 0 and 4/.test(await p.textContent('#o-gpa-err')));
  await p.fill('#o-gpa', '3.8'); await p.screenshot({ path: SHOTS + '/11_post_form_gpa.png' });
  await p.click('#post-form button[type=submit]'); await p.waitForTimeout(900);
  const posted = p.locator('#postings-body tr', { hasText: 'Inventory Control Trainee' });
  ok('company posts an opportunity with a minimum GPA', /3\.80/.test(await posted.innerText()), await posted.innerText().catch(() => 'no row'));
  await ctx.close();

  // ---------- chat: student writes to the supervisor, the supervisor sees it and answers
  ({ ctx, p } = await open());
  await login(p, 'ahmed.almousa@jic.edu.sa');
  ok('menu shows unread chat messages', (await p.textContent('#chat-count')).trim() === '5', await p.textContent('#chat-count'));
  await p.goto(BASE + '/student/chat.html'); await p.waitForTimeout(700);
  ok('chat lists my conversations', await p.locator('.chat-row').count() === 3);
  await p.locator('.chat-row', { hasText: 'Abdullah Rashed Alrumi' }).click(); await p.waitForTimeout(700);
  ok('conversation opens with its messages', await p.locator('#msgs .msg').count() === 3 && /college template/.test(await p.textContent('#msgs')));
  await p.fill('#msg-input', 'The outline is ready, I will upload it today.'); await p.click('#composer button[type=submit]'); await p.waitForTimeout(800);
  ok('student sends a message', /outline is ready/.test(await p.locator('#msgs .msg.mine').last().innerText()));
  await p.screenshot({ path: SHOTS + '/12_chat.png' });
  await p.locator('.chat-row', { hasText: 'Supply Chain Analyst Trainee' }).click(); await p.waitForTimeout(700);
  ok('opening a conversation clears its unread count', (await p.locator('#chat-count').isHidden()) || (await p.textContent('#chat-count')).trim() === '1', await p.textContent('#chat-count'));
  await p.click('.hero-btn'); await p.waitForTimeout(300);
  ok('new message suggests my supervisor, company and the COOP office', await p.locator('#contacts .contact').count() === 3, await p.locator('#contacts').innerText());
  await p.fill('#lookup', 'nobody@nowhere.sa'); await p.click('#lookup-form button[type=submit]'); await p.waitForTimeout(300);
  ok('unknown e-mail shows an error', /No E-COOP account/.test(await p.textContent('#lookup-error')));
  await p.fill('#lookup', 'coop.office@jic.edu.sa'); await p.click('#lookup-form button[type=submit]'); await p.waitForTimeout(900);
  ok('new conversation opens by e-mail', (await p.textContent('#thread-name')) === 'COOP Office' && await p.locator('.chat-row').count() === 4, await p.textContent('#thread-name'));
  await p.fill('#msg-input', 'Hello, when is the final report due?'); await p.press('#msg-input', 'Enter'); await p.waitForTimeout(800);
  await ctx.close();
  ({ ctx, p } = await open('ar'));
  await login(p, 'abdullah.alrumi@jic.edu.sa');
  await p.goto(BASE + '/supervisor/chat.html'); await p.waitForTimeout(700);
  const row = p.locator('.chat-row', { hasText: 'Ahmed Abdulmohsen Almousa' });
  ok('supervisor sees the student message as unread', /outline is ready/.test(await row.innerText()) && await row.locator('.chat-badge').count() === 1);
  await row.click(); await p.waitForTimeout(700);
  await p.fill('#msg-input', 'ممتاز، بانتظار الملف.'); await p.click('#composer button[type=submit]'); await p.waitForTimeout(800);
  ok('supervisor answers (Arabic page)', /بانتظار الملف/.test(await p.locator('#msgs .msg.mine').last().innerText()) && await p.evaluate(() => document.documentElement.dir === 'rtl'));
  await p.screenshot({ path: SHOTS + '/13_chat_ar.png' });
  await ctx.close();
  ({ ctx, p } = await open());
  await login(p, 'coop.office@jic.edu.sa');
  await p.goto(BASE + '/admin/chat.html'); await p.waitForTimeout(700);
  ok('admin receives the new conversation, not other people\'s chats', /final report due/.test(await p.textContent('#chat-list')) && !/college template/.test(await p.textContent('#chat-list')) && await p.locator('.chat-row').count() === 2);
  await ctx.close();
  ({ ctx, p } = await open());
  await p.setViewportSize({ width: 390, height: 844 });
  await login(p, 'ahmed.almousa@jic.edu.sa');
  await p.goto(BASE + '/student/chat.html'); await p.waitForTimeout(700);
  await p.locator('.chat-row').first().click(); await p.waitForTimeout(600);
  ok('chat on a phone: conversation replaces the list, no sideways scrolling', await p.isHidden('#chat-list') && await p.isVisible('.thread-back') && !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await p.screenshot({ path: SHOTS + '/14_chat_phone.png' });
  await ctx.close();

  // ---------- register
  ({ ctx, p } = await open());
  await p.goto(BASE + '/register.html'); await p.waitForTimeout(600);
  await p.fill('#r-name', 'Noura Test Student'); await p.fill('#r-email', 'noura@gmail.com'); await p.fill('#r-phone', '0551239876');
  await p.fill('#r-gpa', '3.6'); await p.fill('#r-pass', 'Passw0rd1'); await p.fill('#r-pass2', 'Passw0rd1'); await p.check('#r-agree');
  await p.click('#r-submit'); await p.waitForTimeout(500);
  ok('student e-mail must be @jic.edu.sa', /jic\.edu\.sa/.test(await p.textContent('#r-email-err')));
  await p.fill('#r-email', 'noura.test@jic.edu.sa'); await p.click('#r-submit'); await p.waitForTimeout(1500);
  ok('new student registers and lands on the dashboard', p.url().endsWith('/student/dashboard.html'));
  await ctx.close();

  // ---------- phone width
  ({ ctx, p } = await open());
  await p.setViewportSize({ width: 390, height: 844 });
  await login(p, 'ahmed.almousa@jic.edu.sa');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok('phone width: no sideways scrolling', !overflow);
  await p.screenshot({ path: SHOTS + '/09_phone.png' });
  await ctx.close();

  ok('no JavaScript errors on any page', errors.length === 0, errors.slice(0, 6).join('\n'));
  await browser.close();
  console.log(`\n${results.filter(Boolean).length} / ${results.length} passed`);
})();
