export interface ParsedConnectionString {
  Endpoint: string;
  SharedAccessKeyName: string;
  SharedAccessKey: string;
  EntityPath?: string;
  [x: string]: any;
}

export function parseConnectionString(connectionString: string): ParsedConnectionString {
  return connectionString.split(';').reduce((acc, part) => {
    const splitIndex = part.indexOf('=');
    return {
      ...acc,
      [part.substring(0, splitIndex)]: part.substring(splitIndex + 1)
    };
  }, {} as any);
}
