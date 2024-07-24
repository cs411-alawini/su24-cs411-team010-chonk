import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import OwnStats from './OwnStats';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<App />} />
          <Route path="/own-stats" element={<OwnStats />} />
        </Routes>
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);