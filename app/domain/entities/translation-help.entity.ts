export interface TranslationHelpPublicImage {
  public_url: string;
}

export type TranslationHelpReplyStatus = 'published' | 'taken_down' | 'deleted_by_author';

export interface TranslationHelpReply {
  id: string;
  user_id: string;
  username: string | null;
  body: string | null;
  status: TranslationHelpReplyStatus;
  is_verifier: boolean;
  is_pinned: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface TranslationHelpPublicItem {
  id: string;
  user_id: string;
  username: string | null;
  body: string | null;
  images: TranslationHelpPublicImage[];
  status: 'published';
  pinned_reply_id: string | null;
  upvotes: number;
  created_at: string;
}

export interface TranslationHelpPublicDetail extends TranslationHelpPublicItem {
  replies: TranslationHelpReply[];
}
