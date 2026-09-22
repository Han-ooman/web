import { apiClient } from '@/infrastructure/api/api-client';

export interface ResetPasswordInput {
  token?: string;
  email?: string;
  code?: string;
  newPassword: string;
  signal?: AbortSignal;
}

export async function resetPassword(input: ResetPasswordInput): Promise<string> {
  const result = await apiClient<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      ...(input.token ? { token: input.token } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.code ? { code: input.code } : {}),
      new_password: input.newPassword,
    }),
    signal: input.signal,
  });
  return result.data.message;
}
