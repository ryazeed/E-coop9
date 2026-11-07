<?php
/* POST api/action.php  { "type": "apply", ... }  -> runs one action, returns the fresh state */
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/actions.php';
handle(function () {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Use POST.', 'method', 405);
    run_action(body());
    json_out(boot_payload());
});
