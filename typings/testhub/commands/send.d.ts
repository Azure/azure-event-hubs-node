/// <reference types="yargs" />
import { CommandBuilder } from "yargs";
export declare const command = "send";
export declare const describe = "Sends messages to an eventhub.";
export declare const builder: CommandBuilder;
export declare function handler(argv: any): Promise<void>;
