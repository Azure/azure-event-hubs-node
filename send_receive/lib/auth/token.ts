export enum TokenType {
  cbsTokenTypeJwt = "jwt",
  cbsTokenTypeSas = "servicebus.windows.net:sastoken"
}

export interface Token {
  tokenType: TokenType;
  token: string;
  expiry: string | number | Date;
}

export interface TokenProvider {
  getToken(audience?: string): Token;
}
