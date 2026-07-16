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

type TokenGetter = () => Promise<string | null>;

/**
 * Every call fetches a fresh Clerk session token rather than storing one --
 * Clerk rotates these short-lived tokens under the hood, so there is no
 * "log in once, keep a token" step for this API client to manage.
 */
export function createNimbusApi(getToken: TokenGetter) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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

  return {
    chat: (message: string) =>
      request<Plan>("/chat", { method: "POST", body: JSON.stringify({ message }) }),

    listPlans: (limit = 50, offset = 0) =>
      request<Plan[]>(`/plans?limit=${limit}&offset=${offset}`),
    getPlan: (id: string) => request<Plan>(`/plans/${id}`),
    approvePlan: (id: string) => request<Plan>(`/plans/${id}/approve`, { method: "POST" }),
    rejectPlan: (id: string) => request<Plan>(`/plans/${id}/reject`, { method: "POST" }),

    listHistory: (limit = 50, offset = 0) =>
      request<ExecutionLog[]>(`/history?limit=${limit}&offset=${offset}`),

    connectAccount: (region: string) =>
      request("/cloud-accounts", {
        method: "POST",
        body: JSON.stringify({ provider: "aws", label: "default", region }),
      }),
    listAccounts: () => request("/cloud-accounts"),

    me: () => request<{ id: string; email: string | null }>("/auth/me"),
  };
}

export type NimbusApi = ReturnType<typeof createNimbusApi>;
