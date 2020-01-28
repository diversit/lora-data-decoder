export declare class ParserCsvLine {
    lineItems: string[];
    static HEADER: string;
    constructor(line: string);
    private fromHexString;
    protocol: () => string;
    randomToken: () => string;
    pushData: () => string;
    gatewayMac: () => string;
    json: () => string;
}
export declare class DecoderCsvLine extends ParserCsvLine {
    static HEADER: string;
    constructor(line: string);
    deviceAddress: () => string;
    messageType: () => string;
    messageDirection: () => string;
    messageFrameCount: () => string;
    payloadPort: () => string;
    payloadData: () => string;
}
