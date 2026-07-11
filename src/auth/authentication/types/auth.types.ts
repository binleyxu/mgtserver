export interface AdminLoginRequest {
  username: string;
  password: string;
  human_token?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_at?: number;
  expires_in?: number;
  warning_before_seconds?: number;
  server_time?: number;
}

export interface AdminSessionMeta {
  expires_at?: number;
  expires_in?: number;
  warning_before_seconds?: number;
  server_time?: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
