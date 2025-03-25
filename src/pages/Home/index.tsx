import { motion } from "framer-motion";
import { Typography, Card } from "antd";

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <>
      <Title level={3} className="text-gray-800">Dashboard</Title>

      {/* Motion Wrapper for Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <Title level={4} className="text-white">Total Campaigns</Title>
          <p className="text-2xl font-semibold">24</p>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-400 to-green-600 text-white">
          <Title level={4} className="text-white">Emails Sent</Title>
          <p className="text-2xl font-semibold">12,456</p>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Title level={4} className="text-white">Open Rate</Title>
          <p className="text-2xl font-semibold">58%</p>
        </Card>
      </motion.div>
    </>
  );
}
