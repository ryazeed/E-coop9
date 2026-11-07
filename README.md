# E-COOP — Cooperative Training Management System

**MIS 451 Capstone · Jubail Industrial College · Team E-COOP**

A complete web system for managing cooperative training (COOP): students apply to opportunities, companies accept trainees and generate a daily 6-digit attendance code, academic supervisors approve attendance and review final reports, and the COOP office (admin) approves companies and opportunities, manages users and reads the audit log.

| Layer | Technology |
|---|---|
| Front end | HTML, CSS, JavaScript (React 18, included locally in `js/vendor`) |
| Back end | PHP 8 (PDO, sessions, `password_hash`) — REST-style JSON API in `api/` |
| Database | MySQL / MariaDB — 19 tables, 30 foreign keys, CHECK rules, 12 triggers, 2 stored procedures, 4 views |

---

## طريقة التشغيل (بالعربي)

### المطلوب
- **XAMPP** (فيه Apache و PHP 8 و MySQL/MariaDB و phpMyAdmin) من https://www.apachefriends.org
- **Visual Studio Code**

### الطريقة الأولى: XAMPP (الأسهل)
1. افتح **XAMPP Control Panel**، واضغط **Start** عند **Apache** و **MySQL**.
2. انسخ فولدر المشروع إلى `C:\xampp\htdocs\` وسمّه `E-COOP-PHP`.
   - أو من الـ Terminal: `cd C:\xampp\htdocs` ثم `git clone https://github.com/ryazeed/E-coop9.git E-COOP-PHP`
3. افتح في المتصفح: **http://localhost/E-COOP-PHP/install.php** واضغط **Install / reset the database**.
4. اضغط **Open E-COOP**، أو افتح **http://localhost/E-COOP-PHP/**

### الطريقة الثانية: من داخل VS Code
1. شغّل **MySQL** بس من XAMPP Control Panel.
2. افتح فولدر المشروع في VS Code (**File ← Open Folder**).
3. من القائمة: **Terminal ← Run Task… ← Start E-COOP (PHP server on port 8000)**.
   أو اكتب في الـ Terminal:
   ```
   C:\xampp\php\php.exe -S localhost:8000 router.php
   ```
4. افتح **http://localhost:8000/install.php** (أول مرة بس)، وبعدها **http://localhost:8000**

> لا تفتح `index.html` بالضغط عليه مرتين: الموقع يحتاج سيرفر PHP و MySQL، ولو فتحته كملف بتطلع لك رسالة توضح الخطوات.

### طريقة ثالثة لإنشاء قاعدة البيانات (phpMyAdmin)
افتح http://localhost/phpmyadmin ← تبويب **Import** ← اختر `database/ecoop.sql` ← **Import**.

### الحسابات التجريبية
كلمة المرور لكل الحسابات: **`Coop@2026`**. وفي صفحة "الحسابات التجريبية" فيه أزرار تدخلك مباشرة.

| الدور | الإيميل |
|---|---|
| طالب | `ahmed.almousa@jic.edu.sa` |
| طالب بدون تدريب | `yazeed.alqahtani@jic.edu.sa` |
| شركة | `coop@easternlogistics.sa` |
| مشرف أكاديمي | `abdullah.alrumi@jic.edu.sa` |
| أدمن (مكتب التعاون) | `coop.office@jic.edu.sa` |

### سيناريو العرض على الدكتور (تقريباً 5 دقائق)
1. **الشركة** `coop@easternlogistics.sa` ← **Daily Code** ← يطلع كود اليوم (6 أرقام).
2. **الطالب** `ahmed.almousa@jic.edu.sa` ← **Attendance** ← دخّل كود غلط: الرفض يجي من السيرفر. بعدها دخّل الكود الصحيح: ينحفظ الحضور في MySQL بحالة Pending.
3. **المشرف** `abdullah.alrumi@jic.edu.sa` ← **Attendance** ← **Approve**.
4. **الأدمن** `coop.office@jic.edu.sa` ← **Audit Log**: كل اللي صار مسجّل باسم صاحبه ووقته.
5. افتح **phpMyAdmin** وورّه الجداول: `attendance_records` و `daily_codes` و `audit_logs`، وتبويب **Triggers** و **Routines**.
6. سجّل حساب طالب جديد بإيميل gmail: يرفضه، لأن لازم `@jic.edu.sa`.

لو تبي ترجع الديمو من البداية: افتح `install.php` مرة ثانية.

