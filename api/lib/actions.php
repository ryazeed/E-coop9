<?php
/*
 * Every change the interface can make, one function per action type.
 * The server never trusts ids like "by" from the browser: the signed-in user comes from the session,
 * and each function checks that the user owns the record (role-based access, D3 §3.4.2).
 * Business rules are checked here AND by the database (triggers, CHECK, UNIQUE, stored procedures).
 */
declare(strict_types=1);

const ACTIONS = ['apply', 'appDecision', 'postOpp', 'oppDecision', 'companyDecision', 'genCode', 'checkIn', 'attDecision',
    'submitReport', 'reportDecision', 'submitEval', 'userStatus', 'assign', 'profile', 'readNotifs', 'pref', 'contact',
    'companyProfile', 'logExport', 'avatar', 'newChat', 'sendMsg', 'readChat'];

function run_action(array $a): void {
    $type = (string)($a['type'] ?? '');
    if (!in_array($type, ACTIONS, true)) fail('Unknown action: ' . $type, 'bad_action');
    $fn = 'act_' . $type;
    $fn($a);
}

function tx(callable $fn) {
    db()->beginTransaction();
    try { $r = $fn(); db()->commit(); return $r; }
    catch (Throwable $e) { if (db()->inTransaction()) db()->rollBack(); throw $e; }
}

function student_row(int $sid): array {
    $r = one('SELECT s.*, u.full_name, u.user_id AS uid FROM students s JOIN users u ON u.user_id = s.user_id WHERE s.student_id = ?', [$sid]);
    if (!$r) fail('Student not found.', 'not_found', 404);
    return $r;
}
function sup_user(?int $supId): ?int { return $supId ? (int)val('SELECT user_id FROM academic_supervisors WHERE supervisor_id = ?', [$supId]) : null; }
function company_of_placement(int $pid): ?int {
    $c = val('SELECT o.company_id FROM training_placements p JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id WHERE p.placement_id = ?', [$pid]);
    return $c === null ? null : (int)$c;
}
function text_in(array $a, string $k, int $max, bool $required = true): string {
    $v = trim((string)($a[$k] ?? ''));
    if ($required && $v === '') fail('The field "' . $k . '" is required.', 'validation');
    if (mb_strlen($v) > $max) fail('The field "' . $k . '" is too long (max ' . $max . ').', 'validation');
    return $v;
}

/* ================================================================ STUDENT */
function act_apply(array $a): void {                                   // UC-03
    $u = require_user('Student');
    $oid = nid($a['opp'] ?? '');
    $o = one('SELECT o.*, c.user_id AS cuser FROM coop_opportunities o JOIN companies c ON c.company_id = o.company_id WHERE o.opportunity_id = ?', [$oid]);
    if (!$o) fail('Opportunity not found.', 'not_found', 404);
    if (val('SELECT 1 FROM applications WHERE student_id = ? AND opportunity_id = ?', [$u['student_id'], $oid])) fail('You already applied to this opportunity.', 'duplicate');
    if ($o['min_gpa'] !== null) {                                      // minimum GPA set by the company
        $gpa = val('SELECT gpa FROM students WHERE student_id = ?', [$u['student_id']]);
        if ($gpa === null) fail('Add your GPA in Settings before applying to this opportunity.', 'gpa_missing');
        if ((float)$gpa < (float)$o['min_gpa']) fail('Your GPA (' . number_format((float)$gpa, 2) . ') is below the minimum GPA for this opportunity (' . number_format((float)$o['min_gpa'], 2) . ').', 'gpa_low');
    }
    tx(function () use ($u, $o, $oid) {
        q('INSERT INTO applications (student_id, opportunity_id) VALUES (?, ?)', [$u['student_id'], $oid]);   // trigger: approved opp, no placement
        $appId = (int)db()->lastInsertId();
        notify((int)$o['cuser'], 'nNewApp', ['n' => $u['full_name'], 'o' => $o['title']], 'APPLICATION', $appId);
        audit((int)$u['user_id'], 'Applied to ' . $o['title'], 'APPLICATION', $appId);
    });
}

