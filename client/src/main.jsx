import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/dm-sans';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/pages.css';
import './styles/home.css';
import './styles/features.css';
import './styles/promo.css';
import './styles/calm.css';
import './styles/tidy.css';
import './styles/team.css';
import './styles/mock.css';
import './styles/about.css';
import './styles/cotton.css';
import './styles/member.css';
import './styles/bizgen.css';
import './styles/structure.css';
import App from './App.jsx';

// Low-end devices get solid cards and no blob animation (backdrop-filter is the main cost on cheap Android phones)
const nav = navigator;
if ((nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2)) document.documentElement.classList.add('lite');

createRoot(document.getElementById('root')).render(
  <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>,
);
