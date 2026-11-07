<?php
/* GET api/state.php -> { ok, today, me, state }  (the data the interface shows) */
require __DIR__ . '/lib/bootstrap.php';
handle(function () {
    json_out(boot_payload());
});
