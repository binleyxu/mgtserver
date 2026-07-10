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
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
