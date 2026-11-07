import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Select, Upload, Steps, Checkbox, Alert, Typography, Table, Spin } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { UploadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../config';
import type { EmailContent, ModalProps, TemplateSummary } from '../types';
import { isEmailColumn, parseRecipientRows, type Recipient } from '../utils/recipients';
import EmailFields from './EmailFields';
import SendTimePicker from './SendTimePicker';
import { displaySendTime, localDateTime, scheduledTime } from '../utils/schedule';
import { processCampaign } from '../utils/delivery';
import ChunkSettings, { type ChunkOptions } from './ChunkSettings';
interface Props extends ModalProps { onCreated: () => void }
export default function CreateCampaignModal({ visible, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<Recipient[]>([]);
  const [filename, setFilename] = useState('');
  const [importSummary, setImportSummary] = useState('');
  const [chunks, setChunks] = useState<ChunkOptions>({ enabled: false, size: 50, gap: 5, unit: 60 });
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selected, setSelected] = useState('custom');
  const [templateName, setTemplateName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [changes, setChanges] = useState('');
  const [email, setEmail] = useState<EmailContent>({ subject: '', body: '', closing: '' });
  const [previewRecipient, setPreviewRecipient] = useState(0);
  const [preview, setPreview] = useState<EmailContent | null>(null);
  const [previewSignature, setPreviewSignature] = useState<{ url: string; alt: string } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [updateTemplate, setUpdateTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const [sendLater, setSendLater] = useState(false);
  const [sendAt, setSendAt] = useState(localDateTime(new Date(Date.now() + 5 * 60000)));
  useEffect(() => {
    const controller = new AbortController();
    api.get('/templates/getAll/names', { signal: controller.signal }).then(({ data }) => setTemplates(data)).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (step !== 3 || !rows[previewRecipient]) return;
    const controller = new AbortController();
    setPreview(null); setPreviewSignature(null); setMissingFields([]); setPreviewLoading(true); setPreviewError('');
    api.post('/email/preview', { ...email, recipient: rows[previewRecipient] }, { signal: controller.signal })
      .then(({ data }) => { setPreview(data.emailContent); setMissingFields(data.missingFields); setPreviewSignature(data.signature || null); })
      .catch(error => { if (!controller.signal.aborted) setPreviewError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setPreviewLoading(false); });
    return () => controller.abort();
  }, [step, rows, previewRecipient, email, previewAttempt]);
  async function selectTemplate(value: string) {
    setSelected(value); setSaveTemplate(false); setUpdateTemplate(false); setError('');
    setEmail({ subject: '', body: '', closing: '' }); setPurpose(''); setChanges('');
    if (value === 'custom') return;
    setLoading(true);
    try {
      const { data } = await api.get(`/templates/getById/${value}`);
      setEmail({ subject: data.emailSubject, body: data.emailBody, closing: data.emailClosing, signatureId: data.emailSignatureId }); setPurpose(data.templatePurpose);
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  async function upload(file: RcFile) {
    setError(''); setRows([]); setFilename(''); setImportSummary(''); setPreviewRecipient(0);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name) || file.size > 2 * 1024 * 1024) { setError('Choose an Excel or CSV file under 2 MB.'); return false; }
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false, sheetRows: 10002 });
      const sheetName = workbook.SheetNames.find(name => {
        const sample = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' });
        return sample.length && Object.keys(sample[0]).some(isEmailColumn);
      });
      if (!sheetName) throw new Error('No worksheet has an Email or Client email column.');
      const sheet = workbook.Sheets[sheetName];
      if (XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1').e.r > 10000) throw new Error('Upload at most 10000 source rows.');
      const result = parseRecipientRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }));
      setRows(result.recipients); setFilename(file.name);
      setImportSummary(`${result.sourceRows} rows in ${sheetName}. Skipped ${result.missingEmail} rows without an email and ${result.duplicates} duplicate addresses.`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not read this spreadsheet.'); }
    finally { setLoading(false); }
    return false;
  }
  async function generate(revise: boolean) {
    if (!purpose.trim() || (revise && !changes.trim())) { setError(revise ? 'Describe the changes you want.' : 'Enter an email purpose.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post(revise ? '/email/makeChanges' : '/email/generate', revise
        ? { emailPurpose: purpose, emailBody: email.body, emailSubject: email.subject, emailClosing: email.closing, promptTochange: changes }
        : { emailPurpose: purpose, templatePlaceholders: [...new Set(rows.flatMap(row => Object.keys(row)))].filter(key => rows.some(row => row[key]?.trim())) });
      setEmail({ ...data.emailContent, signatureId: email.signatureId });
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  function next() {
    setError('');
    if (step === 0 && (!name.trim() || !description.trim())) { setError('Enter a campaign name and description.'); return; }
    if (step === 1 && !rows.length) { setError('Upload a recipient spreadsheet first.'); return; }
    if (step === 2) {
      if ([email.subject, email.body, email.closing].some(value => !value.trim())) { setError('Enter a subject, email body, and closing.'); return; }
      if (saveTemplate && (!templateName.trim() || !purpose.trim())) { setError('Enter a template name and purpose to save this template.'); return; }
    }
    setStep(value => value + 1);
  }
  async function send() {
    if (!preview || previewLoading || previewError) { setError('Review the recipient preview before sending.'); return; }
    if (chunks.enabled && (!Number.isInteger(chunks.size) || !chunks.size || chunks.size < 1 || chunks.size > 1000 || !Number.isInteger(chunks.gap) || !chunks.gap || chunks.gap < 1 || chunks.gap * chunks.unit > 604800)) { setError('Enter a whole chunk size from 1 to 1000 and a gap from 1 second to 7 days.'); return; }
    let scheduledAt: string | null;
    try { scheduledAt = sendLater ? scheduledTime(sendAt) : null; }
    catch (error) { setError(error instanceof Error ? error.message : 'Invalid send time'); return; }
    setLoading(true); setError('');
    try {
      // Queue the campaign once. Optional template saving is handled separately so a failed save cannot duplicate a campaign.
      const { data } = await api.post('/campaigns/create', { campaignName: name, description, emailTemplateSubject: email.subject, emailTemplateBody: email.body, emailTemplateClosing: email.closing, emailSignatureId: email.signatureId, recipients: rows, scheduledAt, chunkSize: chunks.enabled ? chunks.size : null, chunkGapSeconds: chunks.enabled ? chunks.gap! * chunks.unit : null }, { headers: { 'Idempotency-Key': requestId } });
      if (saveTemplate || updateTemplate) {
        try {
          const payload = { templateName, templatePurpose: purpose, emailSubject: email.subject, emailBody: email.body, emailClosing: email.closing, emailSignatureId: email.signatureId };
          if (saveTemplate) await api.post('/templates/create', payload);
          else await api.put(`/templates/update/${selected}`, { emailSubject: email.subject, emailBody: email.body, emailClosing: email.closing, emailSignatureId: email.signatureId });
        } catch { toast.error('Campaign queued, but the template could not be saved.'); }
      }
      if (sendLater) toast.success(`Campaign scheduled: ${displaySendTime(data.campaign?.scheduledAt || scheduledAt)}`);
      else {
        try { await processCampaign(data.campaign._id); }
        catch (error) { toast.error(`Campaign saved. ${errorMessage(error)}`); }
      }
      onCreated();
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  return <Modal title="Create a campaign" open={visible} onCancel={onClose} width={760} footer={null} closable={!loading} maskClosable={!loading} keyboard={!loading}>
    <Steps current={step} size="small" responsive items={['Details', 'Recipients', 'Email', 'Review'].map(title => ({ title }))} className="mb-6 mt-4" />
    {error && <Alert role="alert" type="error" showIcon message={error} className="mb-4" />}
    <Spin spinning={loading}><Form layout="vertical" disabled={loading}>
      {step === 0 && <><Form.Item label="Campaign name" required><Input aria-label="Campaign name" value={name} maxLength={200} onChange={event => setName(event.target.value)} /></Form.Item><Form.Item label="Description" required><Input.TextArea aria-label="Description" rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} /></Form.Item></>}
      {step === 1 && <><Typography.Paragraph>Upload an Excel or CSV file with an <strong>Email</strong> or <strong>Client email</strong> column. Client names can use {'{{Client Name}}'}. Rows without email addresses and duplicate addresses are skipped. Maximum 5,000 unique recipients, 10,000 source rows, and 2 MB.</Typography.Paragraph><Upload accept=".xlsx,.xls,.csv" beforeUpload={upload} showUploadList={false} disabled={loading}><Button icon={<UploadOutlined />}>Choose spreadsheet</Button></Upload>{filename && <><p className="my-4 break-all">{filename} · {rows.length} recipients</p><Alert type="info" showIcon message={importSummary} className="mb-4" /><Table<Recipient> size="small" rowKey="email" scroll={{ x: Math.max(480, Object.keys(rows[0]).length * 150) }} dataSource={rows.slice(0, 5)} pagination={false} columns={Object.keys(rows[0]).map(key => ({ title: key, dataIndex: key, key, width: 150 }))} /><Typography.Text type="secondary">Preview of the first five recipients.</Typography.Text></>}</>}
      {step === 2 && <>
        <Form.Item label="Start from"><Select value={selected} onChange={selectTemplate} options={[{ value: 'custom', label: 'New template' }, ...templates.map(template => ({ value: template._id, label: template.templateName }))]} /></Form.Item>
        <Form.Item label="Email purpose"><Input.TextArea aria-label="Email purpose" value={purpose} onChange={event => setPurpose(event.target.value)} rows={2} maxLength={4000} placeholder="Describe your offer and audience, or enter the email below." /></Form.Item>
        <Button className="mb-4" onClick={() => generate(false)} loading={loading}>Generate with AI</Button>
        <EmailFields value={email} onChange={setEmail} />
        <Form.Item label="Ask AI to revise this email"><Input.TextArea value={changes} onChange={event => setChanges(event.target.value)} rows={2} maxLength={4000} placeholder="For example: make the call to action shorter." /></Form.Item>
        <Button className="mb-4" onClick={() => generate(true)} disabled={[email.subject, email.body, email.closing].some(value => !value.trim())}>Apply AI changes</Button>
        {selected === 'custom' ? <><Checkbox checked={saveTemplate} onChange={event => setSaveTemplate(event.target.checked)}>Save as a reusable template</Checkbox>{saveTemplate && <Form.Item label="Template name" required className="mt-4"><Input value={templateName} onChange={event => setTemplateName(event.target.value)} /></Form.Item>}</> : <Checkbox checked={updateTemplate} onChange={event => setUpdateTemplate(event.target.checked)}>Update the saved template with these changes</Checkbox>}
      </>}
      {step === 3 && <>
        <Typography.Title level={4}>{name}</Typography.Title><p className="mb-4 break-words">{description}</p>
        <Alert type="info" showIcon message={`${rows.length} recipients. Choose a recipient to review their personalized email. Missing details use a neutral greeting; sentences requiring those details are omitted.`} className="mb-4" />
        <Form.Item label="Preview recipient"><Select aria-label="Preview recipient" value={previewRecipient} onChange={setPreviewRecipient} showSearch optionFilterProp="label" options={rows.map((row, index) => ({ value: index, label: row.email }))} /></Form.Item>
        {missingFields.length > 0 && <Alert type="warning" showIcon message={`Unavailable details for this recipient: ${missingFields.join(', ')}. The preview below uses professional fallbacks.`} className="mb-4" />}
        {previewError && <Alert type="error" showIcon message={previewError} action={<Button onClick={() => setPreviewAttempt(value => value + 1)}>Retry preview</Button>} className="mb-4" />}
        <SendTimePicker later={sendLater} value={sendAt} onLaterChange={setSendLater} onChange={setSendAt} />
        <ChunkSettings value={chunks} onChange={setChunks} recipients={rows.length} />
        <Spin spinning={previewLoading}><div className="email-preview" aria-label="Personalized email preview">{preview ? <><strong>{preview.subject}</strong><p className="my-4">{preview.body}</p><p>{preview.closing}</p>{previewSignature && <img src={previewSignature.url} alt={previewSignature.alt} width={600} height={300} style={{ display: 'block', maxWidth: '100%', width: 600, height: 'auto', marginTop: 16 }} />}</> : <Typography.Text type="secondary">Preparing recipient preview…</Typography.Text>}</div></Spin>
      </>}
      <div className="modal-actions">
        <Button onClick={() => step > 0 ? setStep(value => value - 1) : onClose()} disabled={loading}>{step ? 'Back' : 'Cancel'}</Button>
        {step < 3 ? <Button type="primary" onClick={next}>Next</Button> :
          <Button type="primary" aria-label={sendLater ? 'Schedule campaign' : 'Send now'} onClick={send} loading={loading}
            disabled={!preview || previewLoading || !!previewError}>{sendLater ? 'Schedule campaign' : 'Send now'}</Button>}
      </div>
    </Form></Spin>
  </Modal>;
}
