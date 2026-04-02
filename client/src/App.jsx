import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Quran from './pages/Quran';
import Hadith from './pages/Hadith';
import Fiqh from './pages/Fiqh';
import PrayerTimes from './pages/PrayerTimes';
import PrayerPosture from './pages/PrayerPosture';
import LiveClasses from './pages/LiveClasses';
import Reviews from './pages/Reviews';
import WeeklyLearning from './pages/WeeklyLearning';
import WeeklyQuiz from './pages/WeeklyQuiz';
import WeeklyResults from './pages/WeeklyResults';
import KidsDashboard from './pages/kids/KidsDashboard';
import KidsGames from './pages/kids/KidsGames';
import KidsPlay from './pages/kids/KidsPlay';
import KidsLeaderboard from './pages/kids/KidsLeaderboard';
import KidsCompetitions from './pages/kids/KidsCompetitions';
import KidsDuas from './pages/kids/KidsDuas';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGames from './pages/admin/AdminGames';
import GameBuilder from './pages/admin/GameBuilder';
import AdminCompetitions from './pages/admin/AdminCompetitions';
import AdminPrizes from './pages/admin/AdminPrizes';
import AdminClasses from './pages/admin/AdminClasses';
import AdminReviews from './pages/admin/AdminReviews';
import AdminWeekly from './pages/admin/AdminWeekly';
import WeeklyTopicBuilder from './pages/admin/WeeklyTopicBuilder';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 64, height: 64 }}></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quran" element={<Quran />} />
        <Route path="/hadith" element={<Hadith />} />
        <Route path="/fiqh" element={<Fiqh />} />
        <Route path="/prayer" element={<PrayerTimes />} />
        <Route path="/prayer/posture" element={<PrayerPosture />} />
        <Route path="/classes" element={<LiveClasses />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/weekly" element={<WeeklyLearning />} />
        <Route path="/weekly/quiz/:id" element={<ProtectedRoute><WeeklyQuiz /></ProtectedRoute>} />
        <Route path="/weekly/results/:id" element={<WeeklyResults />} />
        
        {/* Kids Section */}
        <Route path="/kids" element={<ProtectedRoute><KidsDashboard /></ProtectedRoute>} />
        <Route path="/kids/games" element={<ProtectedRoute><KidsGames /></ProtectedRoute>} />
        <Route path="/kids/play/:id" element={<ProtectedRoute><KidsPlay /></ProtectedRoute>} />
        <Route path="/kids/leaderboard" element={<KidsLeaderboard />} />
        <Route path="/kids/competitions" element={<KidsCompetitions />} />
        <Route path="/kids/duas" element={<KidsDuas />} />

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/games" element={<ProtectedRoute adminOnly><AdminGames /></ProtectedRoute>} />
        <Route path="/admin/games/new" element={<ProtectedRoute adminOnly><GameBuilder /></ProtectedRoute>} />
        <Route path="/admin/games/edit/:id" element={<ProtectedRoute adminOnly><GameBuilder /></ProtectedRoute>} />
        <Route path="/admin/competitions" element={<ProtectedRoute adminOnly><AdminCompetitions /></ProtectedRoute>} />
        <Route path="/admin/prizes" element={<ProtectedRoute adminOnly><AdminPrizes /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute adminOnly><AdminClasses /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute adminOnly><AdminReviews /></ProtectedRoute>} />
        <Route path="/admin/weekly" element={<ProtectedRoute adminOnly><AdminWeekly /></ProtectedRoute>} />
        <Route path="/admin/weekly/new" element={<ProtectedRoute adminOnly><WeeklyTopicBuilder /></ProtectedRoute>} />
        <Route path="/admin/weekly/edit/:id" element={<ProtectedRoute adminOnly><WeeklyTopicBuilder /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <Chatbot />
    </HashRouter>
  );
}

export default App;
