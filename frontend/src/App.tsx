import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthToken } from '@/hooks/use-auth-token';

import HistoryPage from '@/pages/HistoryPage';
import DashboardPage from '@/pages/DashboardPage';
import UsersPage from '@/pages/UsersPage';
import DirectoriesPage from '@/pages/DirectoriesPage';
import ScriptsReviewPage from '@/pages/ScriptsReviewPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthToken();
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
            <Route path="history" element={<HistoryPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="directories" element={<DirectoriesPage />} />
            <Route path="scripts-review" element={<ScriptsReviewPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryProvider>
  );
}

export default App;
