import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Reports from './pages/Reports';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';

function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<TaskBoard />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </AuthProvider>
  );
}

export default App;
