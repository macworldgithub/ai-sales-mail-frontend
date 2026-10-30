import { Form, Input } from 'antd';
import type { EmailContent } from '../types';
export default function EmailFields({ value, onChange }: { value: EmailContent; onChange: (value: EmailContent) => void }) {
  return <>{(['subject', 'body', 'closing'] as const).map(key => <Form.Item key={key} label={key === 'subject' ? 'Subject' : key === 'body' ? 'Email body' : 'Closing'} required>
    <Input.TextArea aria-label={key === 'body' ? 'Email body' : key === 'subject' ? 'Subject' : 'Closing'} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} autoSize={{ minRows: key === 'body' ? 6 : 1, maxRows: key === 'body' ? 14 : 4 }} maxLength={20000} />
  </Form.Item>)}</>;
}
