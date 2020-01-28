
export class ParserCsvLine {
    lineItems: string[]

    public static HEADER = 'protocol;randomToken;pushData;gatewayMac;json'

    constructor(line: string) {
        this.lineItems = line.split(';')
    }

    private fromHexString(hexString: string): Uint8Array {
        let twoCharsArray: string[] | null = hexString.match(/.{1,2}/g)

        if (twoCharsArray == null) {
            throw new Error("hexString empty")
        } else {
            return new Uint8Array(twoCharsArray.map(byte => parseInt(byte, 16)));
        }        
    }

    protocol: () => string    = () => this.lineItems[0]
    randomToken: () => string = () => this.lineItems[1]
    pushData: () => string    = () => this.lineItems[2]
    gatewayMac: () => string  = () => this.lineItems[3]
    json: () => string        = () => this.lineItems[4].endsWith(',') ? this.lineItems[4].slice(0, -1) : this.lineItems[4]
}

export class DecoderCsvLine extends ParserCsvLine {

    public static HEADER = ParserCsvLine.HEADER + 'deviceAddress;messageType;messageDirection;messageFrameCount;payloadPort;payloadData'

    constructor(line: string) {
        super(line)
    }

    deviceAddress: () => string = () => this.lineItems[5]
    messageType: () => string = () => this.lineItems[6]
    messageDirection: () => string = () => this.lineItems[7]
    messageFrameCount: () => string = () => this.lineItems[8]
    payloadPort: () => string = () => this.lineItems[9]
    payloadData: () => string = () => this.lineItems[10]
}