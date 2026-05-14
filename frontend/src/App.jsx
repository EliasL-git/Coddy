import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Language from "./pages/Language";
import LessonPage from "./pages/LessonPage";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLessons from "./pages/admin/AdminLessons";
import Shop from "./pages/Shop";
import AdminPrizes from "./pages/admin/AdminPrizes";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:lang"
            element={
              <ProtectedRoute>
                <Language />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <Shop />
              </ProtectedRoute>
            }
          />

          {/* Admin routes — nested under AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="prizes" element={<AdminPrizes />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
