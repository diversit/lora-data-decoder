#!/usr/bin/env node

const chalk      = require('chalk')
const clear      = require('clear')
const figlet     = require('figlet')
const path       = require('path')
const program    = require('commander')
const colors     = require('colors')
const readline   = require('readline')
const fs         = require('fs')
const loraPacket = require('lora-packet')

var inputFile = undefined

// Program header
clear()
console.log(
  chalk.red(
    figlet.textSync('lora-data-decoder', { horizontalLayout: 'full' })
  )
)

// Program options and arguments
program
    .name('lora-data-decoder')
    .version('0.1')
    .description("A tool for decoding Lora data packets into csv records with a device address")
    .arguments('<input-file>')
    .action((input: string) => {
        inputFile = input
    })
    .option('--clear', 'Clean output file and/or folder. Use with -s', false)
    .option('-d, --dest-file <file>', 'Destination file for output for all devices.', undefined)
    .option('-o, --out <folder>', 'Output folder for files per device. Use with -s.', 'out')
    .option('-q, --quiet', 'Do not output csv records to console. Use with -s', false)
    .option('-s, --split-devices', 'Split output into separate output files per device address', false)
    .parse(process.argv)

// Verify inputFile
if (!inputFile) {
    console.warn(colors.red("input filename missing"))
}

// If no options or inputFile, show help and exit
if (!process.argv.slice(2).length || !inputFile) {
    program.help()
}

if (program.quiet) {
    console.warn('Running quietly')
} else {
    console.log("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json")
}

if (program.splitDevices) {    
    if (fs.existsSync(program.out)) {
        if (program.clear) {
            console.warn(`Clearing output folder ${program.out}`)
            let deleted = fs.readdirSync(program.out)
                .map((file: string) => {
                    // console.warn(`Delete ${file}`)
                    fs.unlinkSync(program.out + "/" + file)
                    return 1
                })
                .reduce((a: number, b: number) => a + b, 0)
            console.warn(`Removed ${deleted} files from ${program.out}`)
        }
    }

    if (!fs.existsSync(program.out)) {
        console.warn(`Creating folder ${program.out}`)
        fs.mkdirSync(program.out)
    } 
}

if (program.destFile && fs.existsSync(program.destFile) && program.clear) {
    fs.unlinkSync(program.destFile)
    console.warn(`Removed ${program.destFile}`)
}

// START OF PROGRAM

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

readInterface.on('line', (line: string) => {
    if (line != "[" && line != "]" && line != "{}") {
        let json = line.slice(0, -1)
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

            if (!program.quiet) {
                console.log(csvLine)
            }

            if (program.destFile) {
                fs.appendFileSync(program.destFile, csvLine + '\n')
            }

            if (program.splitDevices) {
                fs.appendFileSync(`${program.out}/${deviceAddress}.out`, csvLine + '\n')
            }

            processed++
        }
    }
})

readInterface.on("close", () => {
    console.warn(`Processed ${processed} records`)
})