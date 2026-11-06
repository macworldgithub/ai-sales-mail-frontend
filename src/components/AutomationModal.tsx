import { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Button, Alert, Popconfirm, Spin } from 'antd';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../config';
import type { Campaign, EmailContent } from '../types';
import EmailFields from './EmailFields';
interface Props { campaign: Campaign; mode: 'reply' | 'followUp'; onClose: () => void; onSaved: () => void }
export default function AutomationModal({ campaign, mode, onClose, onSaved }: Props) {
  const followUp = mode === 'followUp';
  const enabled = followUp ? campaign.hasFollowUp : campaign.isAutomatedReply;
  const [email, setEmail] = useState<EmailContent>({ subject: '', body: '', closing: '' });
  const [days, setDays] = useState<number | null>(campaign.followUpDuration || 3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const base = followUp ? '/follow-up' : '/automated-reply';
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    api.get(`${base}/${followUp ? 'getFollowUpByCompaignId' : 'getAutomationByCompaignId'}/${campaign._id}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!data[0]) { setError('No saved template found. Enter a template or generate one.'); return; }
        setEmail({ subject: data[0].emailTemplateSubject, body: data[0].emailTemplateBody, closing: data[0].emailTemplateClosing, signatureId: data[0].emailSignatureId });
      }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, campaign._id, enabled, followUp]);
  async function generate() {
    setLoading(true); setError('');
    try { const { data } = await api.post(`/email/${followUp ? 'generateAutomatedFollowUpEmail' : 'generateAutomatedEmail'}`, { campaignId: campaign._id }); setEmail({ ...data.emailContent, signatureId: email.signatureId }); }
    catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  async function save() {
    if ([email.subject, email.body, email.closing].some(value => !value.trim())) { setError('Enter a subject, email body, and closing.'); return; }
    if (followUp && (!days || !Number.isInteger(days) || days < 1 || days > 365)) { setError('Choose a whole number between 1 and 365 days.'); return; }
    setLoading(true); setError('');
    try {
      const payload = { campaignId: campaign._id, emailTemplateSubject: email.subject, emailTemplateBody: email.body, emailTemplateClosing: email.closing, emailSignatureId: email.signatureId, ...(followUp ? { followUpDuration: days } : {}) };
      const action = enabled ? followUp ? 'updateFollowUp' : 'updateAutomatedReply' : followUp ? 'enableFollowUp' : 'enableAutomation';
      await api.request({ method: enabled ? 'put' : 'post', url: `${base}/${action}${enabled ? `/${campaign._id}` : ''}`, data: payload });
      toast.success(followUp ? 'Follow-up saved' : 'Automated reply saved'); onSaved();
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  async function remove() {
    setLoading(true); setError('');
    try { await api.delete(`${base}/${followUp ? 'removeFollowUp' : 'removeAutomation'}/${campaign._id}`); toast.success('Automation removed'); onSaved(); }
    catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  return <Modal open title={followUp ? 'Schedule a follow-up' : 'Automate replies'} width={680} onCancel={onClose} closable={!loading} maskClosable={!loading} keyboard={!loading} footer={null}>
    <p className="text-slate-500 mb-4">{campaign.campaignName}</p>
    <Alert type="info" showIcon message={followUp ? 'Send one follow-up after this many days to recipients who have not replied. Delivery runs on the server schedule.' : 'Send one response to each recipient’s first matched reply. Replies are checked on the server schedule.'} className="mb-4" />
    {error && <Alert role="alert" type="error" showIcon message={error} className="mb-4" />}
    <Spin spinning={loading}><Form layout="vertical" disabled={loading}>
      <Button onClick={generate} loading={loading} className="mb-4">Generate with AI</Button>
      <EmailFields value={email} onChange={setEmail} />
      {followUp && <Form.Item label="Days after the original email" required><InputNumber aria-label="Follow-up days" min={1} max={365} precision={0} value={days} onChange={setDays} style={{ width: '100%' }} /></Form.Item>}
      <div className="modal-actions">{enabled && <Popconfirm title="Remove this automation?" onConfirm={remove}><Button danger disabled={loading}>Remove</Button></Popconfirm>}<Button type="primary" loading={loading} onClick={save}>Save automation</Button></div>
    </Form></Spin>
  </Modal>;
}
