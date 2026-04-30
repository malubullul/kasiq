import './style.css'
import './pages/enhanced.css'
import { renderChat } from './pages/chat.js'
import { renderDashboard } from './pages/dashboard.js'
import { renderInsight } from './pages/insight.js'
import { renderSettings } from './pages/settings.js'
import { renderLogin } from './pages/login.js'
import './pages/login.css'

const app = document.getElementById('app')
const navLinks = document.querySelectorAll('.nav-links a')

// ── DATA LAYER ──────────────────────────────────
const DATA_KEY = 'kasiq_finance_data';

// Phase 6: Start clean — no dummy data polluting the demo
if (!localStorage.getItem(DATA_KEY)) {
  localStorage.setItem(DATA_KEY, JSON.stringify({ balance: 0, transactions: [] }));
}

// Global update function — triggers dashboard refresh
window.updateFinanceData = (newData) => {
  const current = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
  const updated = { ...current, ...newData };
  // Recalculate balance from transactions if provided
  if (newData.transactions) {
    updated.balance = newData.transactions.reduce((sum, t) => sum + t.amount, 0);
  }
  localStorage.setItem(DATA_KEY, JSON.stringify(updated));

  // Auto-refresh dashboard if visible
  if (views['dashboard'] && views['dashboard'].style.display !== 'none') {
    renderDashboard(views['dashboard']);
  }
};

// ── ROUTING ─────────────────────────────────────
const views = {}

function initViews() {
  ['login', 'chat', 'dashboard', 'insight'].forEach(route => {
    const container = document.createElement('div')
    container.id = `view-${route}`
    container.style.display = 'none'
    container.style.height = '100%'
    app.appendChild(container)
    views[route] = container

    switch (route) {
      case 'chat': renderChat(container); break;
      case 'dashboard': renderDashboard(container); break;
      case 'insight': renderInsight(container); break;
      case 'login': renderLogin(container, () => navigateTo('dashboard')); break;
    }
  })
}

let currentRoute = null;

function navigateTo(route) {
  const validRoutes = ['login', 'chat', 'dashboard', 'insight'];
  if (!validRoutes.includes(route)) route = 'login';
  if (route === currentRoute) return;
  currentRoute = route;

  // Show/Hide Navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.display = route === 'login' ? 'none' : 'block';
  }

  // Update nav active state
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.route === route);
  });

  // Switch views with fade transition
  Object.keys(views).forEach(key => {
    const view = views[key];
    if (key === route) {
      view.style.display = 'block';
      
      if (route === 'login') {
        view.style.opacity = '1';
        view.style.transform = 'none';
        view.style.transition = 'none';
      } else {
        view.style.opacity = '0';
        view.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          view.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          view.style.opacity = '1';
          view.style.transform = 'translateY(0)';
        });
      }
      // Re-render dynamic pages on every visit to ensure fresh data
      if (key === 'dashboard') renderDashboard(view);
      if (key === 'insight') renderInsight(view);
    } else {
      view.style.display = 'none';
    }
  });

  // Sync URL hash (without triggering hashchange loop)
  if (window.location.hash !== `#${route}`) {
    history.replaceState(null, '', `#${route}`);
  }
}

// ── EVENT LISTENERS ─────────────────────────────
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const route = e.target.dataset.route || e.target.closest('a')?.dataset.route;
    if (route) navigateTo(route);
  });
});

window.addEventListener('hashchange', () => {
  const route = window.location.hash.replace('#', '') || 'login';
  navigateTo(route);
});

// ── LOGOUT ─────────────────────────────────────────
window.logout = () => {
  window.location.hash = 'login';
};

// ── INIT ─────────────────────────────────────────
initViews();
let initialRoute = window.location.hash.replace('#', '') || 'login';
if (initialRoute === 'welcome') initialRoute = 'login';
navigateTo(initialRoute);
