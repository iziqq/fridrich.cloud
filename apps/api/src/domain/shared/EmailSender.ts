/**
 * Port pro odesílání e-mailů.
 *
 * Doména ví, že se má poslat ověřovací odkaz – jestli za tím stojí Azure
 * Communication Services nebo výpis do konzole při vývoji, ji nezajímá.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
