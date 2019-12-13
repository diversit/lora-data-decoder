#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Decoder_1 = require("./Decoder");
var commander_1 = require("commander");
var Parser_1 = require("./Parser");
var chalk = require('chalk');
var clear = require('clear');
var figlet = require('figlet');
// const path       = require('path')
var program = new commander_1.Command();
// Program header
clear();
console.log(chalk.red(figlet.textSync('lora-data-decoder', { horizontalLayout: 'full' })));
// Program options and arguments
program
    .name('lora-data-decoder')
    .version('0.1')
    .description("A tool for decoding Lora data packets into csv records with a device address")
    .usage('[command] [options]');
program
    .command('decode <input>')
    .description('Decode LoRa data packets and output result in cvs format in single file or file per device address.')
    .option('--clear', 'Clean output file and/or folder. Use with -s', false)
    .option('-d, --dest-file <file>', 'Destination file for output for all devices.', undefined)
    .option('-f, --filter <deviceIdArray>', 'One or multiple device id\'s (comma separated) to filter for. Others will be ignored', '')
    .option('-o, --out <folder>', 'Output folder for files per device. Use with -s.', 'out')
    .option('-q, --quiet', 'Do not output csv records to console. Use with -s', false)
    .option('-s, --split-devices', 'Split output into separate output files per device address', false)
    .action(function (input, cmdObject) {
    new Decoder_1.Decoder().decode(input, cmdObject);
});
program
    .command('prepare <json>')
    .description('Prepare pcap-json file (Wireshark: open pcap file, export Packet Dissections As Json) for data parsing')
    .action(function (input, cmdObject) {
    new Parser_1.Parser().parse(input, cmdObject);
});
program.on('--help', function () {
    console.log('');
    console.log('View command options:');
    console.log('  [command] -h');
});
program.parse(process.argv);
// If no options or inputFile, show help and exit
if (!process.argv.slice(2).length) {
    program.help();
}
