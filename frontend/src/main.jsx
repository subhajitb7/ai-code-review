import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import axios from "axios";

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const hostname = window.location.hostname;
axios.defaults.baseURL = isLocal ? `http://${hostname}:5007` : "https://api.subhajitbag.in";
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
