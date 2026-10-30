import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage, TOKEN_KEY, SERVER_URL } from '../../../config';
interface Credentials { firstname?: string; email: string; password: string }
export default function Login() {
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState(false);
  const navigate = useNavigate();
  async function submit(values: Credentials) {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/auth/${signup ? 'signup' : 'login'}`, values);
      if (typeof data.token !== 'string' || !data.token) throw new Error('The server returned an invalid session');
      localStorage.setItem(TOKEN_KEY, data.token);
      toast.success(signup ? 'Account created' : 'Welcome back');
      navigate('/dashboard', { replace: true });
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }
  return <div className="auth-page"><div className="auth-card">
    <div className="auth-logo">AI</div><Typography.Title level={2}>AI SalesMail</Typography.Title>
    <Typography.Paragraph type="secondary">{signup ? 'Create your sales workspace.' : 'Welcome back. Sign in to your workspace.'}</Typography.Paragraph>
    {!SERVER_URL && <Alert type="error" showIcon message="Set VITE_API_URL to your backend URL and rebuild the frontend." className="mb-4" />}
    <Form key={String(signup)} layout="vertical" onFinish={submit} disabled={loading} requiredMark={false}>
      {signup && <Form.Item name="firstname" label="Your name" rules={[{ required: true, whitespace: true, max: 100 }]}><Input size="large" autoComplete="given-name" /></Form.Item>}
      <Form.Item name="email" label="Email address" rules={[{ required: true }, { type: 'email', message: 'Enter a valid email address' }]}><Input size="large" autoComplete="email" inputMode="email" /></Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }, { min: 6, max: 72, message: 'Use between 6 and 72 characters' }]}><Input.Password size="large" autoComplete={signup ? 'new-password' : 'current-password'} /></Form.Item>
      <Button type="primary" htmlType="submit" size="large" block loading={loading} disabled={!SERVER_URL}>{signup ? 'Create account' : 'Sign in'}</Button>
    </Form>
    <Button type="link" block disabled={loading} onClick={() => setSignup(!signup)}>{signup ? 'Already have an account? Sign in' : 'New here? Create an account'}</Button>
  </div></div>;
}
