export type TokenPayload = {
  sub: string; // userUUID
  email: string;
  exp: number; // expiration
  iat: number; // issued at
};

export type EncryptedToken = {
  token: string;
  exp: number;
};
