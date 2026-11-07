<?php
/*
 * E-COOP database settings.
 * XAMPP default: user "root" with an empty password on port 3306.
 * If you set a MySQL password in XAMPP, put it in 'pass'.
 */
return [
    'db_host' => getenv('ECOOP_DB_HOST') ?: '127.0.0.1',
    'db_port' => (int)(getenv('ECOOP_DB_PORT') ?: 3306),
    'db_name' => getenv('ECOOP_DB_NAME') ?: 'ecoop',
    'db_user' => getenv('ECOOP_DB_USER') ?: 'root',
    'db_pass' => getenv('ECOOP_DB_PASS') !== false ? getenv('ECOOP_DB_PASS') : '',

    'timezone'      => 'Asia/Riyadh',
    'demo_password' => 'Coop@2026',   // password of every demo account (used by the quick demo buttons)
    'max_upload'    => 10 * 1024 * 1024,
];
