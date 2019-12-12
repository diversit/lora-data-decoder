import * as fs from 'fs'
import * as readline from 'readline'
import { Command } from 'commander'

// import * as loraPacket from 'lora-packet'

// const readline   = require('readline')
// const fs         = require('fs')
const loraPacket = require('lora-packet')
const colors     = require('colors')

export class Decoder {

    decode(inputFile: string, cmdObj: Command): void {

        if (!inputFile) {
            console.warn(colors.red("input filename missing"))
        }
                
        if (cmdObj.quiet) {
            console.warn('Running quietly')
        } else {
            console.log("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json")
        }
        
        if (cmdObj.splitDevices) {    
            if (fs.existsSync(cmdObj.out)) {
                if (cmdObj.clear) {
                    console.warn(`Clearing output folder ${cmdObj.out}`)
                    let deleted = fs.readdirSync(cmdObj.out)
                        .map((file: string) => {
                            // console.warn(`Delete ${file}`)
                            fs.unlinkSync(cmdObj.out + "/" + file)
                            return 1
                        })
                        .reduce((a: number, b: number) => a + b, 0)
                    console.warn(`Removed ${deleted} files from ${cmdObj.out}`)
                }
            }
        
            if (!fs.existsSync(cmdObj.out)) {
                console.warn(`Creating folder ${cmdObj.out}`)
                fs.mkdirSync(cmdObj.out)
            } 
        }
        
        if (cmdObj.destFile && fs.existsSync(cmdObj.destFile) && cmdObj.clear) {
            fs.unlinkSync(cmdObj.destFile)
            console.warn(`Removed ${cmdObj.destFile}`)
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
        
        console.warn('Start processing:')

        readInterface.on('line', (line: string) => {
            if (line != "[" && line != "]" && line != "{}") {
                let json = line.endsWith(',') ? line.slice(0, -1) : line

                // console.log(`line:${json}`)
        
                let obj = JSON.parse(json)
                if (obj && obj.rxpk) {
                    let data = obj.rxpk[0].data;
                    // console.log(`data: ${data}`)
        
                    let packet = loraPacket.fromWire(Buffer.from(data, 'base64'))
                    // console.log(`packet toString: ${packet.toString()}`)
        
                    // console.log("packet MIC=" + asHexString(packet.getBuffers().MIC));
                    // console.log("FRMPayload=" + asHexString(packet.getBuffers().FRMPayload));
                    // console.log(`Message Type: ${packet.getMType()}`)
                    // console.log(`Direction: ${packet.getDir()}`)
                    // console.log(`FCnt: ${packet.getFCnt()}`)
                    // console.log(`FPort: ${packet.getFPort()}`)
                    // console.log(`Buffers: ${JSON.stringify(packet.getBuffers())}`)
                    // console.log(`isDataMessage: ${packet.isDataMessage()}`)
        
                    let msgType = packet.getMType()
                    let msgDirection = packet.getDir()
                    let msgFCnt = packet.getFCnt()
                    let payloadPort = packet.getFPort()
                    let payloadData = asHexString(packet.getBuffers().FRMPayload)
                    let deviceAddress = asHexString(packet.getBuffers().DevAddr)
                    
                    let csvLine = `${deviceAddress};${msgType};${msgDirection};${msgFCnt};${payloadPort};${payloadData};${json}`
        
                    if (!cmdObj.quiet) {
                        console.log(csvLine)
                    }
        
                    if (cmdObj.destFile) {
                        fs.appendFileSync(cmdObj.destFile, csvLine + '\n')
                    }
        
                    if (cmdObj.splitDevices) {
                        fs.appendFileSync(`${cmdObj.out}/${deviceAddress}.out`, csvLine + '\n')
                    }
        
                    processed++
                }
            }

            process.stderr.write('.')
        })
        
        readInterface.on("close", () => {
            console.warn(`Processed ${processed} records`)
        })        
    }
}