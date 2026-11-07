<?php
/*
 * POST api/auth.php
 *   { "op": "login",    "email": "...", "password": "..." }
 *   { "op": "logout" }
 *   { "op": "register", "kind": "Student|Supervisor|Company", "name", "email", "password", "phone", "major", "gpa", "city", "dept" }
 * Passwords are stored with password_hash() (bcrypt) and checked with password_verify() (NFR-SE-01).
 * 5 wrong passwords lock the account for 15 minutes (NFR-SE-05). Every sign-in is written to the audit log.
 */
require __DIR__ . '/lib/bootstrap.php';

handle(function () {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Use POST.', 'method', 405);
    $b = body();
    start_session();
    switch ($b['op'] ?? '') {
        case 'login':    login($b); break;
        case 'logout':   $uid = $_SESSION['uid'] ?? null; $_SESSION = []; session_regenerate_id(true);
                         if ($uid) audit((int)$uid, 'Signed out', 'USER', (int)$uid);
                         break;
        case 'register': register($b); break;
        default: fail('Unknown operation.', 'bad_op');
    }
    json_out(boot_payload());
});

function login(array $b): void {
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $pass = (string)($b['password'] ?? '');
    if ($email === '' || $pass === '') fail('Enter your e-mail and password.', 'validation');
    $u = one('SELECT * FROM users WHERE LOWER(email) = ?', [$email]);
    if (!$u) { audit(null, 'LOGIN_FAILED unknown e-mail ' . mb_substr($email, 0, 80), 'USER', null); fail('No account uses this e-mail.', 'no_user'); }
    $uid = (int)$u['user_id'];
    if ($u['lockout_until'] && strtotime($u['lockout_until']) > time()) {
        fail('Too many wrong passwords. Try again after ' . substr($u['lockout_until'], 11, 5) . '.', 'locked');
    }
    if (!password_verify($pass, $u['password_hash'])) {
        $n = (int)$u['failed_login_count'] + 1;
        if ($n >= 5) q('UPDATE users SET failed_login_count = 0, lockout_until = NOW() + INTERVAL 15 MINUTE WHERE user_id = ?', [$uid]);
        else q('UPDATE users SET failed_login_count = ? WHERE user_id = ?', [$n, $uid]);
        audit($uid, 'LOGIN_FAILED wrong password', 'USER', $uid);
        fail($n >= 5 ? 'Too many wrong passwords: the account is locked for 15 minutes.' : 'Wrong password.', $n >= 5 ? 'locked' : 'wrong_password');
    }
    if ($u['account_status'] !== 'Active') fail('This account is suspended. Contact the COOP office.', 'suspended');
    q('UPDATE users SET failed_login_count = 0, lockout_until = NULL, last_login_at = NOW() WHERE user_id = ?', [$uid]);
    if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET password_hash = ? WHERE user_id = ?', [password_hash($pass, PASSWORD_DEFAULT), $uid]);
    session_regenerate_id(true);
    $_SESSION['uid'] = $uid;
    audit($uid, 'Signed in', 'USER', $uid);
}

function register(array $b): void {
    $kind = (string)($b['kind'] ?? '');
    if (!in_array($kind, ['Student', 'Supervisor', 'Company'], true)) fail('Choose Student, Supervisor or Company.', 'validation');
    $name = trim((string)($b['name'] ?? ''));
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $pass = (string)($b['password'] ?? '');
    $phone = preg_replace('/\s/', '', (string)($b['phone'] ?? ''));
    if (mb_strlen($name) < 3 || mb_strlen($name) > 150) fail('Enter the full name (3-150 characters).', 'validation');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid e-mail.', 'validation');
    if ($kind !== 'Company' && !str_ends_with($email, '@jic.edu.sa')) fail('Students and supervisors must use their @jic.edu.sa college e-mail.', 'email_domain');   // FR-01
    if (strlen($pass) < 8 || !preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) fail('The password needs 8+ characters with letters and numbers.', 'validation');
    if ($phone !== '' && !preg_match('/^0\d{8,9}$/', $phone)) fail('Phone must start with 0 and have 9 or 10 digits.', 'validation');
    if (val('SELECT 1 FROM users WHERE LOWER(email) = ?', [$email])) fail('An account with this e-mail already exists.', 'email_taken');

    db()->beginTransaction();
    q('INSERT INTO users (full_name, email, password_hash, phone, role, privacy_accepted_at) VALUES (?,?,?,?,?,NOW())',
        [$name, $email, password_hash($pass, PASSWORD_DEFAULT), $phone ?: null, db_role($kind)]);
    $uid = (int)db()->lastInsertId();
    if ($kind === 'Student') {
        $major = val('SELECT major_id FROM majors WHERE major_name = ?', [(string)($b['major'] ?? '')]);
        if (!$major) fail('Choose your major.', 'validation');
        $gpa = $b['gpa'] ?? '';
        if ($gpa !== '' && (!is_numeric($gpa) || $gpa < 0 || $gpa > 5)) fail('GPA must be between 0 and 5.', 'validation');
        $uni = 'REG' . str_pad((string)$uid, 6, '0', STR_PAD_LEFT);       // the college ID is confirmed later by the COOP office
        q("INSERT INTO students (user_id, university_id, major_id, gpa) VALUES (?,?,?,?)", [$uid, $uni, $major, $gpa === '' ? null : $gpa]);
        $adminKey = 'nNewStudent';
    } elseif ($kind === 'Supervisor') {
        q('INSERT INTO academic_supervisors (user_id, department) VALUES (?, ?)', [$uid, trim((string)($b['dept'] ?? '')) ?: null]);
        $adminKey = 'nNewSupervisor';
    } else {
        $city = trim((string)($b['city'] ?? ''));
        if ($city === '') fail('Choose the company city.', 'validation');
        q('INSERT INTO companies (user_id, company_name, city) VALUES (?,?,?)', [$uid, $name, $city]);   // waits for admin approval (UC-19)
        $adminKey = 'nCompanyPending';
    }
    notify($uid, 'nWelcome');
    notify_admins($adminKey, ['n' => $name, 'dp' => (string)($b['dept'] ?? ''), 'e' => $email], $uid);
    audit($uid, 'Created ' . strtolower($kind) . ' account ' . $name, 'USER', $uid);
    db()->commit();
    session_regenerate_id(true);
    $_SESSION['uid'] = $uid;
}
