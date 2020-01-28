"use strict";
/**
 * Utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
function msleep(millis) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
exports.msleep = msleep;
function sleep(seconds) {
    msleep(seconds * 1000);
}
exports.sleep = sleep;
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
