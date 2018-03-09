export interface ParsedConnectionString {
    Endpoint: string;
    SharedAccessKeyName: string;
    SharedAccessKey: string;
    EntityPath?: string;
    [x: string]: any;
}
export declare function parseConnectionString(connectionString: string): ParsedConnectionString;
