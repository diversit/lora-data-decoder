#!/usr/bin/env node

import { Decoder } from "./Decoder"
import { Command } from "commander"

const chalk      = require('chalk')
const clear      = require('clear')
const figlet     = require('figlet')
// const path       = require('path')
const program    = new Command()

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
    .usage('[command] [options]')

program
    .command('decode <input>')
    .option('--clear', 'Clean output file and/or folder. Use with -s', false)
    .option('-d, --dest-file <file>', 'Destination file for output for all devices.', undefined)
    .option('-o, --out <folder>', 'Output folder for files per device. Use with -s.', 'out')
    .option('-q, --quiet', 'Do not output csv records to console. Use with -s', false)
    .option('-s, --split-devices', 'Split output into separate output files per device address', false)
    .action((input: string, cmdObject: Command) => {
        new Decoder().decode(input, cmdObject)
    })

program.on('--help', () => {
    console.log('')
    console.log('More about commands:')
    console.log('  [command] -h')
})

program.parse(process.argv)

// If no options or inputFile, show help and exit
if (!process.argv.slice(2).length) {
    program.help()
}

// Verify inputFile
// if (!inputFile) {
//     console.warn(colors.red("input filename missing"))
// }

// // If no options or inputFile, show help and exit
// if (!process.argv.slice(2).length || !inputFile) {
//     program.help()
// }

// if (program.quiet) {
//     console.warn('Running quietly')
// } else {
//     console.log("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json")
// }

// if (program.splitDevices) {    
//     if (fs.existsSync(program.out)) {
//         if (program.clear) {
//             console.warn(`Clearing output folder ${program.out}`)
//             let deleted = fs.readdirSync(program.out)
//                 .map((file: string) => {
//                     // console.warn(`Delete ${file}`)
//                     fs.unlinkSync(program.out + "/" + file)
//                     return 1
//                 })
//                 .reduce((a: number, b: number) => a + b, 0)
//             console.warn(`Removed ${deleted} files from ${program.out}`)
//         }
//     }

//     if (!fs.existsSync(program.out)) {
//         console.warn(`Creating folder ${program.out}`)
//         fs.mkdirSync(program.out)
//     } 
// }

// if (program.destFile && fs.existsSync(program.destFile) && program.clear) {
//     fs.unlinkSync(program.destFile)
//     console.warn(`Removed ${program.destFile}`)
// }

// START OF PROGRAM
