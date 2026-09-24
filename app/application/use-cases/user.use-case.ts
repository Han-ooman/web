import type { PublicProfile } from '@/domain/entities/user.entity';
import { apiClient } from '@/infrastructure/api/api-client';

export async function getPublicProfile(
  username: string,
  signal?: AbortSignal,
): Promise<PublicProfile> {
  const res = await apiClient<PublicProfile>(
    `/users/${encodeURIComponent(username)}`,
    { signal },
  );
  return res.data;
}
