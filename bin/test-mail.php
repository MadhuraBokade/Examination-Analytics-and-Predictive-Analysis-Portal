<?php
/**
 * EPAP - SMTP Test Command
 * Usage: php bin/test-mail.php you@example.com
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Forbidden: CLI only.');
}

require_once dirname(__DIR__) . '/app/bootstrap.php';

use App\Core\Env;
use App\Core\Mailer;

$to = trim((string) ($argv[1] ?? ''));
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php bin/test-mail.php <recipient@example.com>\n");
    exit(1);
}

echo "Testing SMTP configuration from .env...\n";
echo "  SMTP_HOST       : " . (Env::get('SMTP_HOST', '') ?: '(not set)') . "\n";
echo "  SMTP_PORT       : " . Env::get('SMTP_PORT', '587') . "\n";
echo "  SMTP_SECURE     : " . Env::get('SMTP_SECURE', Env::get('SMTP_ENCRYPTION', 'tls')) . "\n";
echo "  SMTP_USER       : " . (Env::get('SMTP_USER', '') ?: '(not set)') . "\n";
echo "  SMTP_FROM_EMAIL : " . (Env::get('SMTP_FROM_EMAIL', Env::get('MAIL_FROM_ADDRESS', '')) ?: '(not set)') . "\n";
echo "  Recipient       : {$to}\n\n";

if (Mailer::sendTestEmail($to)) {
    echo "[SUCCESS] Test email sent successfully to {$to}.\n";
    exit(0);
}

$err = Mailer::getLastError() ?? 'Unknown SMTP failure.';
fwrite(STDERR, "[FAILED] Could not send test email.\nReason: {$err}\n");
exit(1);
