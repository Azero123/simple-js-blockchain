
const os = require('os')
const threads = require('threads')
const spawn = threads.spawn
const startEpoch = new Date().getTime()
let h = 0
const newThread = () => {
    const thread = spawn((args, done) => {
        const sha2 = require(`${args.__dirname}/../../src/hashes/sha2-256.js`)
        let i = 0
        while (i < 100000) {
            sha2(`${Math.random()}`)
            i++
        }
        done()
    })
    thread.send({ __dirname: __dirname }).on('message', () => {
        h += 100000
        console.log(h/((new Date().getTime() - startEpoch)/1000) + ' hashes per second')
        newThread()
    })
}

for (i = 0; i < os.cpus().length; i ++) {
    newThread()
}

