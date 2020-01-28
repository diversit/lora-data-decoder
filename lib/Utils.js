"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility functions
 */
var fs = __importStar(require("fs"));
function msleep(millis) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
exports.msleep = msleep;
function sleep(seconds) {
    msleep(seconds * 1000);
}
exports.sleep = sleep;
function writeCsvData(header, filename, csvLine) {
    if (!fs.existsSync(filename)) {
        fs.appendFileSync(filename, header + '\n');
    }
    fs.appendFileSync(filename, csvLine + '\n');
}
exports.writeCsvData = writeCsvData;
function writeJsonData(filename, json) {
    if (!fs.existsSync(filename)) {
        fs.appendFileSync(filename, '[\n'); // start of json array
    }
    fs.appendFileSync(filename, json.endsWith(',') ? json + '\n' : json + ',\n');
}
exports.writeJsonData = writeJsonData;
function writeJsonArrayEnd(filenameOrDir) {
    var stat = fs.statSync(filenameOrDir);
    if (stat.isDirectory()) {
        // process al json files in given folder
        fs.readdir(filenameOrDir, function (err, files) {
            if (err) {
                throw err;
            }
            else {
                files.filter(function (filename) { return filename.endsWith(".json"); })
                    .forEach(function (filename) {
                    writeJsonArrayEnd(filenameOrDir + '/' + filename);
                });
            }
        });
    }
    else if (stat.isFile()) {
        // process given file
        fs.appendFileSync(filenameOrDir, ']\n');
    }
}
exports.writeJsonArrayEnd = writeJsonArrayEnd;
var Latch = /** @class */ (function () {
    function Latch() {
        this.int32 = new Int32Array(new SharedArrayBuffer(4));
    }
    /**
     * calling thread is sleeping and waiting on location 0
     * which is expected to be 0.
     * As long as that's true, thread will not go on.
     */
    Latch.prototype.wait = function () {
        console.log("wait");
        Atomics.wait(this.int32, 0, 0);
    };
    /**
     * Write a new value on location 0
     * and notify any waiting threads.
     */
    Latch.prototype.continue = function () {
        console.log("continue");
        Atomics.store(this.int32, 0, 1);
        Atomics.notify(this.int32, 0, 1);
    };
    return Latch;
}());
function newLatch() {
    return new Latch();
}
exports.newLatch = newLatch;
