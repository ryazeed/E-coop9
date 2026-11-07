<?php
/*
 * Router for PHP's built-in server (used from VS Code):   php -S localhost:8000 router.php
 * Serves the site and the API, and blocks the private folders (Apache uses the .htaccess files instead).
 */
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('#^/(storage|database|api/lib|build|\.git|\.vscode)(/|$)#i', $path) || preg_match('#^/api/config\.php$#i', $path)) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}
if ($path === '/' || $path === '') { require __DIR__ . '/index.html'; return true; }
return false;   // let the built-in server handle the file (static file or .php script)
