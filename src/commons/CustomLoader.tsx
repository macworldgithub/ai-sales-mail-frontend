import { Spin } from 'antd';
export default function CustomLoader() { return <div role="status" aria-label="Loading" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'grid', placeItems: 'center', background: '#ffffff99' }}><Spin size="large" /></div>; }
