import { Command } from 'commander';
export declare class Parser {
    private deleteIfFileExists;
    /**
     * Stream from input file and parse json streaming.
     * Retrieve the data field and get all elements from it.
     * Write to 'packets.json' in format `decoder` supports.
     * Write to 'packets.csv' in csv format to be used for resending udp packets.
     * @param inputFile
     * @param cmdObj
     */
    parse(inputFile: string, cmdObj: Command): void;
}
