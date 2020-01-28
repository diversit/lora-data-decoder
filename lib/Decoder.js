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
var Logging_1 = require("./Logging");
var loraPacket = require('lora-packet');
var colors = require('colors');
var log = Logging_1.factory.getLogger("Sender");
var Decoder = /** @class */ (function () {
    function Decoder() {
    }
    Decoder.prototype.writeData = function (csvLine, deviceAddress, json, cmdObj) {
        if (!cmdObj.quiet) {
            log.info(csvLine);
        }
        if (cmdObj.destFile) {
            fs.appendFileSync(cmdObj.destFile, csvLine + '\n');
        }
        if (cmdObj.splitDevices) {
            fs.appendFileSync(cmdObj.out + "/" + deviceAddress + ".csv", csvLine + '\n');
            fs.appendFileSync(cmdObj.out + "/" + deviceAddress + ".json", json + ',\n');
        }
    };
    Decoder.prototype.decode = function (inputFile, cmdObj) {
        var _this = this;
        if (!inputFile) {
            log.warn(colors.red("input filename missing"));
        }
        if (cmdObj.quiet) {
            log.warn('Running quietly');
        }
        else {
            log.info("Device Address;Message Type;Direction;FCnt;FPort;Payload Data;Original json");
        }
        var filterEnabled = false;
        var filter = [];
        if (cmdObj.filter && cmdObj.filter.length > 0) {
            filterEnabled = true;
            filter = cmdObj.filter.split(',');
            log.warn("Device filter on: " + filter);
        }
        else {
            log.warn('Device filter off');
        }
        if (cmdObj.splitDevices) {
            if (fs.existsSync(cmdObj.out)) {
                if (cmdObj.clear) {
                    log.warn("Clearing output folder " + cmdObj.out);
                    var deleted = fs.readdirSync(cmdObj.out)
                        .map(function (file) {
                        // console.warn(`Delete ${file}`)
                        fs.unlinkSync(cmdObj.out + "/" + file);
                        return 1;
                    })
                        .reduce(function (a, b) { return a + b; }, 0);
                    log.warn("Removed " + deleted + " files from " + cmdObj.out);
                }
            }
            if (!fs.existsSync(cmdObj.out)) {
                log.warn("Creating folder " + cmdObj.out);
                fs.mkdirSync(cmdObj.out);
            }
        }
        if (cmdObj.destFile && fs.existsSync(cmdObj.destFile) && cmdObj.clear) {
            fs.unlinkSync(cmdObj.destFile);
            log.warn("Removed " + cmdObj.destFile);
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
        var recordsWritten = 0;
        log.info('Start processing:');
        readInterface.on('line', function (line) {
            if (line != "[" && line != "]" && line != "{}") {
                var json = line.endsWith(',') ? line.slice(0, -1) : line;
                // console.log(`line:${json}`)
                var obj = JSON.parse(json);
                if (obj && obj.rxpk) {
                    var data = obj.rxpk[0].data;
                    var packet = loraPacket.fromWire(Buffer.from(data, 'base64'));
                    var msgType = packet.getMType();
                    var msgDirection = packet.getDir();
                    var msgFCnt = packet.getFCnt();
                    var payloadPort = packet.getFPort();
                    var payloadData = asHexString(packet.getBuffers().FRMPayload);
                    var deviceAddress = asHexString(packet.getBuffers().DevAddr);
                    var csvLine = deviceAddress + ";" + msgType + ";" + msgDirection + ";" + msgFCnt + ";" + payloadPort + ";" + payloadData + ";" + json;
                    // if filtering, only write when deviceAddress in filter
                    if (filterEnabled && filter.includes(deviceAddress)) {
                        _this.writeData(csvLine, deviceAddress, json, cmdObj);
                        recordsWritten++;
                    }
                    // if not filtering, write everything
                    if (!filterEnabled) {
                        _this.writeData(csvLine, deviceAddress, json, cmdObj);
                        recordsWritten++;
                    }
                    processed++;
                }
            }
            process.stderr.write('.');
        });
        readInterface.on("close", function () {
            log.info("Processed " + processed + " records, written " + recordsWritten + " records");
        });
    };
    return Decoder;
}());
exports.Decoder = Decoder;
