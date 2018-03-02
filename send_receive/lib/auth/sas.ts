import * as TokenUtils from "./token";
import * as crypto from "crypto";
import { parseConnectionString } from "../rhea-promise";

/**
 * @class SasTokenProvider
 * Defines the SasTokenProvider.
 */
export class SasTokenProvider implements TokenUtils.TokenProvider {
  /**
   * @property {string} namespace - The namespace of the EventHub instance.
   */
  namespace: string;

  /**
   * @property {string} keyName - The name of the EventHub key.
   */
  keyName: string;

  /**
   * @property {string} key - The secret value associated with the above EventHub key
   */
  key: string;

  /**
   * Initializes a new isntance of SasTokenProvider
   * @constructor
   * @param {string} namespace - The namespace of the EventHub instance.
   * @param {string} keyName - The name of the EventHub key.
   * @param {string} key - The secret value associated with the above EventHub key
   */
  constructor(namespace: string, keyName: string, key: string) {
    this.namespace = namespace;
    this.keyName = keyName;
    this.key = key;
  }

  /**
   * Gets the sas token for the specified audience
   * @param {string} [audience] - The audience for which the token is desired. If not
   * provided then the Endpoint from the connection string will be applied.
   */
  getToken(audience?: string): TokenUtils.Token {
    return this._createToken(Math.floor((Date.now() + 3600000) / 1000), audience);
  }

  /**
   * Creates the sas token based on the provided information
   * @param {string | number} expiry - The time period in unix time after which the token will expire.
   * @param {string} [audience] - The audience for which the token is desired. If not
   * provided then the Endpoint from the connection string will be applied.
   */
  private _createToken(expiry: number | string, audience?: string): TokenUtils.Token {
    if (!audience) audience = this.namespace;
    audience = encodeURIComponent(audience);
    const keyName = encodeURIComponent(this.keyName);
    const stringToSign = audience + '\n' + expiry;
    const sig = encodeURIComponent(crypto.createHmac('sha256', this.key).update(stringToSign, 'utf8').digest('base64'));
    return {
      token: `SharedAccessSignature sr=${audience}&sig=${sig}&se=${expiry}&skn=${keyName}`,
      tokenType: TokenUtils.TokenType.cbsTokenTypeSas,
      expiry: expiry
    };
  }

  /**
   *
   * @param {string} connectionString - The EventHub connection string
   */
  static fromConnectionString(connectionString: string): SasTokenProvider {
    let parsed = parseConnectionString(connectionString);
    return new SasTokenProvider(parsed.Endpoint, parsed.SharedAccessKeyName, parsed.SharedAccessKey);
  }
}
