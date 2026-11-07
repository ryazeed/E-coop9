<?php
/*
 * GET api/file.php?key=r12      -> the final report file (student owner, their supervisor, the placement company, admin)
 * GET api/file.php?avatar=5     -> a profile photo (any signed-in user)
 * Files live in /storage, which the web server never serves directly.
 */
require __DIR__ . '/lib/bootstrap.php';
handle(function () {
    $u = require_user();
    if (isset($_GET['avatar'])) {
        $p = val('SELECT avatar_path FROM users WHERE user_id = ?', [(int)$_GET['avatar']]);
        $path = $p ? ECOOP_ROOT . '/storage/' . $p : null;
        if (!$path || !is_file($path)) fail('No photo.', 'not_found', 404);
        header('Content-Type: ' . (mime_content_type($path) ?: 'image/jpeg'));
        header('Cache-Control: private, max-age=86400');
        readfile($path);
        exit;
    }
    $rid = nid($_GET['key'] ?? '');
    $r = one('SELECT f.*, s.user_id AS suser, s.supervisor_id AS ssup, o.company_id FROM final_reports f
              JOIN students s ON s.student_id = f.student_id JOIN training_placements p ON p.placement_id = f.placement_id
              JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id WHERE f.report_id = ?', [$rid]);
    if (!$r) fail('Report not found.', 'not_found', 404);
    $allowed = $u['role'] === 'Admin' || (int)$r['suser'] === (int)$u['user_id']
        || ($u['supervisor_id'] && (int)$r['ssup'] === (int)$u['supervisor_id'])
        || ($u['company_id'] && (int)$r['company_id'] === (int)$u['company_id']);
    if (!$allowed) fail('You cannot open this report.', 'forbidden', 403);
    $path = ECOOP_ROOT . '/storage/' . $r['file_path'];
    if (!is_file($path)) fail('The file is missing from storage.', 'not_found', 404);
    $type = $r['file_type'] === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    header('Content-Type: ' . $type);
    header('Content-Length: ' . filesize($path));
    header('Content-Disposition: inline; filename="' . str_replace('"', '', $r['original_file_name']) . '"');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
});
