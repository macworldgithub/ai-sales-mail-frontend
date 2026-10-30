export type Recipient = Record<string, string>;
export function normalizeRows(rows: Record<string, unknown>[]): Recipient[] {
  if (!rows.length || rows.length > 1000) throw new Error('Upload between 1 and 1000 recipients.');
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value ?? '').trim()]));
    const emailKey = Object.keys(values).find(key => key.toLowerCase() === 'email');
    const email = (emailKey ? values[emailKey] : '').toLowerCase();
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error(`Row ${index + 2} needs a valid email in an Email column.`);
    if (seen.has(email)) throw new Error(`Duplicate recipient: ${email}`);
    seen.add(email);
    return { ...values, email };
  });
}