### مشاكل ممكن تواجهك
| المشكلة | الحل |
|---|---|
| "Cannot connect to the database" | شغّل MySQL في XAMPP، وافتح `install.php` |
| MySQL ما يشتغل (port 3306 busy) | سكّر أي MySQL ثاني شغّال، أو غيّر `db_port` في `api/config.php` |
| حطيت كلمة مرور لـ root | اكتبها في `db_pass` داخل `api/config.php` |
| `php` غير معروف في VS Code | استخدم المسار الكامل `C:\xampp\php\php.exe` |
| الصفحة فاضية | افتح الموقع من `http://localhost/...` مو من الملف، وسوِّ تحديث بـ Ctrl+F5 |

---

## Project structure

```
E-COOP-PHP/
├── index.html              the web page (loads the CSS and JavaScript files)
├── install.php             one-click database setup / demo reset
├── router.php              router for "php -S" (blocks private folders)
├── css/style.css           all styles
├── js/
│   ├── api.js              talks to the PHP API (fetch), server-side file storage
│   ├── vendor/             React 18 (local copy)
│   ├── ui-kit.js           shared UI components (buttons, badges, code input)
│   ├── i18n.js             English + Arabic text
│   ├── data.js, services.js, landing.js, logo.js
│   └── app/                core.js, student.js, company.js, supervisor.js, admin.js, reports.js, shell.js …
├── api/
│   ├── config.php          database settings (XAMPP: root, empty password)
│   ├── state.php           GET  – the signed-in user + the data for the screens
│   ├── auth.php            POST – login / logout / register
│   ├── action.php          POST – every change (apply, accept, check-in, approve …)
│   ├── upload.php          POST – final report upload (PDF/DOCX, 10 MB)
│   ├── file.php            GET  – open a report / profile photo (with permission check)
│   └── lib/                bootstrap.php (PDO, sessions, errors), state.php, actions.php
├── database/ecoop.sql      schema + rules + demo data (one file)
├── storage/                uploaded files (not public)
├── docs/ERD.png, ERD.pdf   the numbered ERD
└── tests/                  api_test.py (86 API checks), ui_test.js (browser walkthrough)
```

### How a request works
1. The page loads `api/state.php` → PHP reads MySQL and returns the data for the signed-in user.
2. A button (e.g. **Approve**) sends `{ "type": "attDecision", ... }` to `api/action.php`.
3. PHP checks the session role and ownership, runs the SQL with prepared statements (PDO), MySQL checks its own rules (CHECK / UNIQUE / triggers), and PHP returns the fresh data.

### Where the business rules live
| Rule | PHP | MySQL |
|---|---|---|
| FR-01 college e-mail | `auth.php` register | trigger `trg_student_email_domain` |
| NFR-SE-01 hashed passwords | `password_hash` / `password_verify` | `users.password_hash` |
| NFR-SE-05 5 wrong passwords → 15 min lock | `auth.php` login | `users.failed_login_count`, `lockout_until` |
| BR-05 company approved before posting | – | trigger `trg_opp_company_approved` |
| BR-07 apply only to approved opportunities | – | trigger `trg_app_eligibility` |
| BR-08 one application per opportunity | `act_apply` | `UNIQUE (student_id, opportunity_id)` |
| UC-10 accept: capacity, placement, withdraw others | `act_appDecision` | procedure `sp_accept_application` |
| BR-13 one 6-digit code per placement per day | `random_int` (CSPRNG) | procedure `sp_get_or_create_daily_code`, `UNIQUE (placement_id, code_date)` |
| BR-14/15 valid code of your own placement | `act_checkIn` | trigger `trg_att_validate` |
| BR-16 one check-in per day | `act_checkIn` | `UNIQUE (student_id, daily_code_id)` |
| 5 wrong codes → 10 min block | `act_checkIn` | `students.failed_code_attempts`, `code_lockout_until` |
| Students never see the codes | `build_state` | – |
| BR-17 PDF/DOCX ≤ 10 MB | `upload.php` (extension + file content) | `CHECK file_size_bytes` |
| BR-18 one final report per student | `act_submitReport` | `UNIQUE (student_id)` |
| BR-19 one company + one academic evaluation | `act_submitEval` | `UNIQUE (student_id, placement_id, evaluator_type)` |
| UC-16 academic evaluation after completion | – | trigger `trg_eval_academic_precondition` |
| BR-04 audit log cannot be edited | `audit()` on every action | triggers `trg_audit_no_update`, `trg_audit_no_delete` |

### Tests
With the server running on port 8000:
```
python tests/api_test.py http://localhost:8000     # 86 checks: every action, permissions and database rules
node tests/ui_test.js http://localhost:8000         # browser walkthrough (needs: npm i playwright)
```
The tests reset the demo database first.
