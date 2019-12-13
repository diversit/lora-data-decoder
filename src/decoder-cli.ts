#!/usr/bin/env node

import { Decoder } from "./Decoder"
import { Command } from "commander"
import { Parser } from "./Parser"

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
    .description('Decode LoRa data packets and output result in cvs format in single file or file per device address.')
    .option('--clear', 'Clean output file and/or folder. Use with -s', false)
    .option('-d, --dest-file <file>', 'Destination file for output for all devices.', undefined)
    .option('-f, --filter <deviceIdArray>', 'One or multiple device id\'s (comma separated) to filter for. Others will be ignored', '')
    .option('-o, --out <folder>', 'Output folder for files per device. Use with -s.', 'out')
    .option('-q, --quiet', 'Do not output csv records to console. Use with -s', false)
    .option('-s, --split-devices', 'Split output into separate output files per device address', false)
    .action((input: string, cmdObject: Command) => {
        new Decoder().decode(input, cmdObject)
    })

program
    .command('prepare <json>')
    .description('Prepare pcap-json file (Wireshark: open pcap file, export Packet Dissections As Json) for data parsing')
    .action((input: string, cmdObject: Command) => {
        new Parser().parse(input, cmdObject)
    })

program.on('--help', () => {
    console.log('')
    console.log('View command options:')
    console.log('  [command] -h')
})

program.parse(process.argv)

// If no options or inputFile, show help and exit
if (!process.argv.slice(2).length) {
    program.help()
}
