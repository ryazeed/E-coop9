<?php
/*
 * E-COOP one-click installer: creates (or resets) the "ecoop" database from database/ecoop.sql.
 * Open http://localhost/E-COOP-PHP/install.php (XAMPP) or http://localhost:8000/install.php (VS Code).
 * The same file can also be imported by hand in phpMyAdmin.
 */
declare(strict_types=1);
$cfg = require __DIR__ . '/api/config.php';
$msg = null; $ok = false; $steps = 0;

function run_sql_file(PDO $pdo, string $file, int &$count): void {
    $delim = ';'; $buf = '';
    foreach (preg_split('/\r?\n/', (string)file_get_contents($file)) as $line) {
        $t = trim($line);
        if ($buf === '' && ($t === '' || str_starts_with($t, '--'))) continue;
        if (preg_match('/^DELIMITER\s+(\S+)/i', $t, $m)) { $delim = $m[1]; continue; }
        $buf .= $line . "\n";
        if (str_ends_with($t, $delim)) {
            $sql = substr(rtrim($buf), 0, -strlen($delim));
            if (trim($sql) !== '') { $pdo->exec($sql); $count++; }
            $buf = '';
        }
    }
    if (trim($buf) !== '') { $pdo->exec($buf); $count++; }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = new PDO("mysql:host={$cfg['db_host']};port={$cfg['db_port']};charset=utf8mb4", $cfg['db_user'], $cfg['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        run_sql_file($pdo, __DIR__ . '/database/ecoop.sql', $steps);
        try { $pdo->exec('SET GLOBAL event_scheduler = ON'); } catch (Throwable $e) { /* optional: PHP also closes old codes */ }
        // remove files uploaded during earlier demos (the two sample reports stay)
        foreach (array_merge(glob(__DIR__ . '/storage/uploads/*') ?: [], glob(__DIR__ . '/storage/avatars/*.*') ?: []) as $f) if (is_file($f)) @unlink($f);
        foreach (glob(__DIR__ . '/storage/reports/*') ?: [] as $f) if (is_file($f) && !str_starts_with(basename($f), 'demo_')) @unlink($f);
        $ok = true;
        $msg = "Done: the database \"{$cfg['db_name']}\" was created with the demo data ($steps SQL statements).";
    } catch (Throwable $e) {
        $msg = 'Error: ' . $e->getMessage();
    }
}
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>E-COOP Installer</title>
<style>
  :root { --brand: #1B365D; --ok: #15803D; --bad: #B91C1C; --line: #E2E8F0; --ink: #0F172A; --muted: #475569; --bg: #F8FAFC; --card: #fff; }
  @media (prefers-color-scheme: dark) { :root { --ink: #E5E7EB; --muted: #9CA3AF; --bg: #0F172A; --card: #111827; --line: #1F2937; } }
  body { margin: 0; font-family: system-ui, "Segoe UI", Tahoma, sans-serif; background: var(--bg); color: var(--ink); }
  main { max-width: 640px; margin: 48px auto; padding: 0 16px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 28px; }
  h1 { margin: 0 0 6px; font-size: 26px; color: var(--brand); } @media (prefers-color-scheme: dark) { h1 { color: #93C5FD; } }
  p { color: var(--muted); line-height: 1.6; }
  button, .btn { display: inline-block; background: var(--brand); color: #fff; border: 0; border-radius: 10px; padding: 12px 20px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
  .msg { padding: 12px 14px; border-radius: 10px; margin: 16px 0; font-weight: 600; }
  .ok { background: #DCFCE7; color: var(--ok); } .bad { background: #FEE2E2; color: var(--bad); }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; } td { padding: 6px 4px; border-bottom: 1px solid var(--line); }
  code { background: rgba(100,116,139,.15); padding: 1px 6px; border-radius: 5px; }
  [dir=rtl] { text-align: right; }
</style></head>
<body><main><div class="card">
  <h1>E-COOP Installer</h1>
  <p>This creates the MySQL database <code><?= htmlspecialchars($cfg['db_name']) ?></code> on
     <code><?= htmlspecialchars($cfg['db_host'] . ':' . $cfg['db_port']) ?></code> as <code><?= htmlspecialchars($cfg['db_user']) ?></code>
     with all tables, rules and demo data. Running it again <b>resets</b> the demo.</p>
  <p dir="rtl">هذي الصفحة تنشئ قاعدة البيانات مع البيانات التجريبية. تشغيلها مرة ثانية يرجّع الديمو من البداية.</p>
  <?php if ($msg): ?><div class="msg <?= $ok ? 'ok' : 'bad' ?>"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
  <?php if ($ok): ?>
    <p><a class="btn" href="./">Open E-COOP →</a></p>
    <table>
      <tr><td>Student</td><td><code>ahmed.almousa@jic.edu.sa</code></td></tr>
      <tr><td>Company</td><td><code>coop@easternlogistics.sa</code></td></tr>
      <tr><td>Supervisor</td><td><code>abdullah.alrumi@jic.edu.sa</code></td></tr>
      <tr><td>Admin</td><td><code>coop.office@jic.edu.sa</code></td></tr>
      <tr><td>Password (all)</td><td><code><?= htmlspecialchars($cfg['demo_password']) ?></code></td></tr>
    </table>
  <?php else: ?>
    <form method="post"><button type="submit">Install / reset the database</button></form>
    <p>Start <b>MySQL</b> in the XAMPP Control Panel first.</p>
  <?php endif; ?>
</div></main></body></html>
