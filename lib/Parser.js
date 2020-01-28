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
var Logging_1 = require("./Logging");
var jsonArrayStreams = require('json-array-streams');
var PACKETS_OUT = 'packets.csv';
var PACKETS_LOG = 'packets.json';
var log = Logging_1.factory.getLogger("Sender");
var Parser = /** @class */ (function () {
    function Parser() {
    }
    Parser.prototype.deleteIfFileExists = function (filename) {
        if (fs.existsSync(filename)) {
            log.warn("Removing " + filename);
            fs.unlinkSync(filename);
        }
    };
    /**
     * Stream from input file and parse json streaming.
     * Retrieve the data field and get all elements from it.
     * Write to 'packets.json' in format `decoder` supports.
     * Write to 'packets.csv' in csv format to be used for resending udp packets.
     * @param inputFile
     * @param cmdObj
     */
    Parser.prototype.parse = function (inputFile, cmdObj) {
        this.deleteIfFileExists(PACKETS_LOG);
        this.deleteIfFileExists(PACKETS_OUT);
        log.info('Start processing:');
        fs.createReadStream(inputFile)
            .pipe(jsonArrayStreams.parse())
            .on('data', function (jsonObj) {
            var data = jsonObj._source.layers.data["data.data"];
            var hexString = data.replace(/:/g, '');
            var protocol = hexString.substr(0, 2);
            var randomToken = hexString.substr(2, 4);
            var dataType = hexString.substr(6, 2);
            var gatewayId = hexString.substr(8, 16);
            var payload = hexString.substr(24);
            var json = Buffer.from(payload, 'hex').toString();
            var csvLine = protocol + ";" + randomToken + ";" + dataType + ";" + gatewayId + ";" + json;
            fs.appendFileSync(PACKETS_OUT, csvLine + ',\n');
            fs.appendFileSync(PACKETS_LOG, json + '\n');
            process.stderr.write('.');
        })
            // Note: close is not called
            .on('end', function () {
            process.stderr.write('\n');
            log.info("Done");
        });
    };
    return Parser;
}());
exports.Parser = Parser;
