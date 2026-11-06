import { Checkbox, Form, InputNumber, Select, Typography } from 'antd';
export interface ChunkOptions { enabled: boolean; size: number | null; gap: number | null; unit: number }
export default function ChunkSettings({ value, onChange, recipients }: { value: ChunkOptions; onChange: (value: ChunkOptions) => void; recipients: number }) {
  return <div className="mb-4"><Checkbox checked={value.enabled} onChange={event => onChange({ ...value, enabled: event.target.checked })}>Send emails in chunks</Checkbox>{value.enabled && <><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
    <Form.Item label="Emails per chunk" style={{ flex: '1 1 160px' }}><InputNumber aria-label="Emails per chunk" min={1} max={1000} precision={0} value={value.size} onChange={size => onChange({ ...value, size })} style={{ width: '100%' }} /></Form.Item>
    <Form.Item label="Gap between chunks" style={{ flex: '1 1 160px' }}><InputNumber aria-label="Gap between chunks" min={1} max={Math.floor(604800 / value.unit)} precision={0} value={value.gap} onChange={gap => onChange({ ...value, gap })} style={{ width: '100%' }} /></Form.Item>
    <Form.Item label="Gap unit" style={{ flex: '1 1 140px' }}><Select aria-label="Gap unit" value={value.unit} onChange={unit => onChange({ ...value, unit })} options={[{ value: 1, label: 'Seconds' }, { value: 60, label: 'Minutes' }, { value: 3600, label: 'Hours' }]} /></Form.Item>
  </div><Typography.Paragraph type="secondary">{value.size && value.size > 0 ? `${Math.ceil(recipients / value.size)} chunks. ` : ''}The gap starts after each chunk finishes. Delivery continues with the browser closed; the server checks for due chunks every minute.</Typography.Paragraph></>}</div>;
}
