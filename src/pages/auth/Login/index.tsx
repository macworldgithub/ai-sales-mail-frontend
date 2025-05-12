"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Form, Input, Button, Typography } from "antd";
import toast from "react-hot-toast";
import axios from "axios"; // Import axios
import { useNavigate } from "react-router-dom";
const { Title } = Typography;
import { SERVER_URL } from "../../../config/index";

export default function Login() {
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${SERVER_URL}/api/auth/login`, // Use environment variable for API URL
        values
      );

      // Save token to localStorage
      localStorage.setItem("x-ai-sales-mail-token", response.data.token);

      toast.success("Login successful!");
      navigate("/dashboard"); // Redirect to dashboard
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <motion.div
        className="bg-white shadow-2xl rounded-2xl p-8 w-96"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Title level={2} className="text-center text-gray-800">
          Login to Ai SalesMail
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter your email" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password placeholder="Enter your password" size="large" />
          </Form.Item>

          <Button
            type="primary"
            block
            size="large"
            htmlType="submit"
            loading={loading} // Show loading state
            className="mt-4"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Form>
      </motion.div>
    </div>
  );
}
