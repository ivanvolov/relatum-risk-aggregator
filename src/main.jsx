import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Summary from './routes/Summary.jsx';
import ProtocolDetail from './routes/ProtocolDetail.jsx';
import Methodology from './routes/Methodology.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Summary />} />
          <Route path="protocol/:slug" element={<ProtocolDetail />} />
          <Route path="methodology" element={<Methodology />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