function act_checkIn(array $a): void {                                 // UC-04, BR-14, BR-15, BR-16
    $u = require_user('Student');
    $st = student_row((int)$u['student_id']);
    $code = preg_replace('/\D/', '', (string)($a['code'] ?? ''));
    if ($st['code_lockout_until'] && strtotime($st['code_lockout_until']) > time()) {
        fail('Too many wrong codes. Try again after ' . substr($st['code_lockout_until'], 11, 5) . '.', 'code_locked');
    }
    if (!$st['placement_id']) fail('You do not have an active training placement.', 'code_none');
    if (strlen($code) !== 6) fail('Enter the 6-digit code.', 'code_invalid');
    if (val('SELECT 1 FROM attendance_records WHERE student_id = ? AND DATE(check_in_time) = CURDATE()', [$st['student_id']])) {
        fail('You already checked in today.', 'code_duplicate');
    }
    $active = one('SELECT * FROM daily_codes WHERE placement_id = ? AND code_date = CURDATE() AND is_active = TRUE', [$st['placement_id']]);
    $match = one('SELECT * FROM daily_codes WHERE placement_id = ? AND code = ? ORDER BY code_date DESC LIMIT 1', [$st['placement_id'], $code]);
    if (!$active || (int)$active['daily_code_id'] !== (int)($match['daily_code_id'] ?? 0)) {
        if ($match && !$active) fail('That code has expired.', 'code_expired');
        if (!$active) fail('Your company has not generated today\'s code yet.', 'code_none');
        // wrong code: 5 wrong attempts block check-in for 10 minutes (D3 §3.4.2.2)
        $n = (int)$st['failed_code_attempts'] + 1;
        if ($n >= 5) {
            q('UPDATE students SET failed_code_attempts = 0, code_lockout_until = NOW() + INTERVAL 10 MINUTE WHERE student_id = ?', [$st['student_id']]);
            audit((int)$u['user_id'], 'Check-in blocked for 10 minutes after 5 wrong codes', 'STUDENT', (int)$st['student_id']);
            fail('5 wrong codes: check-in is blocked for 10 minutes.', 'code_locked');
        }
        q('UPDATE students SET failed_code_attempts = ? WHERE student_id = ?', [$n, $st['student_id']]);
        fail($match ? 'That code has expired.' : 'Wrong code (' . (5 - $n) . ' attempts left).', $match ? 'code_expired' : 'code_invalid');
    }
    tx(function () use ($st, $active, $u) {
        q('INSERT INTO attendance_records (student_id, daily_code_id, check_in_time) VALUES (?, ?, NOW())', [$st['student_id'], $active['daily_code_id']]);
        q('UPDATE students SET failed_code_attempts = 0, code_lockout_until = NULL WHERE student_id = ?', [$st['student_id']]);
        notify(sup_user($st['supervisor_id'] ? (int)$st['supervisor_id'] : null), 'nCheckIn', ['n' => $u['full_name']], 'ATTENDANCE', (int)db()->lastInsertId());
    });
}

