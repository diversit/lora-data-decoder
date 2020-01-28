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
var Csv_1 = require("./model/Csv");
var Utils_1 = require("./Utils");
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
            Utils_1.writeCsvData(Csv_1.DecoderCsvLine.HEADER, cmdObj.destFile, csvLine);
        }
        if (cmdObj.splitDevices) {
            Utils_1.writeCsvData(Csv_1.DecoderCsvLine.HEADER, cmdObj.out + "/" + deviceAddress + ".csv", csvLine);
            Utils_1.writeJsonData(cmdObj.out + "/" + deviceAddress + ".json", json);
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
            if (line != "[" && line != "]" && line != "{}" && !line.startsWith(Csv_1.ParserCsvLine.HEADER)) {
                var csvLine = _this.parseLine(line);
                // let json = line.endsWith(',') ? line.slice(0, -1) : line
                // console.log(`line:${json}`)
                var obj = JSON.parse(csvLine.json());
                if (obj && obj.rxpk) {
                    var data = obj.rxpk[0].data;
                    var packet = loraPacket.fromWire(Buffer.from(data, 'base64'));
                    var msgType = packet.getMType();
                    var msgDirection = packet.getDir();
                    var msgFCnt = packet.getFCnt();
                    var payloadPort = packet.getFPort();
                    var payloadData = asHexString(packet.getBuffers().FRMPayload);
                    var deviceAddress = asHexString(packet.getBuffers().DevAddr);
                    var csvLineOut = line + ";" + deviceAddress + ";" + msgType + ";" + msgDirection + ";" + msgFCnt + ";" + payloadPort + ";" + payloadData;
                    // if filtering, only write when deviceAddress in filter
                    if (filterEnabled && filter.includes(deviceAddress)) {
                        _this.writeData(csvLineOut, deviceAddress, csvLine.json(), cmdObj);
                        recordsWritten++;
                    }
                    // if not filtering, write everything
                    if (!filterEnabled) {
                        _this.writeData(csvLineOut, deviceAddress, csvLine.json(), cmdObj);
                        recordsWritten++;
                    }
                    processed++;
                }
            }
            process.stderr.write('.');
        });
        readInterface.on("close", function () {
            log.info("Processed " + processed + " records, written " + recordsWritten + " records");
            if (cmdObj.splitDevices) {
                Utils_1.writeJsonArrayEnd(cmdObj.out);
            }
            if (cmdObj.destFile) {
                Utils_1.writeJsonArrayEnd(cmdObj.destFile);
            }
        });
    };
    Decoder.prototype.parseLine = function (line) {
        return new Csv_1.ParserCsvLine(line);
    };
    return Decoder;
}());
exports.Decoder = Decoder;
