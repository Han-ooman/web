export interface PublicProfile {
  username: string;
  display_name: string;
  bio: string | null;
  role: string;
  is_verifier: boolean;
  joined_at: string;
  avatar_url: string | null;
  stats: {
    contributions_approved: number;
    verifications_done: number;
    comments_published: number;
  };
}
