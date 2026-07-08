import { API_BASE_URL, API_PREFIX } from './config';

let _state = { accessToken: null, refreshToken: null, role: null };
let _onAuthChange = null;
let _refreshing = null;

export function setAuthState(state) {
  _state = { ..._state, ...state };
}

export function getAuthState() {
  return _state;
}

export function onAuthChange(handler) {
  _onAuthChange = handler;
}

function url(path) {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}

async function rawFetch(path, options = {}, withAuth = true) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (withAuth && _state.accessToken) {
    headers.Authorization = `Bearer ${_state.accessToken}`;
  }
  const res = await fetch(url(path), { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { ok: false, error: { code: 'BAD_RESPONSE', message: text } };
  }
  return { status: res.status, body };
}

async function tryRefresh() {
  if (!_state.refreshToken) return false;
  if (!_refreshing) {
    _refreshing = (async () => {
      const { status, body } = await rawFetch(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken: _state.refreshToken }) },
        false
      );
      if (status !== 200 || !body?.ok) return false;
      const { tokens, role } = body.data;
      _state.accessToken = tokens.accessToken;
      _state.refreshToken = tokens.refreshToken;
      _state.role = role;
      _onAuthChange?.(_state);
      return true;
    })().finally(() => {
      _refreshing = null;
    });
  }
  return _refreshing;
}

export async function apiRequest(path, options = {}, { auth = true, retry = true } = {}) {
  let { status, body } = await rawFetch(path, options, auth);
  if (status === 401 && retry && auth && _state.refreshToken) {
    const ok = await tryRefresh();
    if (ok) {
      ({ status, body } = await rawFetch(path, options, auth));
    } else {
      _onAuthChange?.({ accessToken: null, refreshToken: null, role: null });
    }
  }
  if (!body?.ok) {
    const err = new Error(body?.error?.message || `HTTP ${status}`);
    err.status = status;
    err.code = body?.error?.code;
    err.details = body?.error?.details;
    throw err;
  }
  return body.data;
}

export const api = {
  get: (path, opts) => apiRequest(path, { method: 'GET' }, opts),
  post: (path, body, opts) =>
    apiRequest(path, { method: 'POST', body: JSON.stringify(body || {}) }, opts),
  patch: (path, body, opts) =>
    apiRequest(path, { method: 'PATCH', body: JSON.stringify(body || {}) }, opts),
  delete: (path, opts) => apiRequest(path, { method: 'DELETE' }, opts),
};
