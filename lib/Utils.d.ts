/**
 * Utility functions
 */
export declare function msleep(millis: number): void;
export declare function sleep(seconds: number): void;
declare class Latch {
    private int32;
    constructor();
    /**
     * calling thread is sleeping and waiting on location 0
     * which is expected to be 0.
     * As long as that's true, thread will not go on.
     */
    wait(): void;
    /**
     * Write a new value on location 0
     * and notify any waiting threads.
     */
    continue(): void;
}
export declare function newLatch(): Latch;
export {};