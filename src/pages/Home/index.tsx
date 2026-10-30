import { useEffect, useState } from 'react';
import { Typography, Card, Table, Tag, Empty, Alert, Button, Skeleton } from 'antd';
import { MailOutlined, SendOutlined, RiseOutlined, FileTextOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, errorMessage } from '../../config';
import { type Campaign, openRate } from '../../types';
interface Stats { totalCampaigns: number; totalEmailsSent: number; totalOpened: number }
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalCampaigns: 0, totalEmailsSent: 0, totalOpened: 0 });
  const [templates, setTemplates] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([api.get('/campaigns/total'), api.get('/templates/total'), api.get('/campaigns/getAll', { params: { page: 1, limit: 5 } })])
      .then(([statistics, saved, recent]) => { if (active) { setStats(statistics.data); setTemplates(saved.data.total); setCampaigns(recent.data.campaigns); } })
      .catch(error => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  const pieData = [{ name: 'Opened', value: stats.totalOpened }, { name: 'Unopened', value: Math.max(0, stats.totalEmailsSent - stats.totalOpened) }];
  const cards = [
    { label: 'Total campaigns', value: stats.totalCampaigns, icon: <MailOutlined />, color: '#2563eb' },
    { label: 'Emails sent', value: stats.totalEmailsSent, icon: <SendOutlined />, color: '#0d9488' },
    { label: 'Open rate', value: `${openRate(stats.totalOpened, stats.totalEmailsSent).toFixed(1)}%`, icon: <RiseOutlined />, color: '#7c3aed' },
    { label: 'Saved templates', value: templates, icon: <FileTextOutlined />, color: '#d97706' },
  ];
  return <>
    <div className="page-heading"><div><Typography.Title level={2}>Dashboard</Typography.Title><Typography.Text type="secondary">Your campaigns and email engagement at a glance.</Typography.Text></div><Button onClick={() => setRefresh(value => value + 1)} loading={loading}>Refresh</Button></div>
    {error && <Alert showIcon type="error" message={error} className="mb-4" />}
    <div className="stats-grid">{cards.map(card => <Card key={card.label} className="stat-card"><Skeleton loading={loading} active paragraph={{ rows: 1 }}><div className="stat-label"><span>{card.label}</span><span className="stat-icon" style={{ color: card.color }}>{card.icon}</span></div><div className="stat-value">{card.value}</div></Skeleton></Card>)}</div>
    <div className="dashboard-grid">
      <Card title="Email engagement">{loading ? <Skeleton active /> : stats.totalEmailsSent ? <div className="engagement-chart"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} innerRadius={62} outerRadius={95} dataKey="value" paddingAngle={3} isAnimationActive={false}>{pieData.map((entry, index) => <Cell key={entry.name} fill={['#2563eb', '#cbd5e1'][index]} />)}</Pie><Tooltip /><Legend formatter={value => <span style={{ color: '#64748b' }}>{value}</span>} /></PieChart></ResponsiveContainer></div> : <Empty className="empty-chart" description="Engagement appears after you send your first campaign." />}</Card>
      <Card title="Recent campaigns"><Table<Campaign> rowKey="_id" loading={loading} dataSource={campaigns} pagination={false} scroll={{ x: 480 }} columns={[
        { title: 'Campaign', dataIndex: 'campaignName' },
        { title: 'Sent', dataIndex: 'totalEmailSent', width: 70 },
        { title: 'Opened', render: (_, record) => `${openRate(record.totalEmailOpened, record.totalEmailSent).toFixed(1)}%`, width: 90 },
        { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag color={status === 'sent' ? 'green' : status === 'failed' || status === 'attention' ? 'red' : 'blue'}>{status}</Tag> },
      ]} /></Card>
    </div>
  </>;
}
