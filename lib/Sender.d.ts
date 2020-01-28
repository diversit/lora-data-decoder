import { Command } from 'commander';
export declare class Sender {
    private fromHexString;
    sendPackets(inputFile: string, cmdObj: Command): void;
    private parseLineToUint8Array;
    private sendUdpPacket;
}
