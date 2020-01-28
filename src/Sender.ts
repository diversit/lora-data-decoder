import * as fs from 'fs'
import * as dgram from 'dgram'
import { Command } from 'commander'
import * as utils from './Utils'
import { factory } from "./Logging"
import * as es from 'event-stream'

const colors = require('colors')
const log    = factory.getLogger("Sender")

export class Sender {

    private fromHexString(hexString: string): Uint8Array {
        let twoCharsArray: string[] | null = hexString.match(/.{1,2}/g)

        if (twoCharsArray == null) {
            throw new Error("hexString empty")
        } else {
            return new Uint8Array(twoCharsArray.map(byte => parseInt(byte, 16)));
        }        
    }

    sendPackets(inputFile: string, cmdObj: Command): void {

        if (!inputFile) {
            log.warn(colors.red("input filename missing"))
        }

        let host: string = cmdObj.target
        let port: number = cmdObj.port
        let delay: number = cmdObj.delay
        log.info(`Start sending to ${host}:${port} with delay ${delay} millis:`)

        const client: dgram.Socket = dgram.createSocket('udp4')
        var counter = 0
        
        let s = fs.createReadStream(inputFile)
            .pipe(es.split())
            .pipe(es.filterSync((line: string) => {
                return line.trim() != '' // filter out empty lines
            }))
            .pipe(es.mapSync((line: string) => this.parseLineToUint8Array(line)))
            .pipe(es.mapSync(async (bytes: Uint8Array) => {
                process.stderr.write('.')

                // pause the readstream
                log.debug(`Process bytes`)
                s.pause()
                log.debug(`Paused stream`)

                // send udp packet
                await this.sendUdpPacket(client, host, port, bytes)
                    .then(() => {
                        log.debug(`Sleep for ${delay} millis`)
                        utils.msleep(delay)
                        log.debug(`Continue..`)
                        counter += 1
                        s.resume()
                    })
                // resume when udp packet has been send
            }))
            .on('error', (err: Error) => {
                log.error(`Error while processing file`, err)
            })
            .on('end', () => {
                process.stderr.write('\n')
                log.info(`Finished processing file. Send ${counter} packets`)
                client.close()
            })
    }

    private parseLineToUint8Array(line: string): Uint8Array {
        log.debug(`parse line: ${line}`)

        let lineItems: Array<string> = line.split(';')
        
        // get individual parts
        let protocol    = this.fromHexString(lineItems[0])
        let randomToken = this.fromHexString(lineItems[1])
        let pushData    = this.fromHexString(lineItems[2])
        let gatewayMac  = this.fromHexString(lineItems[3])
        let jsonPacket  = new TextEncoder().encode(lineItems[4].slice(0, -1)) // remove trailing comma

        log.debug(`${protocol}${randomToken}${pushData}${gatewayMac}${jsonPacket}`)

        // copy all arrays into 1
        let int8Array = Uint8Array.from([
            ...protocol,
            ...randomToken,
            ...pushData,
            ...gatewayMac,
            ...jsonPacket])

        return int8Array
    }

    private sendUdpPacket(client: dgram.Socket, host: string, port: number, bytes: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            client.send(bytes, port, host, async (err: Error | null, bytes: number) => {
                if (err) {
                    log.error(`Error sending UDP: ${err.message}`)
                } else {
                    log.debug(`Send bytes: ${bytes}`)
                }
                resolve()
            })
        })
    }
}
