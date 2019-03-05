(async () => {
  try {
    const Blockchain = require('../src/main.js').Blockchain
    const blockchain = await Blockchain.fromLocal({ minimumDifficulty: 25 })
    blockchain.serve(2001)
    blockchain.on('block_update', newBlock => {
      console.log(newBlock)
    })
    blockchain.connect()
    blockchain.mine()
    console.log('✅ blockchain test passed')
  }
  catch (error) {
    console.error('⚠️ failed to test blockchain', error)
  } 
})()