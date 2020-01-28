import * as utils from "../src/Utils"

describe("sleep", () => {

    test("msleep should wait milliseconds", () => {

        let start = Date.now()
        utils.msleep(200)
        let end = Date.now()
        let waited = end - start
        
        console.log(`waited: ${waited}`)

        expect(waited).toBeGreaterThanOrEqual(200)
        expect(waited).toBeLessThan(300)
    })

    test("sleep should wait seconds", () => {

        let start = Date.now()
        utils.sleep(1)
        let end = Date.now()
        let waited = end - start
        
        console.log(`waited: ${waited}`)

        expect(waited).toBeGreaterThanOrEqual(1000)
        expect(waited).toBeLessThan(1200)
    })
})

describe("latch", () => {

    test('should wait until completed', async () => {

        let l = utils.newLatch()
        
        let start = Date.now()

        // do something async
        doAsync(() => {
            console.log("HIER")
            utils.sleep(2)
            l.continue()
        })

        console.log("waiting?")
        l.wait()
        console.log("done")

        let end = Date.now()
        let wait = end - start

        expect(wait).toBeGreaterThanOrEqual(1000)
    })
})

async function doAsync(f: () => void): Promise<void> {
    new Promise((resolve) => {
        f()
        resolve()
    })
}
