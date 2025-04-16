// Type definitions for Prisma models

export interface Exchange {
  exchange_id: string;
  exchange_name: string;
  api_base_url?: string | null;
  ws_base_url?: string | null;
  is_active: boolean;
  userApiKeys?: UserApiKey[];
}

export interface UserApiKey {
  api_key_id: string;
  user_id: string;
  exchange_id: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  key_nickname?: string | null;
  permissions?: any | null;
  created_at: Date;
  updated_at: Date;
  is_valid?: boolean | null;
  user?: User;
  exchange?: Exchange;
}

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  user_name: string;
  full_name?: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date | null;
  is_active: boolean;
  email_verified: boolean;
  reset_token?: string | null;
  reset_token_expiry?: Date | null;
  apiKeys?: UserApiKey[];
}