function act_submitReport(array $a): void {                            // UC-05, BR-17, BR-18
    $u = require_user('Student');
    $st = student_row((int)$u['student_id']);
    if (!$st['placement_id']) fail('You need an active placement before submitting the final report.', 'no_placement');
    $staged = take_staged_upload((int)$u['user_id'], (string)($a['fileKey'] ?? ''));
    $old = one('SELECT * FROM final_reports WHERE student_id = ?', [$st['student_id']]);
    if ($old && $old['review_status'] === 'Approved') { @unlink($staged['path']); fail('Your final report is already approved.', 'rule'); }
    $name = 'reports/' . bin2hex(random_bytes(12)) . '.' . $staged['ext'];
    if (!rename($staged['path'], ECOOP_ROOT . '/storage/' . $name)) fail('Could not save the file.', 'server', 500);
    tx(function () use ($st, $old, $name, $staged, $u) {
        $args = [$st['placement_id'], $st['supervisor_id'], $name, $staged['name'], strtoupper($staged['ext']), $staged['size']];
        if ($old) {
            q("UPDATE final_reports SET placement_id = ?, supervisor_id = ?, file_path = ?, original_file_name = ?, file_type = ?, file_size_bytes = ?,
                  submitted_at = NOW(), review_status = 'Submitted', review_comments = NULL, reviewed_at = NULL WHERE report_id = ?", array_merge($args, [$old['report_id']]));
            $rid = (int)$old['report_id'];
            @unlink(ECOOP_ROOT . '/storage/' . $old['file_path']);
        } else {
            q('INSERT INTO final_reports (student_id, placement_id, supervisor_id, file_path, original_file_name, file_type, file_size_bytes) VALUES (?,?,?,?,?,?,?)',
                array_merge([$st['student_id']], $args));
            $rid = (int)db()->lastInsertId();
        }
        notify(sup_user($st['supervisor_id'] ? (int)$st['supervisor_id'] : null), 'nReportIn', ['n' => $u['full_name']], 'FINAL_REPORT', $rid);
        audit((int)$u['user_id'], 'Submitted final report ' . $staged['name'], 'FINAL_REPORT', $rid);
    });
}

function act_profile(array $a): void {                                 // student profile
    $u = require_user('Student');
    $f = $a['fields'] ?? []; $uf = $a['userFields'] ?? [];
    $phone = preg_replace('/\s/', '', (string)($f['phone'] ?? ''));
    if ($phone !== '' && !preg_match('/^0\d{8,9}$/', $phone)) fail('Phone must look like 05XXXXXXXX.', 'validation');
    $gpa = $f['gpa'] ?? null;
    if ($gpa !== null && $gpa !== '' && (!is_numeric($gpa) || $gpa < 0 || $gpa > 5)) fail('GPA must be between 0 and 5.', 'validation');
    $cv = trim((string)($f['cv'] ?? ''));
    $cvPath = $cv !== '' && preg_match('/\.(pdf|docx)$/i', $cv) ? 'cv/' . basename($cv) : null;
    $name = text_in($uf, 'name', 150);
    tx(function () use ($u, $phone, $gpa, $cvPath, $name) {
        q('UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', [$name, $phone ?: null, $u['user_id']]);
        q('UPDATE students SET gpa = ?, cv_file_path = ?, cv_uploaded_at = IF(? IS NULL, NULL, COALESCE(cv_uploaded_at, NOW())) WHERE student_id = ?',
            [$gpa === '' ? null : $gpa, $cvPath, $cvPath, $u['student_id']]);
        audit((int)$u['user_id'], 'Updated student profile', 'STUDENT', (int)$u['student_id']);
    });
}

/* ================================================================ COMPANY */
function act_postOpp(array $a): void {                                 // UC-08
    $u = require_user('Company');
    $o = $a['opp'] ?? [];
    $title = text_in($o, 'title', 150); $city = text_in($o, 'city', 80); $desc = text_in($o, 'description', 4000);
    $cap = (int)($o['capacity'] ?? 0);
    if ($cap < 1 || $cap > 100) fail('Capacity must be between 1 and 100.', 'validation');
    $minGpa = trim((string)($o['minGpa'] ?? ''));                      // optional: empty = no minimum
    if ($minGpa !== '' && (!is_numeric($minGpa) || $minGpa < 0 || $minGpa > 5)) fail('Minimum GPA must be between 0 and 5.', 'validation');
    $minGpa = $minGpa === '' ? null : round((float)$minGpa, 2);
    $majors = is_array($o['majors'] ?? null) ? $o['majors'] : array_filter(array_map('trim', explode(',', (string)($o['majors'] ?? ''))));
    if (!$majors) fail('Choose at least one major.', 'validation');
    $ids = [];
    foreach ($majors as $m) {
        $id = val('SELECT major_id FROM majors WHERE major_name = ?', [$m]);
        if (!$id) fail('Unknown major: ' . $m, 'validation');
        $ids[] = (int)$id;
    }
    tx(function () use ($u, $title, $city, $desc, $cap, $minGpa, $ids) {
        q('INSERT INTO coop_opportunities (company_id, title, description, city, capacity, min_gpa) VALUES (?,?,?,?,?,?)', [$u['company_id'], $title, $desc, $city, $cap, $minGpa]);
        $oid = (int)db()->lastInsertId();
        foreach (array_unique($ids) as $mid) q('INSERT INTO opportunity_majors (opportunity_id, major_id) VALUES (?, ?)', [$oid, $mid]);
        notify_admins('nOppNew', ['o' => $title]);
        audit((int)$u['user_id'], 'Posted opportunity ' . $title, 'COOP_OPPORTUNITY', $oid);
    });
}

function act_appDecision(array $a): void {                             // UC-10
    $u = require_user('Company');
    $appId = nid($a['id'] ?? '');
    $ap = one('SELECT a.*, o.title, o.company_id, s.user_id AS suser, us.full_name AS sname FROM applications a
               JOIN coop_opportunities o ON o.opportunity_id = a.opportunity_id JOIN students s ON s.student_id = a.student_id
               JOIN users us ON us.user_id = s.user_id WHERE a.application_id = ?', [$appId]);
    if (!$ap || (int)$ap['company_id'] !== (int)$u['company_id']) fail('This application is not for your company.', 'forbidden', 403);
    if ($ap['status'] !== 'Pending') fail('This application was already decided.', 'rule');
    if (($a['status'] ?? '') === 'Accepted') {
        $start = new DateTime('today');
        do { $start->modify('+1 day'); } while ((int)$start->format('w') !== 0);      // next Sunday
        $end = (clone $start)->modify('+15 weeks +4 days');                          // Thursday, 16 weeks later
        // stored procedure: capacity check with row lock, create/link placement, withdraw other applications, notify, audit
        q('CALL sp_accept_application(?, ?, ?)', [$appId, $start->format('Y-m-d'), $end->format('Y-m-d')]);
    } else {
        $reason = trim((string)($a['reason'] ?? '')) ?: null;
        tx(function () use ($appId, $reason, $ap, $u) {
            q("UPDATE applications SET status = 'Rejected', decided_at = NOW(), rejection_reason = ? WHERE application_id = ?", [$reason, $appId]);
            notify((int)$ap['suser'], 'nAppRejected', ['o' => $ap['title']], 'APPLICATION', $appId);
            audit((int)$u['user_id'], 'Rejected application from ' . $ap['sname'] . ' for ' . $ap['title'], 'APPLICATION', $appId);
        });
    }
}

function act_genCode(array $a): void {                                 // UC-11, BR-13
    $u = require_user('Company');
    $pid = nid($a['placement'] ?? '');
    if (company_of_placement($pid) !== (int)$u['company_id']) fail('This placement is not yours.', 'forbidden', 403);
    $new = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);           // CSPRNG
    q('CALL sp_get_or_create_daily_code(?, ?, ?, @code)', [$pid, $u['company_id'], $new]);
}

function act_submitEval(array $a): void {                              // UC-12 (company) / UC-16 (academic)
    $u = require_user('Company', 'Academic Supervisor');
    $st = student_row(nid($a['student'] ?? ''));
    $score = (int)($a['score'] ?? -1);
    if ($score < 0 || $score > 100) fail('Score must be between 0 and 100.', 'validation');
    $comments = text_in($a, 'comments', 4000);
    if (!$st['placement_id']) fail('This student has no placement.', 'rule');
    if ($u['role'] === 'Company') {
        if (company_of_placement((int)$st['placement_id']) !== (int)$u['company_id']) fail('This student is not your trainee.', 'forbidden', 403);
        $type = 'Company'; $sup = null;
    } else {
        if ((int)$st['supervisor_id'] !== (int)$u['supervisor_id']) fail('This student is not assigned to you.', 'forbidden', 403);
        $type = 'Academic Supervisor'; $sup = (int)$u['supervisor_id'];
    }
    if (val('SELECT 1 FROM evaluations WHERE student_id = ? AND placement_id = ? AND evaluator_type = ?', [$st['student_id'], $st['placement_id'], $type])) {
        fail('This student already has a ' . strtolower($type) . ' evaluation.', 'duplicate');      // BR-19
    }
    tx(function () use ($st, $type, $sup, $score, $comments, $u) {
        q('INSERT INTO evaluations (student_id, placement_id, evaluator_type, supervisor_id, score, comments) VALUES (?,?,?,?,?,?)',
            [$st['student_id'], $st['placement_id'], $type, $sup, $score, $comments]);
        $eid = (int)db()->lastInsertId();
        notify((int)$st['uid'], 'nEvalIn', ['x' => $type === 'Company' ? 'company' : 'academic', 's' => $score], 'EVALUATION', $eid);
        audit((int)$u['user_id'], 'Submitted ' . strtolower($type) . ' evaluation for ' . $st['full_name'], 'EVALUATION', $eid);
    });
}

function act_companyProfile(array $a): void {                          // UC-07
    $u = require_user('Company');
    $name = text_in($a, 'name', 150); $city = text_in($a, 'city', 80);
    $phone = preg_replace('/\s/', '', (string)($a['phone'] ?? ''));
    if ($phone !== '' && !preg_match('/^0\d{8,9}$/', $phone)) fail('Phone must start with 0 and have 9 or 10 digits.', 'validation');
    tx(function () use ($u, $name, $city, $phone) {
        q('UPDATE companies SET company_name = ?, city = ? WHERE company_id = ?', [$name, $city, $u['company_id']]);
        q('UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', [$name, $phone ?: null, $u['user_id']]);
        audit((int)$u['user_id'], 'Updated company profile ' . $name, 'COMPANY', (int)$u['company_id']);
    });
}

/* ================================================================ SUPERVISOR */
function act_attDecision(array $a): void {                             // UC-14
    $u = require_user('Academic Supervisor');
    $status = ($a['status'] ?? '') === 'Approved' ? 'Approved' : 'Rejected';
    $ids = array_map('nid', (array)($a['ids'] ?? []));
    if (!$ids) fail('Choose at least one record.', 'validation');
    $comment = trim((string)($a['comment'] ?? '')) ?: ($status === 'Rejected' ? 'Rejected by the academic supervisor.' : null);
    tx(function () use ($ids, $status, $comment, $u) {
        foreach ($ids as $id) {
            $r = one('SELECT a.*, s.supervisor_id, s.user_id AS suser FROM attendance_records a JOIN students s ON s.student_id = a.student_id WHERE a.attendance_id = ? FOR UPDATE', [$id]);
            if (!$r || (int)$r['supervisor_id'] !== (int)$u['supervisor_id']) fail('Record ' . $id . ' is not for one of your students.', 'forbidden', 403);
            if ($r['approval_status'] !== 'Pending') continue;
            q('UPDATE attendance_records SET approval_status = ?, reviewed_by = ?, reviewed_at = NOW(), review_comment = ? WHERE attendance_id = ?',
                [$status, $u['supervisor_id'], $comment, $id]);
            notify((int)$r['suser'], $status === 'Approved' ? 'nAttApproved' : 'nAttRejected', ['d' => substr($r['check_in_time'], 0, 10)], 'ATTENDANCE', $id);
        }
        audit((int)$u['user_id'], $status . ' ' . count($ids) . ' attendance record(s)', 'ATTENDANCE', null);
    });
}

function act_reportDecision(array $a): void {                          // UC-15
    $u = require_user('Academic Supervisor');
    $rid = nid($a['id'] ?? '');
    $r = one('SELECT f.*, s.supervisor_id AS ssup, s.user_id AS suser, us.full_name AS sname FROM final_reports f JOIN students s ON s.student_id = f.student_id
              JOIN users us ON us.user_id = s.user_id WHERE f.report_id = ?', [$rid]);
    if (!$r || (int)$r['ssup'] !== (int)$u['supervisor_id']) fail('This report is not from one of your students.', 'forbidden', 403);
    $status = ($a['status'] ?? '') === 'Approved' ? 'Approved' : 'Request Revision';
    $comment = trim((string)($a['comment'] ?? '')) ?: ($status === 'Request Revision' ? 'Please revise the report and submit it again.' : null);
    tx(function () use ($rid, $status, $comment, $u, $r) {
        q('UPDATE final_reports SET review_status = ?, supervisor_id = ?, review_comments = ?, reviewed_at = NOW() WHERE report_id = ?', [$status, $u['supervisor_id'], $comment, $rid]);
        notify((int)$r['suser'], $status === 'Approved' ? 'nReportApproved' : 'nReportRevision', [], 'FINAL_REPORT', $rid);
        audit((int)$u['user_id'], $status . ' final report of ' . $r['sname'], 'FINAL_REPORT', $rid);
    });
}

/* ================================================================ ADMIN */
function act_oppDecision(array $a): void {                             // UC-20
    $u = require_user('Admin');
    $oid = nid($a['id'] ?? '');
    $o = one('SELECT o.*, c.user_id AS cuser FROM coop_opportunities o JOIN companies c ON c.company_id = o.company_id WHERE o.opportunity_id = ?', [$oid]);
    if (!$o) fail('Opportunity not found.', 'not_found', 404);
    $ok = ($a['status'] ?? '') === 'Open';
    tx(function () use ($ok, $oid, $o, $u, $a) {
        if ($ok) q("UPDATE coop_opportunities SET status = 'Approved', approved_by_admin_id = ?, approved_at = NOW() WHERE opportunity_id = ?", [$u['admin_id'], $oid]);
        else q("UPDATE coop_opportunities SET status = 'Rejected', rejection_reason = ? WHERE opportunity_id = ?", [trim((string)($a['reason'] ?? '')) ?: 'Rejected by the COOP office.', $oid]);
        notify((int)$o['cuser'], $ok ? 'nOppApproved' : 'nOppRejected', ['o' => $o['title']], 'COOP_OPPORTUNITY', $oid);
        audit((int)$u['user_id'], ($ok ? 'Approved' : 'Rejected') . ' opportunity ' . $o['title'], 'COOP_OPPORTUNITY', $oid);
    });
}

function act_companyDecision(array $a): void {                         // UC-19
    $u = require_user('Admin');
    $cid = nid($a['id'] ?? '');
    $c = one('SELECT * FROM companies WHERE company_id = ?', [$cid]);
    if (!$c) fail('Company not found.', 'not_found', 404);
    $ok = ($a['status'] ?? '') === 'Approved';
    tx(function () use ($ok, $cid, $c, $u, $a) {
        if ($ok) q("UPDATE companies SET approval_status = 'Approved', approved_by_admin_id = ?, approved_at = NOW(), rejection_reason = NULL WHERE company_id = ?", [$u['admin_id'], $cid]);
        else q("UPDATE companies SET approval_status = 'Rejected', rejection_reason = ? WHERE company_id = ?", [trim((string)($a['reason'] ?? '')) ?: 'Rejected by the COOP office.', $cid]);
        audit((int)$u['user_id'], ($ok ? 'Approved' : 'Rejected') . ' company ' . $c['company_name'], 'COMPANY', $cid);
    });
}

function act_userStatus(array $a): void {                              // UC-18, BR-02
    $u = require_user('Admin');
    $uid = nid($a['id'] ?? '');
    if ($uid === (int)$u['user_id']) fail('You cannot suspend your own account.', 'rule');
    $t = one('SELECT * FROM users WHERE user_id = ?', [$uid]);
    if (!$t) fail('User not found.', 'not_found', 404);
    $status = ($a['status'] ?? '') === 'Suspended' ? 'Suspended' : 'Active';
    tx(function () use ($uid, $status, $t, $u) {
        q('UPDATE users SET account_status = ? WHERE user_id = ?', [$status, $uid]);
        audit((int)$u['user_id'], ($status === 'Suspended' ? 'Suspended' : 'Activated') . ' account ' . $t['full_name'], 'USER', $uid);
    });
}

function act_assign(array $a): void {                                  // UC-21, BR-12
    $u = require_user('Admin');
    $st = student_row(nid($a['student'] ?? ''));
    $supId = nid($a['supervisor'] ?? '');
    $sup = one('SELECT sp.*, us.full_name FROM academic_supervisors sp JOIN users us ON us.user_id = sp.user_id WHERE sp.supervisor_id = ?', [$supId]);
    if (!$sup) fail('Supervisor not found.', 'not_found', 404);
    tx(function () use ($st, $sup, $supId, $u) {
        q('UPDATE students SET supervisor_id = ?, supervisor_assigned_at = NOW() WHERE student_id = ?', [$supId, $st['student_id']]);
        notify((int)$st['uid'], 'nSupervisor', ['n' => $sup['full_name']], 'STUDENT', (int)$st['student_id']);
        audit((int)$u['user_id'], 'Assigned ' . $sup['full_name'] . ' to ' . $st['full_name'], 'STUDENT', (int)$st['student_id']);
    });
}

/* ================================================================ EVERYONE */
function act_readNotifs(array $a): void {
    $u = require_user();
    q('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE', [$u['user_id']]);
}

function act_pref(array $a): void {                                    // FR-26
    $u = require_user();
    $key = (string)($a['key'] ?? '');
    if (!in_array($key, ['attendance', 'applications', 'reports', 'summary'], true)) fail('Unknown setting.', 'validation');
    q('INSERT INTO notification_preferences (user_id, pref_key, is_enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [$u['user_id'], $key, !empty($a['value']) ? 1 : 0]);
}

function act_logExport(array $a): void {                               // FR-21
    $u = require_user();
    audit((int)$u['user_id'], 'Exported ' . mb_substr((string)($a['report'] ?? 'a'), 0, 50) . ' report (' . mb_substr((string)($a['format'] ?? ''), 0, 10) . ')', 'REPORT', null);
}

function act_avatar(array $a): void {
    $u = require_user();
    $dir = ECOOP_ROOT . '/storage/avatars/';
    foreach (glob($dir . 'u' . $u['user_id'] . '.*') ?: [] as $f) @unlink($f);
    $photo = (string)($a['photo'] ?? '');
    if ($photo === '') { q('UPDATE users SET avatar_path = NULL WHERE user_id = ?', [$u['user_id']]); return; }
    if (!preg_match('#^data:image/(png|jpeg|webp);base64,(.+)$#', $photo, $m)) fail('The photo must be a PNG, JPEG or WebP image.', 'validation');
    $bin = base64_decode($m[2], true);
    if ($bin === false || strlen($bin) > 2 * 1024 * 1024 || !@getimagesizefromstring($bin)) fail('The photo is not a valid image (max 2 MB).', 'validation');
    $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
    file_put_contents($dir . 'u' . $u['user_id'] . '.' . $ext, $bin);
    q('UPDATE users SET avatar_path = ? WHERE user_id = ?', ['avatars/u' . $u['user_id'] . '.' . $ext, $u['user_id']]);
}

function act_contact(array $a): void {                                 // landing page "Contact us" (no sign-in needed)
    $m = $a['msg'] ?? [];
    $name = text_in($m, 'name', 150); $email = text_in($m, 'email', 190); $msg = text_in($m, 'msg', 3000);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid e-mail.', 'validation');
    $topicKey = (string)($m['topicKey'] ?? 'general');
    $topic = ['general' => 'General', 'partner' => 'Company', 'problem' => 'Technical', 'feedback' => 'General'][$topicKey] ?? 'General';
    tx(function () use ($name, $email, $topic, $msg, $m) {
        q('INSERT INTO contact_messages (full_name, email, topic, message) VALUES (?,?,?,?)', [$name, $email, $topic, $msg]);
        notify_admins('nContact', ['n' => $name, 'e' => $email, 'x' => (string)($m['topic'] ?? $topic),
            'm' => mb_strlen($msg) > 120 ? mb_substr($msg, 0, 117) . '…' : $msg]);
    });
}

/* ================================================================ CHAT (all roles) */
function my_conversation(array $u, $chatId): int {                     // the conversation id, only if I am a member
    $cid = nid($chatId);
    if (!val('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?', [$cid, $u['user_id']])) {
        fail('You are not a member of this conversation.', 'forbidden', 403);
    }
    return $cid;
}

function act_newChat(array $a): void {                                 // open a direct conversation with another user
    $u = require_user();
    $other = nid($a['user'] ?? '');
    if ($other === (int)$u['user_id']) fail('You cannot message yourself.', 'validation');
    $t = one('SELECT user_id, account_status FROM users WHERE user_id = ?', [$other]);
    if (!$t) fail('User not found.', 'not_found', 404);
    if ($t['account_status'] !== 'Active') fail('This account is suspended and cannot receive messages.', 'rule');
    $exists = val("SELECT c.conversation_id FROM conversations c
                   JOIN conversation_members a ON a.conversation_id = c.conversation_id AND a.user_id = ?
                   JOIN conversation_members b ON b.conversation_id = c.conversation_id AND b.user_id = ?
                   WHERE c.kind = 'Direct' LIMIT 1", [$u['user_id'], $other]);
    if ($exists) return;                                               // one direct conversation per pair
    tx(function () use ($u, $other) {
        q("INSERT INTO conversations (kind, created_by) VALUES ('Direct', ?)", [$u['user_id']]);
        $cid = (int)db()->lastInsertId();
        q('INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES (?, ?, NOW()), (?, ?, NULL)', [$cid, $u['user_id'], $cid, $other]);
    });
}

function act_sendMsg(array $a): void {
    $u = require_user();
    $cid = my_conversation($u, $a['chat'] ?? '');
    $text = trim((string)($a['text'] ?? ''));
    if ($text === '') fail('Write a message first.', 'validation');
    if (mb_strlen($text) > 1000) fail('Messages can be up to 1,000 characters.', 'validation');
    tx(function () use ($u, $cid, $text) {
        q('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)', [$cid, $u['user_id'], $text]);
        q('UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?', [$cid, $u['user_id']]);
    });
}

function act_readChat(array $a): void {                                // mark a conversation as read
    $u = require_user();
    $cid = my_conversation($u, $a['chat'] ?? '');
    q('UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?', [$cid, $u['user_id']]);
}

/* ================================================================ uploads (shared with upload.php / file.php) */
function staged_dir(): string { return ECOOP_ROOT . '/storage/uploads/'; }

function take_staged_upload(int $uid, string $key): array {
    if (!preg_match('/^[A-Za-z0-9_-]{6,64}$/', $key)) fail('Upload the file first.', 'validation');
    $meta = staged_dir() . 'u' . $uid . '_' . $key . '.json';
    if (!is_file($meta)) fail('The uploaded file was not found. Choose the file again.', 'validation');
    $info = json_decode((string)file_get_contents($meta), true);
    @unlink($meta);
    $info['path'] = staged_dir() . 'u' . $uid . '_' . $key . '.' . $info['ext'];
    if (!is_file($info['path'])) fail('The uploaded file was not found. Choose the file again.', 'validation');
    return $info;
}
