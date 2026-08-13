// src/App.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import StudentsPage from './pages/StudentsPage';

// Dashboard is public (read-only view for signed-out users)
// Problem completion and adding problems requires sign-in (enforced in components)

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <div className="page-wrapper">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Dashboard — public read, interactive only when signed in */}
            <Route path="/" element={<Dashboard />} />

            {/* Students list — public */}
            <Route path="/students" element={<StudentsPage />} />

            {/* Student profile — public */}
            <Route path="/students/:id" element={<StudentProfile />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </BrowserRouter>
  </AppProvider>
);

export default App;
