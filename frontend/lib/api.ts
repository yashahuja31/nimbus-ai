const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type PlanStep = {
  id: string;
  operation: string;
  params_json: string;
  status: string;
};

export type Plan = {
  id: string;
  request_text: string;
  summary: string | null;
  terraform_hcl: string | null;
  risk_level: string;
  estimated_monthly_cost_usd: string;
  status: string;
  created_at: string;
  steps: PlanStep[];
};

export type ExecutionLog = {
  id: string;
  plan_id: string;
  step_id: string | null;
  level: string;
  message: string;
  created_at: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("nimbus_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("nimbus_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("nimbus_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof URLSearchParams)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  signup: (email: string, password: string) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),

  login: async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const data = await request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body,
    });
    setToken(data.access_token);
    return data;
  },

  chat: (message: string) =>
    request<Plan>("/chat", { method: "POST", body: JSON.stringify({ message }) }),

  listPlans: () => request<Plan[]>("/plans"),
  getPlan: (id: string) => request<Plan>(`/plans/${id}`),
  approvePlan: (id: string) => request<Plan>(`/plans/${id}/approve`, { method: "POST" }),
  rejectPlan: (id: string) => request<Plan>(`/plans/${id}/reject`, { method: "POST" }),

  listHistory: () => request<ExecutionLog[]>("/history"),

  connectAccount: (region: string) =>
    request("/cloud-accounts", {
      method: "POST",
      body: JSON.stringify({ provider: "aws", label: "default", region }),
    }),
  listAccounts: () => request("/cloud-accounts"),
};
