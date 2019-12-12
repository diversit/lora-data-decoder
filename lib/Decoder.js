"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var readline = __importStar(require("readline"));
// import * as loraPacket from 'lora-packet'
// const readline   = require('readline')
// const fs         = require('fs')
var loraPacket = require('lora-packet');
var colors = require('colors');
var Decoder = /** @class */ (function () {
    function Decoder() {
    }
    Decoder.prototype.decode = function (inputFile, cmdObj) {
        if (!inputFile) {
            console.warn(colors.red("input filename missing"));
        }
        if (cmdObj.quiet) {
            console.warn('Running quietly');
        }
        else {
            console.log("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json");
        }
        if (cmdObj.splitDevices) {
            if (fs.existsSync(cmdObj.out)) {
                if (cmdObj.clear) {
                    console.warn("Clearing output folder " + cmdObj.out);
                    var deleted = fs.readdirSync(cmdObj.out)
                        .map(function (file) {
                        // console.warn(`Delete ${file}`)
                        fs.unlinkSync(cmdObj.out + "/" + file);
                        return 1;
                    })
                        .reduce(function (a, b) { return a + b; }, 0);
                    console.warn("Removed " + deleted + " files from " + cmdObj.out);
                }
            }
            if (!fs.existsSync(cmdObj.out)) {
                console.warn("Creating folder " + cmdObj.out);
                fs.mkdirSync(cmdObj.out);
            }
        }
        if (cmdObj.destFile && fs.existsSync(cmdObj.destFile) && cmdObj.clear) {
            fs.unlinkSync(cmdObj.destFile);
            console.warn("Removed " + cmdObj.destFile);
        }
        var readInterface = readline.createInterface({
            input: fs.createReadStream(inputFile),
        });
        // Convert buffered hex values into a string
        function asHexString(buf) {
            if (buf) {
                return buf.toString('hex').toUpperCase();
            }
            else {
                return '';
            }
        }
        var processed = 0;
        console.warn('Start processing:');
        readInterface.on('line', function (line) {
            if (line != "[" && line != "]" && line != "{}") {
                var json = line.endsWith(',') ? line.slice(0, -1) : line;
                // console.log(`line:${json}`)
                var obj = JSON.parse(json);
                if (obj && obj.rxpk) {
                    var data = obj.rxpk[0].data;
                    // console.log(`data: ${data}`)
                    var packet = loraPacket.fromWire(Buffer.from(data, 'base64'));
                    // console.log(`packet toString: ${packet.toString()}`)
                    // console.log("packet MIC=" + asHexString(packet.getBuffers().MIC));
                    // console.log("FRMPayload=" + asHexString(packet.getBuffers().FRMPayload));
                    // console.log(`Message Type: ${packet.getMType()}`)
                    // console.log(`Direction: ${packet.getDir()}`)
                    // console.log(`FCnt: ${packet.getFCnt()}`)
                    // console.log(`FPort: ${packet.getFPort()}`)
                    // console.log(`Buffers: ${JSON.stringify(packet.getBuffers())}`)
                    // console.log(`isDataMessage: ${packet.isDataMessage()}`)
                    var msgType = packet.getMType();
                    var msgDirection = packet.getDir();
                    var msgFCnt = packet.getFCnt();
                    var payloadPort = packet.getFPort();
                    var payloadData = asHexString(packet.getBuffers().FRMPayload);
                    var deviceAddress = asHexString(packet.getBuffers().DevAddr);
                    var csvLine = deviceAddress + ";" + msgType + ";" + msgDirection + ";" + msgFCnt + ";" + payloadPort + ";" + payloadData + ";" + json;
                    if (!cmdObj.quiet) {
                        console.log(csvLine);
                    }
                    if (cmdObj.destFile) {
                        fs.appendFileSync(cmdObj.destFile, csvLine + '\n');
                    }
                    if (cmdObj.splitDevices) {
                        fs.appendFileSync(cmdObj.out + "/" + deviceAddress + ".out", csvLine + '\n');
                    }
                    processed++;
                }
            }
            process.stderr.write('.');
        });
        readInterface.on("close", function () {
            console.warn("Processed " + processed + " records");
        });
    };
    return Decoder;
}());
exports.Decoder = Decoder;
