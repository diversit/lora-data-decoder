import { Command } from 'commander'
import * as fs from 'fs'
import { factory } from "./Logging"

const jsonArrayStreams = require('json-array-streams')

const PACKETS_OUT = 'packets.csv'
const PACKETS_LOG = 'packets.json'
const log         = factory.getLogger("Sender")

export class Parser {

    private deleteIfFileExists(filename: string): void {
        if (fs.existsSync(filename)) {
            log.warn(`Removing ${filename}`)
            fs.unlinkSync(filename)
        }
    }

    /**
     * Stream from input file and parse json streaming.
     * Retrieve the data field and get all elements from it.
     * Write to 'packets.json' in format `decoder` supports.
     * Write to 'packets.csv' in csv format to be used for resending udp packets.
     * @param inputFile 
     * @param cmdObj 
     */
    parse(inputFile: string, cmdObj: Command): void {

        this.deleteIfFileExists(PACKETS_LOG)
        this.deleteIfFileExists(PACKETS_OUT)

        log.info('Start processing:')

        fs.createReadStream(inputFile)
            .pipe(jsonArrayStreams.parse())
            .on('data', (jsonObj: any) => {

                let data: string = jsonObj._source.layers.data["data.data"]
                let hexString = data.replace(/:/g,'')

                let protocol = hexString.substr(0, 2)
                let randomToken = hexString.substr(2,4)
                let dataType    = hexString.substr(6,2)
                let gatewayId   = hexString.substr(8,16)
                let payload     = hexString.substr(24)

                let json = Buffer.from(payload, 'hex').toString()

                let csvLine = `${protocol};${randomToken};${dataType};${gatewayId};${json}`
                fs.appendFileSync(PACKETS_OUT, csvLine + ',\n')
                fs.appendFileSync(PACKETS_LOG, json + '\n')

                process.stderr.write('.')
            })
            // Note: close is not called
            .on('end', () => {
                process.stderr.write('\n')
                log.info(`Done`)
            })
    }
}