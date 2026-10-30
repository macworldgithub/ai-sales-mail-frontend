export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function localDateTime(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function scheduledTime(value: string): string {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime()) || localDateTime(date) !== value || date.getTime() <= Date.now()) {
    throw new Error('Choose a valid send date and time in the future.');
  }
  return date.toISOString();
}

export function displaySendTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'Ready to send';
}
