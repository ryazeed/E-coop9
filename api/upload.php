<?php
/*
 * POST api/upload.php  (multipart: file, key)  -> keeps the final report in private storage until the
 * "submitReport" action saves it. PDF or DOCX only, max 10 MB (BR-17), checked by extension AND file content.
 */
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/actions.php';
handle(function () {
    $u = require_user('Student');
    $key = (string)($_POST['key'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{6,64}$/', $key)) fail('Bad upload key.', 'validation');
    $f = $_FILES['file'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) fail('The file did not upload (error ' . ($f['error'] ?? '-') . '). Max size is 10 MB.', 'upload');
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['pdf', 'docx'], true)) fail('Only PDF or DOCX files are allowed.', 'validation');
    if ($f['size'] < 1 || $f['size'] > $GLOBALS['CFG']['max_upload']) fail('The file must be 10 MB or smaller.', 'validation');
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 4);
    if (($ext === 'pdf' && $head !== '%PDF') || ($ext === 'docx' && substr($head, 0, 2) !== 'PK')) fail('The file content is not a real ' . strtoupper($ext) . '.', 'validation');
    $base = staged_dir() . 'u' . $u['user_id'] . '_' . $key;
    if (!move_uploaded_file($f['tmp_name'], $base . '.' . $ext)) fail('Could not store the file.', 'server', 500);
    file_put_contents($base . '.json', json_encode(['name' => basename($f['name']), 'ext' => $ext, 'size' => (int)$f['size']]));
    json_out(['ok' => true, 'key' => $key]);
});
