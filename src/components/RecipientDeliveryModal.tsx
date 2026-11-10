import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Space, Table, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { api, errorMessage } from '../config';
import { displaySendTime } from '../utils/schedule';

const statuses = {
  sent: { label: 'Sent', color: 'green' },
  retrying: { label: 'Retrying', color: 'orange' },
  waiting: { label: 'Waiting', color: 'blue' },
  sending: { label: 'Sending', color: 'processing' },
  failed: { label: 'Failed', color: 'red' },
  review: { label: 'Needs review', color: 'volcano' },
  unknown: { label: 'Unknown', color: 'default' },
};

type DeliveryStatus = keyof typeof statuses;
interface RecipientDelivery { email: string; status: DeliveryStatus; sentAt: string | null }

export default function RecipientDeliveryModal({ campaignId, campaignName, onClose }: {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}) {
  const [recipients, setRecipients] = useState<RecipientDelivery[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DeliveryStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get<{ recipients: RecipientDelivery[] }>(`/campaigns/${campaignId}/recipients`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setRecipients(data.recipients); })
      .catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [campaignId, refresh]);

  const counts: Partial<Record<DeliveryStatus, number>> = {};
  const query = search.trim().toLowerCase();
  const visible = recipients.filter(recipient => {
    counts[recipient.status] = (counts[recipient.status] || 0) + 1;
    return (status === 'all' || recipient.status === status) && recipient.email.toLowerCase().includes(query);
  });
  const options = [
    { value: 'all', label: `All statuses (${recipients.length})` },
    ...Object.entries(statuses).map(([value, { label }]) => ({ value, label: `${label} (${counts[value as DeliveryStatus] || 0})` })),
  ];

  return <Modal open title={`Recipient delivery · ${campaignName}`} onCancel={onClose} footer={null} width={720}>
    <Space wrap className="my-4">
      <Input allowClear aria-label="Search recipient emails" placeholder="Search email addresses" value={search}
        onChange={event => { setSearch(event.target.value); setPage(1); }} />
      <Select aria-label="Filter by delivery status" value={status} options={options} style={{ width: 175 }}
        onChange={value => { setStatus(value); setPage(1); }} />
      <Button icon={<ReloadOutlined />} loading={loading} onClick={() => { setPage(1); setRefresh(value => value + 1); }}>Refresh recipients</Button>
    </Space>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Table<RecipientDelivery> rowKey="email" size="small" loading={loading} dataSource={visible} scroll={{ x: 530 }}
      locale={{ emptyText: loading ? 'Loading recipients…' : error ? 'Recipient status unavailable' : 'No matching recipients' }}
      pagination={{ current: page, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: total => `${total} recipients` }}
      columns={[
        { title: 'Email address', dataIndex: 'email', render: (email: string) => <span className="break-all">{email}</span> },
        { title: 'Status', width: 135, render: (_, record) => <Tag color={statuses[record.status].color}>{statuses[record.status].label}</Tag> },
        { title: 'Sent at', width: 185, render: (_, record) => record.status === 'sent' && record.sentAt ? displaySendTime(record.sentAt) : '—' },
      ]} />
  </Modal>;
}
