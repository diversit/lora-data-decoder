/**
 * Utility functions
 */

export function msleep(millis: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis)
}

export function sleep(seconds: number): void {
    msleep(seconds * 1000)
}

class Latch {

    private int32 = new Int32Array(new SharedArrayBuffer(4))

    constructor() {
    }

    /**
     * calling thread is sleeping and waiting on location 0
     * which is expected to be 0.
     * As long as that's true, thread will not go on.
     */
    wait(): void {
        console.log("wait")
        Atomics.wait(this.int32, 0, 0)
    }

    /**
     * Write a new value on location 0
     * and notify any waiting threads.
     */
    continue(): void {
        console.log("continue")
        Atomics.store(this.int32, 0, 1)
        Atomics.notify(this.int32, 0, 1)
    }
}

export function newLatch(): Latch {
    return new Latch()
}