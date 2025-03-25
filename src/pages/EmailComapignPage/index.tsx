"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layout, Table, Button, Input, Tag, Typography } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import CreateCampaignModal from "../../components/CampaignModal";

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

export default function EmailCampaigns() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [campaigns, setCampaigns] = useState([
    {
      key: "1",
      name: "Summer Sales Outreach",
      status: "Sent",
      emailsSent: 1200,
      openRate: "65%",
    },
    {
      key: "2",
      name: "New Product Launch",
      status: "Scheduled",
      emailsSent: 500,
      openRate: "Pending",
    },
    {
      key: "3",
      name: "Cold Outreach",
      status: "Draft",
      emailsSent: 0,
      openRate: "N/A",
    },
  ]);

  // Status Tags
  const statusTag = (status: string) => {
    const color =
      status === "Sent" ? "green" : status === "Scheduled" ? "blue" : "volcano";
    return <Tag color={color}>{status}</Tag>;
  };

  // Table Columns
  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => statusTag(status),
    },
    {
      title: "Emails Sent",
      dataIndex: "emailsSent",
      key: "emailsSent",
    },
    {
      title: "Open Rate",
      dataIndex: "openRate",
      key: "openRate",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} />
          <Button icon={<DeleteOutlined />} danger />
          {record.status === "Draft" && (
            <Button icon={<SendOutlined />} type="primary">
              Send
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <Content className="p-6 bg-gray-100 min-h-screen">
        {/* Page Title & Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-6"
        >
          <Title level={3} className="text-gray-800">
            Email Campaigns
          </Title>
        
          <Button type="primary"  icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>New Campaign</Button>
      <CreateCampaignModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    
        </motion.div>

        {/* Search Bar */}
        <Search
          placeholder="Search campaigns..."
          prefix={<SearchOutlined />}
          className="mb-4 w-full md:w-1/3"
        />

        {/* Email Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Table columns={columns} dataSource={campaigns} />
        </motion.div>
      </Content>
    </Layout>
  );
}
