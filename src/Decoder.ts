import * as fs from 'fs'
import * as readline from 'readline'
import { Command } from 'commander'
import { factory } from "./Logging"
import { DecoderCsvLine, ParserCsvLine } from "./model/Csv"
import { writeCsvData, writeJsonData, writeJsonArrayEnd } from './Utils'

const loraPacket = require('lora-packet')
const colors     = require('colors')
const log        = factory.getLogger("Sender")

export class Decoder {

    private writeData(csvLine: string, deviceAddress: string, json: string, cmdObj: Command): void {
        if (!cmdObj.quiet) {
            log.info(csvLine)
        }

        if (cmdObj.destFile) {
            writeCsvData(DecoderCsvLine.HEADER, cmdObj.destFile, csvLine)
        }

        if (cmdObj.splitDevices) {
            writeCsvData(DecoderCsvLine.HEADER, `${cmdObj.out}/${deviceAddress}.csv`, csvLine)            
            writeJsonData(`${cmdObj.out}/${deviceAddress}.json`, json)
        }
    }

    decode(inputFile: string, cmdObj: Command): void {

        if (!inputFile) {
            log.warn(colors.red("input filename missing"))
        }
                
        if (cmdObj.quiet) {
            log.warn('Running quietly')
        } else {
            log.info("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json")
        }

        var filterEnabled = false
        var filter: Array<string> = []
        if (cmdObj.filter && cmdObj.filter.length > 0) {
            filterEnabled = true
            filter = cmdObj.filter.split(',')
            log.warn(`Device filter on: ${filter}`)
        } else {
            log.warn('Device filter off')
        }
        
        if (cmdObj.splitDevices) {    
            if (fs.existsSync(cmdObj.out)) {
                if (cmdObj.clear) {
                    log.warn(`Clearing output folder ${cmdObj.out}`)
                    let deleted = fs.readdirSync(cmdObj.out)
                        .map((file: string) => {
                            // console.warn(`Delete ${file}`)
                            fs.unlinkSync(cmdObj.out + "/" + file)
                            return 1
                        })
                        .reduce((a: number, b: number) => a + b, 0)
                        log.warn(`Removed ${deleted} files from ${cmdObj.out}`)
                }
            }
        
            if (!fs.existsSync(cmdObj.out)) {
                log.warn(`Creating folder ${cmdObj.out}`)
                fs.mkdirSync(cmdObj.out)
            } 
        }
        
        if (cmdObj.destFile && fs.existsSync(cmdObj.destFile) && cmdObj.clear) {
            fs.unlinkSync(cmdObj.destFile)
            log.warn(`Removed ${cmdObj.destFile}`)
        }

        const readInterface = readline.createInterface({
            input: fs.createReadStream(inputFile),
            // output: process.stdout,
            // console: false
        })
        
        // Convert buffered hex values into a string
        function asHexString(buf: Buffer): string {
            if (buf) {
                return buf.toString('hex').toUpperCase();
            } else {
                return ''
            }
        }
        
        var processed = 0
        var recordsWritten = 0
        
        log.info('Start processing:')

        readInterface.on('line', (line: string) => {
            if (line != "[" && line != "]" && line != "{}" && !line.startsWith(ParserCsvLine.HEADER)) {
                let csvLine = this.parseLine(line)
                // let json = line.endsWith(',') ? line.slice(0, -1) : line

                // console.log(`line:${json}`)
        
                let obj = JSON.parse(csvLine.json())
                if (obj && obj.rxpk) {
                    let data = obj.rxpk[0].data;
        
                    let packet = loraPacket.fromWire(Buffer.from(data, 'base64'))
        
                    let msgType = packet.getMType()
                    let msgDirection = packet.getDir()
                    let msgFCnt = packet.getFCnt()
                    let payloadPort = packet.getFPort()
                    let payloadData = asHexString(packet.getBuffers().FRMPayload)
                    let deviceAddress = asHexString(packet.getBuffers().DevAddr)
                    
                    let csvLineOut = `${line};${deviceAddress};${msgType};${msgDirection};${msgFCnt};${payloadPort};${payloadData}`
        
                    // if filtering, only write when deviceAddress in filter
                    if (filterEnabled && filter.includes(deviceAddress)) {
                        this.writeData(csvLineOut, deviceAddress, csvLine.json(), cmdObj)
                        recordsWritten++
                    }
                    // if not filtering, write everything
                    if (!filterEnabled) {
                        this.writeData(csvLineOut, deviceAddress, csvLine.json(), cmdObj)
                        recordsWritten++
                    }
        
                    processed++
                }
            }

            process.stderr.write('.')
        })
        
        readInterface.on("close", () => {
            log.info(`Processed ${processed} records, written ${recordsWritten} records`)
            if (cmdObj.splitDevices) {
                writeJsonArrayEnd(cmdObj.out)
            }
        })        
    }

    private parseLine(line: string): ParserCsvLine {
        return new ParserCsvLine(line)
    }
}
