const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type CardVerification = {
  valid: boolean;
  status: 'ACTIVE' | 'REDEEMED' | 'DISABLED' | 'EXPIRED' | 'NOT_FOUND';
  expiresAt: string | null;
};

export type InvitationTask = {
  id: string;
  email: string;
  status: 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerAccount = {
  id: string;
  label: string;
  status: 'ACTIVE' | 'PAUSED';
  capacityTotal: number;
  capacityUsed: number;
  pendingSlots: number;
  availableSlots: number;
};

type ApiErrorBody = { message?: string | string[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const message = Array.isArray(body.message) ? body.message.join('；') : body.message;
    throw new Error(message || `请求失败（${response.status}）`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  verifyCard: (code: string) =>
    request<CardVerification>('/v1/cards/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  createInvitation: (code: string, email: string) =>
    request<InvitationTask>('/v1/invitations', {
      method: 'POST',
      body: JSON.stringify({ code, email }),
    }),
  getInvitation: (id: string) => request<InvitationTask>(`/v1/invitations/${id}`),
  listOwners: (adminKey: string) =>
    request<OwnerAccount[]>('/v1/admin/owners', {
      headers: { 'x-admin-key': adminKey },
    }),
  createOwner: (adminKey: string, label: string, capacityTotal: number) =>
    request<OwnerAccount>('/v1/admin/owners', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ label, capacityTotal }),
    }),
  updateOwner: (
    adminKey: string,
    id: string,
    input: Partial<Pick<OwnerAccount, 'status' | 'capacityTotal'>>,
  ) =>
    request<OwnerAccount>(`/v1/admin/owners/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(input),
    }),
};
