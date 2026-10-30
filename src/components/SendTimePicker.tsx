import { Form, Input, Radio, Typography } from 'antd';
import { localDateTime, localTimeZone } from '../utils/schedule';

interface Props { later: boolean; value: string; onLaterChange: (later: boolean) => void; onChange: (value: string) => void }
export default function SendTimePicker({ later, value, onLaterChange, onChange }: Props) {
  return <>
    <Form.Item label="When should this campaign send?">
      <Radio.Group value={later} onChange={event => onLaterChange(event.target.value)} options={[{ label: 'Send now', value: false }, { label: 'Schedule for later', value: true }]} />
    </Form.Item>
    {later && <Form.Item label="Send date and time" required extra={`Your timezone: ${localTimeZone()}`}>
      <Input aria-label="Send date and time" type="datetime-local" value={value} min={localDateTime(new Date(Date.now() + 60000))} onChange={event => onChange(event.target.value)} />
    </Form.Item>}
    {later && <Typography.Paragraph type="secondary">Sending starts at or after this time when the delivery worker runs. Automatic delivery requires the server scheduler to be connected.</Typography.Paragraph>}
  </>;
}
