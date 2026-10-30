import { createElement, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { TOKEN_KEY } from '../config';
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  return localStorage.getItem(TOKEN_KEY) ? children : createElement(Navigate, { to: '/auth/login', replace: true });
}
