export type Recipient = Record<string, string>;
export const isEmailColumn = (key: string) => ['email', 'emailaddress', 'clientemail', 'clientemailaddress', 'customeremail', 'contactemail'].includes(key.toLowerCase().replace(/[\s_-]+/g, ''));
export function parseRecipientRows(rows: Record<string, unknown>[]) {
  if (!rows.length || rows.length > 10000) throw new Error('Upload between 1 and 10000 source rows.');
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  let missingEmail = 0, duplicates = 0;
  rows.forEach((row, index) => {
    const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value ?? '').trim()]));
    const emailKey = Object.keys(values).find(isEmailColumn);
    const email = (emailKey ? values[emailKey] : '').toLowerCase();
    if (!email || /^(?:-|n\/?a|none|null|undefined|not available)$/i.test(email)) { missingEmail++; return; }
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error(`Row ${index + 2} has an invalid email address.`);
    if (seen.has(email)) { duplicates++; return; }
    seen.add(email);
    recipients.push({ ...values, email });
  });
  if (!recipients.length) throw new Error('No recipients have a valid email address. Use an Email or Client email column.');
  if (recipients.length > 5000) throw new Error('Upload at most 5000 unique recipients.');
  return { recipients, missingEmail, duplicates, sourceRows: rows.length };
}
export const normalizeRows = (rows: Record<string, unknown>[]) => parseRecipientRows(rows).recipients;
