// @ts-ignore
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import MotifLayout from './components/MotifLayout';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import TowerGamePage from './pages/TowerGamePage';

function App() {
  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <MotifLayout>
          <Routes>
            <Route path="/" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tower" element={<TowerGamePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </MotifLayout>
      </BrowserRouter>
    </>
  );
}

export default App;
