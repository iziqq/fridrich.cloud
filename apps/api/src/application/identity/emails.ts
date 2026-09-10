import type { EmailMessage } from '../../domain/identity/EmailSender.js';

/**
 * Texty odchozích e-mailů.
 *
 * Držené pohromadě, aby šlo jedním pohledem zkontrolovat, co uživateli chodí,
 * a aby se tón dal sjednotit bez prohledávání use-casů.
 */

function layout(title: string, body: string, action: { label: string; url: string }): string {
  return `<!doctype html>
<html lang="cs">
  <body style="margin:0;padding:24px;background:#050506;font-family:system-ui,sans-serif;color:#e8e8ea">
    <div style="max-width:520px;margin:0 auto;padding:24px;background:#0e0e11;border:1px solid #1f1f25">
      <p style="margin:0 0 16px;font-size:12px;letter-spacing:.12em;color:#00f0ff">// FRIDRICH.CLOUD</p>
      <h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase">${title}</h1>
      <p style="margin:0 0 24px;line-height:1.7;color:#8a8a93">${body}</p>
      <a href="${action.url}" style="display:inline-block;padding:12px 24px;background:#fcee0a;color:#050506;font-weight:700;text-decoration:none">${action.label}</a>
      <p style="margin:24px 0 0;font-size:12px;color:#8a8a93">
        Pokud tlačítko nefunguje, otevřete tento odkaz:<br />
        <span style="color:#00f0ff;word-break:break-all">${action.url}</span>
      </p>
    </div>
  </body>
</html>`;
}

export function verificationEmail(to: string, verifyUrl: string): EmailMessage {
  return {
    to,
    subject: 'Potvrďte svůj e-mail – fridrich.cloud',
    text: `Vítejte na fridrich.cloud.\n\nPotvrďte prosím svůj e-mail otevřením odkazu:\n${verifyUrl}\n\nOdkaz platí 24 hodin. Pokud jste se neregistrovali, tento e-mail ignorujte.`,
    html: layout(
      'Potvrďte svůj e-mail',
      'Vítejte. Ještě potvrďte, že vám tahle adresa patří – odkaz platí 24 hodin. Pokud jste se neregistrovali, e-mail prostě ignorujte.',
      { label: 'Potvrdit e-mail', url: verifyUrl },
    ),
  };
}

export function passwordResetEmail(to: string, resetUrl: string): EmailMessage {
  return {
    to,
    subject: 'Obnovení hesla – fridrich.cloud',
    text: `Někdo požádal o obnovení hesla k vašemu účtu.\n\nNové heslo nastavíte zde:\n${resetUrl}\n\nOdkaz platí 1 hodinu. Pokud jste o obnovu nežádali, nic nedělejte – heslo zůstává beze změny.`,
    html: layout(
      'Obnovení hesla',
      'Někdo požádal o obnovení hesla k vašemu účtu. Odkaz platí 1 hodinu. Pokud jste o obnovu nežádali, nic nedělejte – heslo zůstává beze změny.',
      { label: 'Nastavit nové heslo', url: resetUrl },
    ),
  };
}

export function passwordChangedEmail(to: string, loginUrl: string): EmailMessage {
  return {
    to,
    subject: 'Heslo bylo změněno – fridrich.cloud',
    text: `Heslo k vašemu účtu bylo právě změněno a byli jste odhlášeni na všech zařízeních.\n\nPokud to nebyla vaše akce, okamžitě si nastavte nové heslo:\n${loginUrl}`,
    html: layout(
      'Heslo bylo změněno',
      'Heslo k vašemu účtu bylo právě změněno a byli jste odhlášeni na všech zařízeních. Pokud to nebyla vaše akce, okamžitě si nastavte nové heslo.',
      { label: 'Otevřít přihlášení', url: loginUrl },
    ),
  };
}
