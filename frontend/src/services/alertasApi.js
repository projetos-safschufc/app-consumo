/**
 * API de alertas de consumo (destinatários e envio manual)
 */

import { fetchJson } from './api.js';

const BASE = '/alertas-cons';
const ENVIAR = '/alertas/enviar-manual';

/** @param {boolean} includeInativos - se true, inclui destinatários inativos (GET ?ativo=false) */
export async function listAlertas(includeInativos = false) {
  const q = includeInativos ? '?ativo=false' : '';
  return fetchJson(BASE + q, { useCache: false });
}

export async function createAlerta(body) {
  const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api');
  const url = `${API_BASE}${BASE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Erro ${res.status}`);
  }
  return res.json();
}

export async function updateAlerta(id, body) {
  const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api');
  const url = `${API_BASE}${BASE}/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Erro ${res.status}`);
  }
  return res.json();
}

export async function deleteAlerta(id) {
  const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api');
  const url = `${API_BASE}${BASE}/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Erro ${res.status}`);
  }
}

export async function enviarAlertasManual() {
  const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api');
  const url = `${API_BASE}${ENVIAR}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Erro ${res.status}`);
  }
  return res.json();
}
