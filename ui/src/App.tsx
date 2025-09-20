// @ts-ignore
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MessagePage from './pages/MessagePage';
import ImagePage from './pages/ImagePage';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/message" element={<MessagePage />} />
            <Route path="/image" element={<ImagePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
