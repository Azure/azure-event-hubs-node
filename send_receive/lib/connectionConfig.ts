
import { parseConnectionString } from "./util/utils";

export interface ConnectionConfig {
  /**
   * @property {string} endpoint - The service bus endpoint "sb://<yournamespace>.servicebus.windows.net/".
   */
  endpoint: string;
  /**
   * @property {string} host - The host "<yournamespace>.servicebus.windows.net".
   */
  host: string;
  /**
   * @property {string} connectionString - The connection string.
   */
  connectionString: string;
  /**
   * @property {string} entityPath - The name/path of the entity (hub name) to which the connection needs to happen.
   */
  entityPath?: string;
  /**
   * @property {string} sharedAccessKeyName - The name of the access key.
   */
  sharedAccessKeyName: string;
  /**
   * @property {string} sharedAccessKey - The secret value of the access key.
   */
  sharedAccessKey: string;
}

export namespace ConnectionConfig {
  /**
   * Creates the connection config.
   * @param {string} connectionString - The event hub connection string
   * @param {string} [path]           - The name/path of the entity (hub name) to which the connection needs to happen
   */
  export function create(connectionString: string, path?: string): ConnectionConfig {
    const parsedCS = parseConnectionString(connectionString);
    if (!path && !parsedCS.EntityPath) {
      throw new Error(`Either provide "path" or the "connectionString": "${connectionString}", must contain EntityPath="<path-to-the-entity>".`);
    }
    const result: ConnectionConfig = {
      connectionString: connectionString,
      endpoint: parsedCS.Endpoint,
      host: (parsedCS.Endpoint.match('sb://([^/]*)') || [])[1],
      entityPath: path || parsedCS.EntityPath,
      sharedAccessKeyName: parsedCS.SharedAccessKeyName,
      sharedAccessKey: parsedCS.SharedAccessKey
    };
    return result;
  }
}
