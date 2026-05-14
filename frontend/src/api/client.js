const API_URL = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("token");
}

async function fetcher(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
    register: (body) =>
      fetcher("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body) =>
      fetcher("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  user: {
    me: () => fetcher("/api/user/me"),
    leaderboard: () => fetcher("/api/user/leaderboard"),
  },
  lessons: {
    list: (language) =>
      fetcher(`/api/lessons${language ? `?language=${language}` : ""}`),
    get: (id) => fetcher(`/api/lessons/${id}`),
    complete: (id) =>
      fetcher(`/api/lessons/${id}/complete`, { method: "POST" }),
  },
  prizes: {
    list: () => fetcher("/api/prizes"),
    redeem: (id) => fetcher(`/api/prizes/redeem/${id}`, { method: "POST" }),
    myRedemptions: () => fetcher("/api/prizes/redemptions"),
  },
  admin: {
    stats: () => fetcher("/api/admin/stats"),
    users: (search) =>
      fetcher(
        `/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ),
    updateUser: (id, body) =>
      fetcher(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteUser: (id) => fetcher(`/api/admin/users/${id}`, { method: "DELETE" }),
    lessons: () => fetcher("/api/admin/lessons"),
    prizes: () => fetcher("/api/admin/prizes"),
    createPrize: (body) =>
      fetcher("/api/admin/prizes", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updatePrize: (id, body) =>
      fetcher(`/api/admin/prizes/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    deletePrize: (id) =>
      fetcher(`/api/admin/prizes/${id}`, { method: "DELETE" }),
    redemptions: () => fetcher("/api/admin/redemptions"),
    updateRedemption: (id, body) =>
      fetcher(`/api/admin/redemptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
};
