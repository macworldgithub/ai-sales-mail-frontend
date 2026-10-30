import { useState } from 'react';
import { Alert, Button, Form, Modal, Typography } from 'antd';
import toast from 'react-hot-toast';
import type { Campaign } from '../types';
import { api, errorMessage } from '../config';
import { localDateTime, scheduledTime } from '../utils/schedule';
import { processCampaign } from '../utils/delivery';
import SendTimePicker from './SendTimePicker';

export default function ScheduleModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const [later, setLater] = useState(true);
  const [value, setValue] = useState(localDateTime(campaign.scheduledAt ? new Date(campaign.scheduledAt) : new Date(Date.now() + 5 * 60000)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setError('');
    let scheduledAt: string | null;
    try { scheduledAt = later ? scheduledTime(value) : null; }
    catch (error) { setError(error instanceof Error ? error.message : 'Invalid send time'); return; }
    setBusy(true);
    try {
      await api.patch(`/campaigns/${campaign._id}/schedule`, { scheduledAt });
      if (later) toast.success('Send time updated');
      else {
        try { await processCampaign(campaign._id); }
        catch (error) { toast.error(`Send time updated. ${errorMessage(error)}`); }
      }
      onSaved();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <Modal open title="Change send time" width={560} onCancel={onClose} footer={null} closable={!busy} maskClosable={!busy} keyboard={!busy}>
    <Typography.Paragraph>{campaign.campaignName}</Typography.Paragraph>
    {error && <Alert role="alert" type="error" message={error} showIcon className="mb-4" />}
    <Form layout="vertical" disabled={busy}>
      <SendTimePicker later={later} value={value} onLaterChange={setLater} onChange={setValue} />
      <div className="modal-actions"><Button onClick={onClose}>Cancel</Button><Button type="primary" onClick={save} loading={busy}>{later ? 'Save send time' : 'Send now'}</Button></div>
    </Form>
  </Modal>;
}
