import React, { useState,useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from './pages/Sidebar/Sidebar';
import Appbar from './pages/Sidebar/app-bar';
import RoutesComponent from './Routes';
import { BrowserRouter as Router } from 'react-router-dom';
import SessionExpiredAlert from './components/common/SessionExpiredAlert';

// Create RTL Cache with Emotion
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create RTL Theme
const theme = createTheme({
  direction: 'rtl', // Enable RTL
  typography: {
    fontFamily: '"Noto Kufi Arabic", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('showSessionExpiredMessage') === '1') {
      setSessionExpired(true);
      localStorage.removeItem('showSessionExpiredMessage');
    }
  }, []);

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_relativeSplatPath: true }}>
          <Appbar />
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main style={{ padding: '16px', marginTop: '64px', textAlign: 'right' }}>
            <RoutesComponent />
          </main>
          <SessionExpiredAlert open={sessionExpired} onClose={() => setSessionExpired(false)} />
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
