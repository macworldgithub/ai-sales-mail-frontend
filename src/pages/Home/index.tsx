import { motion } from "framer-motion";
import { Typography, Card, Table, Progress } from "antd";
import { BarChart, Briefcase, Mail, UserCheck } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SERVER_URL } from "../../config";
import axios from "axios";
import CustomLoader from "../../commons/CustomLoader";

const { Title } = Typography;

export default function DashboardPage() {
  // State variables
  const token=localStorage.getItem("x-ai-sales-mail-token")
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalEmailsSent, setTotalEmailsSent] = useState(0);
  const [totalOpened, setTotalOpened] = useState(0);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch campaign statistics
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/campaigns/total`,{headers:{
        Authorization:token
      }});
      const templateRes = await axios.get(`${SERVER_URL}/templates/total`,{headers:{
        Authorization:token
      }});

      setTotalCampaigns(res.data.totalCampaigns);
      setTotalEmailsSent(res.data.totalEmailsSent);
      setTotalOpened(res.data.totalOpened);
      setTotalTemplates(templateRes.data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Data for pie chart
  const pieData = [
    { name: "Opened", value: totalOpened, color: "#4CAF50" },
    { name: "Remaining", value: totalEmailsSent - totalOpened, color: "#FFC107" },
  ];

  // Sample recent campaigns
  const recentCampaigns = [
    { key: "1", name: "Product Launch", sent: 4500, openRate: "60%", status: "Completed" },
    { key: "2", name: "Black Friday Sale", sent: 8000, openRate: "72%", status: "Active" },
    { key: "3", name: "Monthly Newsletter", sent: 3000, openRate: "50%", status: "Draft" },
  ];

  return (
    <>
      <Title level={3} className="text-gray-800">Dashboard Overview</Title>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <Title level={4} className="text-white flex items-center gap-2">
            <Mail size={18} /> Total Campaigns
          </Title>
          <p className="text-3xl font-semibold"> {totalCampaigns}</p>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-400 to-green-600 text-white">
          <Title level={4} className="text-white flex items-center gap-2">
            <UserCheck size={18} /> Emails Sent
          </Title>
          <p className="text-3xl font-semibold">{totalEmailsSent}</p>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Title level={4} className="text-white flex items-center gap-2">
            <BarChart size={18} /> Open Rate
          </Title>
          <p className="text-3xl font-semibold"> {`${(((totalOpened) / totalEmailsSent) * 100).toFixed(2)}%`}</p>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <Title level={4} className="text-white flex items-center gap-2">
            <Briefcase size={18} /> Saved Templates
          </Title>
          <p className="text-3xl font-semibold">{totalTemplates}</p>
        </Card>
      </motion.div>

      {/* Charts and Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
      >
        {/* Pie Chart */}
        <Card title="Email Engagement Breakdown" className="shadow-md">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Campaigns */}
        <Card title="Recent Campaigns" className="shadow-md">
          <Table
            columns={[
              { title: "Campaign Name", dataIndex: "name", key: "name" },
              { title: "Emails Sent", dataIndex: "sent", key: "sent" },
              { title: "Open Rate", dataIndex: "openRate", key: "openRate" },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <Progress percent={status === "Active" ? 80 : status === "Completed" ? 100 : 40} />
                ),
              },
            ]}
            dataSource={recentCampaigns}
            pagination={false}
          />
        </Card>

{loading&&<CustomLoader/>}      </motion.div>
    </>
  );
}
