// @ts-ignore
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import MotifLayout from './components/MotifLayout';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import TowerGamePage from './pages/TowerGamePage';
import ZetlaPage from './pages/ZetlaPage';

function MotifRoute() {
  return (
    <MotifLayout>
      <Outlet />
    </MotifLayout>
  );
}

function App() {
  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Zetla — standalone, no MotifLayout */}
          <Route path="/zetla" element={<ZetlaPage />} />

          {/* Everything else — wrapped in MotifLayout */}
          <Route element={<MotifRoute />}>
            <Route path="/" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tower" element={<TowerGamePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
