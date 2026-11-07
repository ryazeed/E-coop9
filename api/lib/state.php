<?php
/*
 * Builds the data the interface works with, in the same shape as the front end's demo data
 * (users, students, companies, opps, apps, placements, codes, attendance, reports, evals, audit, notifs, prefs).
 * Database ids get the interface prefixes: user 12 -> 'u12', student 3 -> 's3', ...
 * Private data is never sent: no password hashes, and students never receive daily codes.
 */
declare(strict_types=1);

function d10($v): ?string { return $v === null ? null : substr((string)$v, 0, 10); }
function ts16($v): ?string { return $v === null ? null : str_replace(' ', 'T', substr((string)$v, 0, 16)); }
function pre(string $p, $v): ?string { return $v === null ? null : $p . $v; }

function build_state(PDO $db, ?array $me): array {
    // daily codes close at midnight (the MySQL event does this too when the event scheduler is on)
    q('UPDATE daily_codes SET is_active = FALSE WHERE is_active = TRUE AND code_date < CURDATE()');
    $today = val('SELECT CURDATE()');
    $role = $me['role'] ?? null;

    $s = ['users' => [], 'students' => [], 'companies' => [], 'opps' => [], 'apps' => [], 'placements' => [], 'codes' => [],
          'attendance' => [], 'reports' => [], 'evals' => [], 'audit' => [], 'notifs' => [], 'prefs' => new stdClass(), 'seq' => 100000];

    foreach (all("SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.account_status, u.avatar_path, u.updated_at,
                         s.student_id, c.company_id, sp.supervisor_id, sp.department, a.admin_id
                  FROM users u
                  LEFT JOIN students s ON s.user_id = u.user_id LEFT JOIN companies c ON c.user_id = u.user_id
                  LEFT JOIN academic_supervisors sp ON sp.user_id = u.user_id LEFT JOIN admins a ON a.user_id = u.user_id
                  ORDER BY u.user_id") as $r) {
        $ref = $r['student_id'] ? 's' . $r['student_id'] : ($r['company_id'] ? 'c' . $r['company_id'] : ($r['supervisor_id'] ? 'sup' . $r['supervisor_id'] : 'a' . $r['admin_id']));
        $u = ['id' => 'u' . $r['user_id'], 'name' => $r['full_name'], 'email' => $r['email'], 'role' => ui_role($r['role']),
              'status' => $r['account_status'], 'ref' => $ref, 'phone' => $r['phone']];
        if ($r['department']) $u['dept'] = $r['department'];
        if ($r['avatar_path']) $u['avatar'] = 'api/file.php?avatar=' . $r['user_id'] . '&v=' . strtotime((string)$r['updated_at']);
        $s['users'][] = $u;
    }

    foreach (all('SELECT s.*, m.major_name, u.phone FROM students s JOIN majors m ON m.major_id = s.major_id JOIN users u ON u.user_id = s.user_id ORDER BY s.student_id') as $r) {
        $s['students'][] = ['id' => 's' . $r['student_id'], 'user' => 'u' . $r['user_id'], 'major' => $r['major_name'],
            'gpa' => $r['gpa'] === null ? '' : number_format((float)$r['gpa'], 2, '.', ''), 'phone' => $r['phone'] ?? '',
            'cv' => $r['cv_file_path'] ? basename($r['cv_file_path']) : '', 'universityId' => $r['university_id'],
            'supervisor' => pre('sup', $r['supervisor_id']), 'placement' => pre('p', $r['placement_id'])];
    }

    foreach (all('SELECT * FROM companies ORDER BY company_id') as $r) {
        $s['companies'][] = ['id' => 'c' . $r['company_id'], 'user' => 'u' . $r['user_id'], 'name' => $r['company_name'],
            'city' => $r['city'], 'status' => $r['approval_status'], 'cr' => $r['cr_number']];
    }

    $oppStatus = ['Approved' => 'Open', 'Pending Approval' => 'Pending Approval', 'Rejected' => 'Rejected', 'Closed' => 'Closed'];
    foreach (all("SELECT o.*, (SELECT GROUP_CONCAT(m.major_name ORDER BY m.major_id SEPARATOR ', ')
                               FROM opportunity_majors om JOIN majors m ON m.major_id = om.major_id WHERE om.opportunity_id = o.opportunity_id) AS majors
                  FROM coop_opportunities o ORDER BY o.opportunity_id DESC") as $r) {
        $s['opps'][] = ['id' => 'o' . $r['opportunity_id'], 'company' => 'c' . $r['company_id'], 'title' => $r['title'], 'city' => $r['city'],
            'majors' => $r['majors'] ?? '', 'capacity' => (int)$r['capacity'], 'status' => $oppStatus[$r['status']],
            'posted' => d10($r['posted_at']), 'description' => $r['description']];
    }

    $appStatus = ['Pending' => 'Submitted', 'Accepted' => 'Accepted', 'Rejected' => 'Rejected', 'Withdrawn' => 'Withdrawn'];
    foreach (all('SELECT * FROM applications ORDER BY application_id DESC') as $r) {
        $s['apps'][] = ['id' => 'a' . $r['application_id'], 'student' => 's' . $r['student_id'], 'opp' => 'o' . $r['opportunity_id'],
            'status' => $appStatus[$r['status']], 'date' => d10($r['submitted_at'])];
    }

    foreach (all('SELECT * FROM training_placements ORDER BY placement_id') as $r) {
        $s['placements'][] = ['id' => 'p' . $r['placement_id'], 'opp' => 'o' . $r['opportunity_id'], 'start' => $r['start_date'],
            'end' => $r['end_date'], 'status' => $r['status'], 'due' => $r['report_due_date']];
    }

    // daily codes: a company sees its own placements' codes, the admin sees all, students and supervisors see none
    if ($role === 'Company' || $role === 'Admin') {
        $sql = 'SELECT k.* FROM daily_codes k';
        $args = [];
        if ($role === 'Company') {
            $sql .= ' JOIN training_placements p ON p.placement_id = k.placement_id JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id WHERE o.company_id = ?';
            $args[] = $me['company_id'];
        }
        foreach (all($sql . ' ORDER BY k.daily_code_id', $args) as $r) {
            $active = $r['is_active'] && $r['code_date'] === $today;
            $s['codes'][] = ['id' => 'k' . $r['daily_code_id'], 'placement' => 'p' . $r['placement_id'], 'code' => $r['code'],
                'date' => $r['code_date'], 'status' => $active ? 'Active' : 'Expired'];
        }
    }

    foreach (all('SELECT a.*, k.placement_id FROM attendance_records a JOIN daily_codes k ON k.daily_code_id = a.daily_code_id ORDER BY a.check_in_time, a.attendance_id') as $r) {
        $s['attendance'][] = ['id' => 't' . $r['attendance_id'], 'student' => 's' . $r['student_id'], 'placement' => 'p' . $r['placement_id'],
            'date' => d10($r['check_in_time']), 'time' => substr((string)$r['check_in_time'], 11, 5), 'status' => $r['approval_status'],
            'comment' => $r['review_comment']];
    }

    foreach (all('SELECT * FROM final_reports ORDER BY report_id') as $r) {
        $s['reports'][] = ['id' => 'r' . $r['report_id'], 'student' => 's' . $r['student_id'], 'file' => $r['original_file_name'],
            'fileKey' => 'r' . $r['report_id'], 'date' => d10($r['submitted_at']), 'status' => $r['review_status'], 'comments' => $r['review_comments']];
    }

    foreach (all('SELECT e.*, c.user_id AS company_user, sp.user_id AS sup_user
                  FROM evaluations e JOIN training_placements p ON p.placement_id = e.placement_id
                  JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id JOIN companies c ON c.company_id = o.company_id
                  LEFT JOIN academic_supervisors sp ON sp.supervisor_id = e.supervisor_id
                  ORDER BY e.evaluation_id DESC') as $r) {
        $company = $r['evaluator_type'] === 'Company';
        $s['evals'][] = ['id' => 'e' . $r['evaluation_id'], 'student' => 's' . $r['student_id'], 'type' => $company ? 'Company' : 'Academic',
            'by' => 'u' . ($company ? $r['company_user'] : $r['sup_user']), 'score' => (int)$r['score'], 'comments' => $r['comments'],
            'date' => d10($r['evaluated_at'])];
    }

    // audit log: the admin reads it; the codes written by the stored procedures get a readable sentence
    if ($role === 'Admin') {
        foreach (all('SELECT * FROM audit_logs ORDER BY created_at DESC, log_id DESC LIMIT 500') as $r) {
            $s['audit'][] = ['id' => 'l' . $r['log_id'], 'user' => pre('u', $r['user_id']), 'action' => audit_text($r), 'ts' => ts16($r['created_at'])];
        }
    }

    // notifications: only your own
    if ($me) {
        foreach (all('SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC, notification_id DESC LIMIT 200', [$me['user_id']]) as $r) {
            [$key, $args] = notif_key_args($r);
            $s['notifs'][] = ['id' => 'n' . $r['notification_id'], 'user' => 'u' . $r['user_id'], 'key' => $key, 'args' => (object)$args,
                'ts' => ts16($r['sent_at']), 'read' => (bool)$r['is_read']];
        }
        $prefs = [];
        foreach (all('SELECT pref_key, is_enabled FROM notification_preferences WHERE user_id = ?', [$me['user_id']]) as $r) {
            $prefs['u' . $me['user_id'] . ':' . $r['pref_key']] = (bool)$r['is_enabled'];
        }
        $s['prefs'] = (object)$prefs;
    }
    return $s;
}

/* notifications written by the stored procedures use upper-case types; map them to interface keys */
function notif_key_args(array $r): array {
    $type = $r['notification_type'];
    if (preg_match('/^n[A-Z]/', $type)) return [$type, json_decode((string)$r['message'], true) ?: []];
    if ($type === 'APP_ACCEPTED' && $r['entity_id']) {
        $title = val('SELECT o.title FROM applications a JOIN coop_opportunities o ON o.opportunity_id = a.opportunity_id WHERE a.application_id = ?', [$r['entity_id']]);
        return ['nAppAccepted', ['o' => $title]];
    }
    return ['nRaw', ['m' => $r['message']]];
}

function audit_text(array $r): string {
    switch ($r['action']) {
        case 'APPLICATION_ACCEPTED':
            $x = one('SELECT u.full_name, o.title FROM applications a JOIN students s ON s.student_id = a.student_id JOIN users u ON u.user_id = s.user_id
                      JOIN coop_opportunities o ON o.opportunity_id = a.opportunity_id WHERE a.application_id = ?', [$r['entity_id']]);
            return $x ? 'Accepted application from ' . $x['full_name'] . ' for ' . $x['title'] : 'Accepted an application';
        case 'DAILY_CODE_GENERATED':
            $t = val('SELECT o.title FROM training_placements p JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id WHERE p.placement_id = ?', [$r['entity_id']]);
            return 'Generated daily code for ' . ($t ?: 'a placement');
        default:
            return $r['action'];
    }
}

/* everything one response needs */
function boot_payload(): array {
    $me = current_user();
    return ['ok' => true, 'today' => val('SELECT CURDATE()'), 'me' => $me ? 'u' . $me['user_id'] : null, 'state' => build_state(db(), $me)];
}
