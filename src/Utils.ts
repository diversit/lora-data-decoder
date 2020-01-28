/**
 * Utility functions
 */
import * as fs from 'fs'

export function msleep(millis: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis)
}

export function sleep(seconds: number): void {
    msleep(seconds * 1000)
}

export function writeCsvData(header: string, filename: string, csvLine: string): void {
    if (!fs.existsSync(filename)) {
        fs.appendFileSync(filename, header + '\n')
    }
    fs.appendFileSync(filename, csvLine + '\n')
}

export function writeJsonData(filename: string, json: string): void {
    if (!fs.existsSync(filename)) {
        fs.appendFileSync(filename, '[\n') // start of json array
    }
    fs.appendFileSync(filename, json.endsWith(',') ? json + '\n' : json + ',\n')
}

export function writeJsonArrayEnd(filenameOrDir: string): void {
    let stat = fs.statSync(filenameOrDir)
    if (stat.isDirectory()) {
        // process al json files in given folder
        fs.readdir(filenameOrDir, (err: NodeJS.ErrnoException | null, files: string[]) => {
            if (err) {
                throw err
            } else {
                files.filter(filename => filename.endsWith(".json"))
                    .forEach(filename => {
                        writeJsonArrayEnd(filenameOrDir + '/' + filename)
                    })
            }
        })
    } else if (stat.isFile()) {
        // process given file
        fs.appendFileSync(filenameOrDir, ']\n')
    }
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