"use client";

import { motion } from "framer-motion";
import { Form, Input, Button, Typography, message } from "antd";
import toast from "react-hot-toast";

const { Title, Text } = Typography;

export default function Login() {
  const onFinish = (values: any) => {
    console.log("Login Details:", values);
    toast.success("Login successful!");
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
          Login to AI SalesMail
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              {
                type: "email",
                message: "Please enter a valid email!",
              },
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

          <Button type="primary" block size="large" htmlType="submit" className="mt-4">
            Login
          </Button>
        </Form>

     
      </motion.div>
    </div>
  );
}
