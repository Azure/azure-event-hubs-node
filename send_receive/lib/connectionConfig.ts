
import { parseConnectionString, ParsedConnectionString } from "./rhea-promise";

export class ConnectionConfig {
  endpoint: string;
  host: string;
  connectionString: string;
  entityPath?: string;
  sharedAccessKeyName: string;
  sharedAccessKey: string;

  constructor(connectionString: string, path?: string) {
    this.connectionString = connectionString;
    const parsedCS = parseConnectionString(connectionString);
    this.endpoint = parsedCS.Endpoint;
    this.host = (this.endpoint.match('sb://([^/]*)') || [])[1];
    if (!path && !parsedCS.EntityPath) {
      throw new Error(`Either provide "path" or the "connectionString": "${connectionString}", must contain EntityPath="<path-to-the-entity>".`);
    }
    this.entityPath = path || parsedCS.EntityPath;
    this.sharedAccessKeyName = parsedCS.SharedAccessKeyName;
    this.sharedAccessKey = parsedCS.SharedAccessKey;
  }
}