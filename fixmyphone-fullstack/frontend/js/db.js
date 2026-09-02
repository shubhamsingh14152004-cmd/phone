// API Base URL resolution:
// - If explicitly set via window.API_BASE, use that.
// - When running via Vite (port 5173), relative '' uses Vite's proxy to backend.
// - When running via another static server on localhost, fallback to http://localhost:3000.
const API_BASE = (window.API_BASE !== undefined && window.API_BASE !== '')
  ? window.API_BASE
  : (window.location.port !== '3000' && window.location.port !== '5173' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : '');

const DB = { brands: null, services: null, prices: null, bookings: null, technicians: null, settings: null };
let ADMIN_SESSION = false;
let ADMIN_TOKEN = null;

async function apiGet(name) {
  const res = await fetch(`${API_BASE}/api/${name}`);
  if (!res.ok) throw new Error(`Failed to load ${name} (${res.status})`);
  return res.json();
}
async function apiPut(name, value) {
  const headers = { 'Content-Type': 'application/json' };
  if (ADMIN_TOKEN) headers['Authorization'] = 'Bearer ' + ADMIN_TOKEN;
  const res = await fetch(`${API_BASE}/api/${name}`, { method: 'PUT', headers, body: JSON.stringify(value) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(err.error || 'Request failed.');
  }
  return res.json();
}

async function initData() {
  const [brands, services, prices, bookings, technicians, settings] = await Promise.all([
    apiGet('brands'), apiGet('services'), apiGet('prices'), apiGet('bookings'), apiGet('technicians'), apiGet('settings')
  ]);
  DB.brands = brands;
  DB.services = services; SERVICES_SEED = services; // shared with frontend rendering code
  DB.prices = prices;
  DB.bookings = bookings;
  DB.technicians = technicians;
  DB.settings = settings;
}

async function persist(key) {
  try {
    await apiPut(key, DB[key]);
  } catch (e) {
    console.error('Failed to save', key, e);
    toast('Could not save changes to the server: ' + e.message);
  }
}
