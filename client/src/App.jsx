import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import MyGroupsPage from './pages/MyGroupsPage';
import GroupPage from './pages/GroupPage';
import StudentProfile from './pages/StudentProfile';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';

const AppRoutes = () => (
  <BrowserRouter>
    <div className="page-wrapper">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/my-groups" replace />} />
          <Route path="/my-groups" element={<MyGroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route path="/groups/:groupId/students/:studentId" element={<StudentProfile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/my-groups" replace />} />
        </Routes>
      </main>
    </div>
    <Toast />
  </BrowserRouter>
);

const App = () => (
  <AppProvider>
    <AppRoutes />
  </AppProvider>
);

export default App;
