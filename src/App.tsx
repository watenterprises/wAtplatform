import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import FeedPage from './pages/FeedPage';
import { AuthProvider } from "./context/AuthContext";
import PlaceholderPage from './pages/PlaceholderPage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import MessagesPage from './pages/MessagesPage';
import { Bell, PlusSquare, Share2, Settings, HelpCircle } from 'lucide-react';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/dashboard" element={<FeedPage />} />

            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/search" element={<SearchPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" icon={Bell} description="Stay updated with your network activity." />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/create" element={<PlaceholderPage title="Create Studio" icon={PlusSquare} description="Advanced tools for creating articles and media." />} />
            <Route path="/invite" element={<PlaceholderPage title="Invite Team" icon={Share2} />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" icon={Settings} />} />
            <Route path="/help" element={<PlaceholderPage title="Help & Support" icon={HelpCircle} />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
