const API_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

async function fetcher(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  auth: {
    register: (body) => fetcher('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  user: {
    me: () => fetcher('/api/user/me'),
    leaderboard: () => fetcher('/api/user/leaderboard'),
  },
  lessons: {
    list: (language) => fetcher(`/api/lessons${language ? `?language=${language}` : ''}`),
    get: (id) => fetcher(`/api/lessons/${id}`),
    complete: (id) => fetcher(`/api/lessons/${id}/complete`, { method: 'POST' }),
  },
};
