import { Command } from 'commander'
import * as fs from 'fs'
import { factory } from "./Logging"
import { writeCsvData, writeJsonData, writeJsonArrayEnd } from './Utils'
import { ParserCsvLine } from './model/Csv'

const jsonArrayStreams = require('json-array-streams')

const PACKETS_CSV  = 'packets.csv'
const PACKETS_JSON = 'packets.json'
const log          = factory.getLogger("Sender")

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

        this.deleteIfFileExists(PACKETS_JSON)
        this.deleteIfFileExists(PACKETS_CSV)

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

                writeCsvData(ParserCsvLine.HEADER, PACKETS_CSV, csvLine)
                writeJsonData(PACKETS_JSON, json)

                process.stderr.write('.')
            })
            // Note: close is not called
            .on('end', () => {
                process.stderr.write('\n')
                log.info(`Done`)
                writeJsonArrayEnd(PACKETS_JSON)
            })
    }
}