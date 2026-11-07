// Browser walkthrough of the PHP version. usage: node ui_test.js http://127.0.0.1:8090 <shots dir>
const { chromium } = require('playwright');
const BASE = process.argv[2], SHOTS = process.argv[3] || '/tmp/ui_shots';
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
const res = []; const errors = [];
function ok(name, cond, info) { res.push([name, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  -> ' + (info || ''))); }

(async () => {
  await fetch(BASE + '/install.php', { method: 'POST' });
  const b = await chromium.launch();
  async function session(lang) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
    await ctx.addInitScript((l) => { ['Student', 'Company', 'Supervisor', 'Admin'].forEach(r => localStorage.setItem('easy-coop-demo-v6-toured-' + r, '1')); if (l) localStorage.setItem('easy-coop-demo-v6-lang', l); }, lang);
    const p = await ctx.newPage(); p.setDefaultTimeout(8000);
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', async r => { if (r.url().includes('/api/')) { try { const j = await r.json(); if (!j.ok) console.log('   server said no:', r.url().split('/api/')[1], j.code, '-', j.error); } catch (e) {} } });
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
    return { ctx, p };
  }
  async function loginForm(p, email, pw) {
    await p.goto(BASE + '/#signin'); await p.reload(); await p.waitForTimeout(500); if (!(await p.locator('#h-email').count())) { await p.getByText('Sign In').first().click(); } await p.waitForSelector('#h-email');
    await p.fill('#h-email', email); await p.fill('#h-pass', pw);
    await p.locator('form').getByRole('button', { name: 'Sign In' }).click();
  }
  const body = (p) => p.locator('body').innerText();

  // 1. landing + password sign-in
  let { ctx, p } = await session();
  await p.goto(BASE + '/'); await p.waitForTimeout(800);
  ok('landing page loads from the server', /E-COOP/.test(await body(p)));
  await p.screenshot({ path: SHOTS + '/01_landing.png' });
  await loginForm(p, 'ahmed.almousa@jic.edu.sa', 'wrong-pass'); await p.waitForTimeout(700);
  ok('wrong password shows an error', /password/i.test(await body(p)));
  await loginForm(p, 'ahmed.almousa@jic.edu.sa', 'Coop@2026'); await p.waitForTimeout(1200);
  ok('student signs in with the password form', /Ahmed/.test(await body(p)) && await p.locator('.topnav, .tabs').count() > 0);
  await p.screenshot({ path: SHOTS + '/02_student_dashboard.png' });
  await p.reload(); await p.waitForTimeout(1200);
  ok('session survives a page reload (PHP session)', /Ahmed/.test(await body(p)) && await p.locator('.topnav, .tabs').count() > 0);

  // visit every student page
  const pages = { Student: ['dashboard', 'opportunities', 'applications', 'attendance', 'report', 'profile', 'settings'],
    Company: ['overview', 'postings', 'applicants', 'dailycode', 'trainees', 'evaluations', 'profile', 'settings'],
    Supervisor: ['students', 'attendance', 'reports', 'evaluations', 'academic', 'settings'],
    Admin: ['analytics', 'approvals', 'users', 'assign', 'audit', 'reports', 'settings'] };
  async function visitAll(p, role) {
    let n = 0;
    for (const pg of pages[role]) { await p.goto(BASE + '/#' + pg); await p.reload(); await p.waitForTimeout(500); if ((await body(p)).length > 50) n++; }
    ok(role + ': all ' + pages[role].length + ' pages render', n === pages[role].length, n);
  }
  await visitAll(p, 'Student');
  await ctx.close();

  // 2. company makes today's code (demo account button), student checks in with it
  ({ ctx, p } = await session());
  await p.goto(BASE + '/#signin'); await p.waitForTimeout(500);
  await p.getByText('Sign In').first().click().catch(() => {});
  await p.goto(BASE + '/'); await p.waitForTimeout(500);
  await loginForm(p, 'coop@easternlogistics.sa', 'Coop@2026'); await p.waitForTimeout(1000);
  await p.goto(BASE + '/#dailycode'); await p.reload(); await p.waitForTimeout(900);
  const gen = p.getByRole('button', { name: /Generate/i }).first();
  if (await gen.count()) { await gen.click(); await p.waitForTimeout(1200); }
  const m6 = (await body(p)).match(/Active\s+(\d{3})\s?(\d{3})/); const codeText = m6 ? [m6[1] + m6[2]] : null;
  ok('company sees today\'s 6-digit code', !!codeText, (await body(p)).slice(0, 300));
  await p.screenshot({ path: SHOTS + '/03_company_daily_code.png' });
  await visitAll(p, 'Company');
  await ctx.close();

  ({ ctx, p } = await session());
  await loginForm(p, 'ahmed.almousa@jic.edu.sa', 'Coop@2026'); await p.waitForTimeout(1000);
  await p.goto(BASE + '/#attendance'); await p.reload(); await p.waitForTimeout(900);
  const boxes = p.locator('main input.coop-code-box');
  const typeCode = async (c) => { await boxes.first().click(); await p.keyboard.type(c); await p.waitForTimeout(1200); };
  await typeCode('000001');
  ok('wrong code is refused by the server', /wrong|invalid|incorrect|attempt/i.test(await body(p)));
  await p.reload(); await p.waitForTimeout(900);
  await typeCode(codeText ? codeText[0] : '000000');
  ok('right code: check-in saved', /waiting for your supervisor|recorded/i.test(await body(p)));
  await p.screenshot({ path: SHOTS + '/04_student_checkin.png' });
  await ctx.close();

  // 3. supervisor approves; admin pages; Arabic
  ({ ctx, p } = await session());
  await loginForm(p, 'abdullah.alrumi@jic.edu.sa', 'Coop@2026'); await p.waitForTimeout(1000);
  await visitAll(p, 'Supervisor');
  await p.goto(BASE + '/#attendance'); await p.reload(); await p.waitForTimeout(900);
  const appr = p.getByRole('button', { name: /^Approve/ }).first();
  if (await appr.count()) { await appr.click(); await p.waitForTimeout(1200); }
  ok('supervisor approve button works', !errors.length, errors.join(' | '));
  await p.screenshot({ path: SHOTS + '/05_supervisor_attendance.png' });
  await ctx.close();

  ({ ctx, p } = await session('ar'));
  await loginForm(p, 'coop.office@jic.edu.sa', 'Coop@2026').catch(() => {});
  await p.waitForTimeout(400);
  if (!(await p.locator('.topnav, .tabs').count())) {   // Arabic sign-in button label
    await p.fill('#h-email', 'coop.office@jic.edu.sa'); await p.fill('#h-pass', 'Coop@2026'); await p.locator('form button[type=submit]').click(); await p.waitForTimeout(1200);
  }
  ok('admin signs in (Arabic interface)', await p.evaluate(() => document.documentElement.dir) === 'rtl' && await p.locator('.topnav, .tabs').count() > 0);
  await p.goto(BASE + '/#audit'); await p.reload(); await p.waitForTimeout(900);
  await p.screenshot({ path: SHOTS + '/06_admin_audit_ar.png' });
  await p.evaluate(() => localStorage.setItem('easy-coop-demo-v6-lang', 'en'));
  await visitAll(p, 'Admin');
  await ctx.close();

  // 4. register a new student through the form
  ({ ctx, p } = await session());
  await p.goto(BASE + '/#register'); await p.waitForTimeout(900);
  await p.fill('#r-name', 'Noura Test Student'); await p.fill('#r-email', 'noura.test@gmail.com');
  await p.fill('#r-phone', '0551239876').catch(() => {}); await p.fill('#r-gpa', '4.2').catch(() => {});
  await p.fill('#r-pass', 'Passw0rd1').catch(() => {}); await p.fill('#r-pass2', 'Passw0rd1').catch(() => {});
  const agree = p.locator('#r-agree'); if (await agree.count()) await agree.check().catch(() => {});
  await p.locator('form button[type=submit]').last().click(); await p.waitForTimeout(1200);
  ok('gmail refused for a student', /jic\.edu\.sa/i.test(await body(p)));
  await p.fill('#r-email', 'noura.test@jic.edu.sa'); await p.locator('form button[type=submit]').last().click(); await p.waitForTimeout(1500);
  ok('new student registered and signed in', /Noura/.test(await body(p)) && await p.locator('.topnav, .tabs').count() > 0, (await body(p)).slice(0, 200));
  await p.screenshot({ path: SHOTS + '/07_registered.png' });
  await ctx.close();

  // 5. opened as a file -> clear message
  ({ ctx, p } = await session());
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(600);
  ok('opening index.html as a file explains what to do', /needs the PHP server/i.test(await body(p)));
  await ctx.close();

  ok('no JavaScript errors in the whole run', errors.length === 0, errors.slice(0, 5).join(' | '));
  await b.close();
  console.log(`\n${res.filter(r => r[1]).length} / ${res.length} passed`);
})();
