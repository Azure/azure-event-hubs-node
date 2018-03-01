
import { parseConnectionString } from "./rhea-promise";

export interface ConnectionConfig {
  endpoint: string;
  host: string;
  connectionString: string;
  entityPath?: string;
  sharedAccessKeyName: string;
  sharedAccessKey: string;
}

export namespace ConnectionConfig {
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
