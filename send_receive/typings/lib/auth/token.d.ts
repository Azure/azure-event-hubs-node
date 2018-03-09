export declare enum TokenType {
    cbsTokenTypeJwt = "jwt",
    cbsTokenTypeSas = "servicebus.windows.net:sastoken",
}
export interface TokenInfo {
    tokenType: TokenType;
    token: string;
    expiry: number;
}
export interface TokenProvider {
    /**
     * @property {number} tokenRenewalMarginInSeconds - The number of seconds within which it is good to renew the token. Default = 900 seconds (15 minutes).
     */
    tokenRenewalMarginInSeconds: number;
    /**
     * @property {number} tokenValidTimeInSeconds - The number of seconds for which the token is valid. Default = 3600 seconds (1 hour).
     */
    tokenValidTimeInSeconds: number;
    /**
     * Gets the token.
     * @param {string} [audience] - The audience for which the token is desired.
     */
    getToken(audience?: string): TokenInfo;
}
