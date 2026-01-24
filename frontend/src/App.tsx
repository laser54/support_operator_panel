import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import AppLayout from '@/components/layout/AppLayout';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryProvider>
  );
}

export default App;
