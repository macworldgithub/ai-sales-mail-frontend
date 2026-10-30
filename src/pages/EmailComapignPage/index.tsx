import { useCallback, useEffect, useState } from 'react';
import { Table, Button, Input, Tag, Typography, Alert, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import CreateCampaignModal from '../../components/CampaignModal';
import AutomationModal from '../../components/AutomationModal';
import ScheduleModal from '../../components/ScheduleModal';
import { displaySendTime } from '../../utils/schedule';
import { processCampaign } from '../../utils/delivery';
import { api, errorMessage } from '../../config';
import { type Campaign, openRate } from '../../types';
export default function EmailCampaigns() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [mode, setMode] = useState<'reply' | 'followUp'>('reply');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [scheduleCampaign, setScheduleCampaign] = useState<Campaign | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const reload = useCallback(() => setRefresh(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api.get('/campaigns/getAll', { params: { page, search: query }, signal: controller.signal })
      .then(({ data }) => { setCampaigns(data.campaigns); setTotal(data.total); })
      .catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, refresh]);
  async function sendNow(campaign: Campaign) {
    setProcessing(campaign._id); setError('');
    try { await processCampaign(campaign._id); }
    catch (error) { setError(errorMessage(error)); }
    finally { setProcessing(null); reload(); }
  }
  const columns: TableColumnsType<Campaign> = [
    { title: 'Campaign', dataIndex: 'campaignName', width: 220 },
    { title: 'Status', width: 200, render: (_, record) => <><Tag color={record.status === 'sent' ? 'green' : ['attention', 'failed'].includes(record.status) ? 'red' : 'blue'}>{record.status.toUpperCase()}</Tag>{record.lastDeliveryError && <div className="mt-2 text-xs text-red-700">{record.lastDeliveryError}</div>}</> },
    { title: 'Send time', width: 220, render: (_, record) => displaySendTime(record.scheduledAt) },
    { title: 'Emails sent', dataIndex: 'totalEmailSent', width: 100 },
    { title: 'Open rate', width: 100, render: (_, record) => `${openRate(record.totalEmailOpened, record.totalEmailSent).toFixed(1)}%` },
    { title: 'Replies', dataIndex: 'totalEmailReplied', width: 80 },
    { title: 'Actions', width: 360, render: (_, record) => <Space wrap>{['queued', 'scheduled'].includes(record.status) && !record.totalEmailSent && <Button onClick={() => setScheduleCampaign(record)}>Change send time</Button>}{['queued', 'sending'].includes(record.status) && (!record.scheduledAt || new Date(record.scheduledAt).getTime() <= Date.now()) && <Button type="primary" loading={processing === record._id} disabled={!!processing && processing !== record._id} onClick={() => sendNow(record)}>Send now</Button>}<Button onClick={() => { setSelected(record); setMode('reply'); }}>{record.isAutomatedReply ? 'Edit reply' : 'Automate reply'}</Button><Button onClick={() => { setSelected(record); setMode('followUp'); }}>{record.hasFollowUp ? 'Edit follow-up' : 'Schedule follow-up'}</Button></Space> },
  ];
  return <>
    <div className="page-heading"><div><Typography.Title level={2}>Email campaigns</Typography.Title><Typography.Text type="secondary">Create personalized outreach and keep the conversation going.</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New campaign</Button></div>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <div className="campaign-toolbar"><Input.Search allowClear aria-label="Search campaigns" placeholder="Search campaigns…" value={search} onChange={event => setSearch(event.target.value)} onSearch={value => { setQuery(value); setPage(1); }} /><Button aria-label="Refresh campaigns" icon={<ReloadOutlined />} loading={loading} onClick={reload} /></div>
    <Table<Campaign> rowKey="_id" columns={columns} dataSource={campaigns} loading={loading} scroll={{ x: 1430 }} pagination={{ current: page, pageSize: 10, total, onChange: setPage, showSizeChanger: false, responsive: true, showTotal: count => `${count} campaigns` }} />
    {createOpen && <CreateCampaignModal visible onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); setPage(1); reload(); }} />}
    {selected && <AutomationModal key={`${selected._id}-${mode}`} campaign={selected} mode={mode} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); reload(); }} />}
    {scheduleCampaign && <ScheduleModal campaign={scheduleCampaign} onClose={() => setScheduleCampaign(null)} onSaved={() => { setScheduleCampaign(null); reload(); }} />}
  </>;
}
