"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var dgram = __importStar(require("dgram"));
var utils = __importStar(require("./Utils"));
var Logging_1 = require("./Logging");
var es = __importStar(require("event-stream"));
var Csv_1 = require("./model/Csv");
var colors = require('colors');
var log = Logging_1.factory.getLogger("Sender");
var Sender = /** @class */ (function () {
    function Sender() {
    }
    Sender.prototype.fromHexString = function (hexString) {
        var twoCharsArray = hexString.match(/.{1,2}/g);
        if (twoCharsArray == null) {
            throw new Error("hexString empty");
        }
        else {
            return new Uint8Array(twoCharsArray.map(function (byte) { return parseInt(byte, 16); }));
        }
    };
    Sender.prototype.sendPackets = function (inputFile, cmdObj) {
        var _this = this;
        if (!inputFile) {
            log.warn(colors.red("input filename missing"));
        }
        var host = cmdObj.target;
        var port = cmdObj.port;
        var delay = cmdObj.delay;
        log.info("Start sending to " + host + ":" + port + " with delay " + delay + " millis:");
        var client = dgram.createSocket('udp4');
        var counter = 0;
        var s = fs.createReadStream(inputFile)
            .pipe(es.split())
            .pipe(es.filterSync(function (line) {
            return line.trim() != '' && !line.startsWith(Csv_1.ParserCsvLine.HEADER); // filter out empty lines
        }))
            .pipe(es.mapSync(function (line) { return _this.parseLineToUint8Array(line); }))
            .pipe(es.mapSync(function (bytes) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        process.stderr.write('.');
                        // pause the readstream
                        log.debug("Process bytes");
                        s.pause();
                        log.debug("Paused stream");
                        // send udp packet
                        return [4 /*yield*/, this.sendUdpPacket(client, host, port, bytes)
                                .then(function () {
                                log.debug("Sleep for " + delay + " millis");
                                utils.msleep(delay);
                                log.debug("Continue..");
                                counter += 1;
                                s.resume();
                            })
                            // resume when udp packet has been send
                        ];
                    case 1:
                        // send udp packet
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }))
            .on('error', function (err) {
            log.error("Error while processing file", err);
        })
            .on('end', function () {
            process.stderr.write('\n');
            log.info("Finished processing file. Send " + counter + " packets");
            client.close();
        });
    };
    Sender.prototype.parseLineToUint8Array = function (line) {
        log.debug("parse line: " + line);
        // let lineItems: Array<string> = line.split(';')
        var csvLine = new Csv_1.ParserCsvLine(line);
        // get individual parts
        var protocol = this.fromHexString(csvLine.protocol());
        var randomToken = this.fromHexString(csvLine.randomToken());
        var pushData = this.fromHexString(csvLine.pushData());
        var gatewayMac = this.fromHexString(csvLine.gatewayMac());
        var jsonPacket = new TextEncoder().encode(csvLine.json()); // remove trailing comma
        log.debug("" + protocol + randomToken + pushData + gatewayMac + jsonPacket);
        // copy all arrays into 1
        var int8Array = Uint8Array.from(__spread(protocol, randomToken, pushData, gatewayMac, jsonPacket));
        return int8Array;
    };
    Sender.prototype.sendUdpPacket = function (client, host, port, bytes) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            client.send(bytes, port, host, function (err, bytes) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (err) {
                        log.error("Error sending UDP: " + err.message);
                    }
                    else {
                        log.debug("Send bytes: " + bytes);
                    }
                    resolve();
                    return [2 /*return*/];
                });
            }); });
        });
    };
    return Sender;
}());
exports.Sender = Sender;
