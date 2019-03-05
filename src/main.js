const os = require('os')
const fs = require('fs')
const threads = require('threads')
const fetch = require('node-fetch')
const sha2_256 = require('../src/hashes/sha2-256.js')
const spawn = threads.spawn

class Block {
  constructor(parentBlock) {
    this.height = 0
    if (parentBlock) {
      this.previous = parentBlock.hash
      this.height = parentBlock.height + 1
    }
  }
  nonce(nonce) {
    this.created = Date.now()
    this._nonce = nonce || Math.random()
  }
  get difficulty() {
    return parseInt(this.hash, 16).toString(2).padStart(256, '0').search(/1/)
  }
  get hash() {
    return sha2_256(JSON.stringify(this))
  }
}

class Blockchain {
  constructor(config) {
    this.nodes = config.nodes || ['54.172.118.82:2001']
    this.minimumBlockDifficulty = config.minimumBlockDifficulty || 25
    this.minimumChainStrength = config.minimumChainStrength || 0
    this.events = {}
    this.blocks = []
    this.currentBlock = new Block()
    this.mining = false
    this.advertising = config.advertising || true
  }
  static async fromLocal(config) {
    const blockchain = new Blockchain(config)
    try {
      blockchain.blocks = JSON.parse(await fs.readFileSync('./chain.json'))
    }
    catch (e) {
      if (!this.minimumChainStrength) {
        console.warn(`
⚠️ - no local chain, this is perfectly normal however this could be a security problem, ensure you are working with honest nodes. setting a minimum chain strength is recommended and will silence this warning as it strengthens security even without trust. if you are making a new chain you can ignore this
`)
      }
    }
    return blockchain;
  }

  get blocks() {
    return this._blocks
  }

  set blocks(value) {
    this._blocks = value
    fs.writeFile('./chain.json', JSON.stringify(this.blocks), () => {})
  }

  get currentBlock() {
    return this._currentBlock
  }

  set currentBlock(value) {
    this._currentBlock = value
    if (this.mining) {
      this.stopMining()
      this.mine()
    }
    this.advertise()
    this.trigger('block_update', this.currentBlock)
  }

  serve(port = 80) {
    const http = require('http')
  
    this.server = http.createServer(
      (request, response) => {
        try {
          if (request.method === 'GET') {
            this.getResponse(request, response)
          }
          else if (request.method === 'POST') {
            this.postResponse(request, response)
          }
          else {
            throw 'method not implemented'
          }
        } catch (error) {
          console.error(error)
        }
        response.end()
      }
    )
    .listen(port, '::')
    .listen(port, '0.0.0.0')
    .on('error', error => {
      console.error('unable to serve network', error)
    })
    // global.socket = require('socket.io').listen(httpServer)
  }

  getResponse(request, response) {
    const components = request.url.split('/')
    if (request.url === '/') {
      response.statusCode = 200
      response.setHeader('content-type', 'text/json')
      response.end(JSON.stringify(this.blocks))
    }
    else if (components.length === 2) {
      response.statusCode = 404
      response.end()
    }
    else {
      response.statusCode = 404
      response.end()
    }
  }

  postResponse(request, response) {
    let data = ''
    request.on('data', packet => {
      data += packet
    })
    request.on('end', () => {
      if (this.compareChain(JSON.parse(data))) {
        response.statusCode = 201
      }
      else {
        response.statusCode = 400
      }
      response.end()
    })
  }

  advertise() {
    if (this.advertising) {
      for (const node of this.nodes) {
        fetch(`http://${node}`, { method: 'post', body: JSON.stringify(this.blocks) })
          .then(() => console.log(`advertised to ${node}`))
          .catch(() => console.warn(`⚠️ - failed to push to ${node}`))
      }
    }
  }

  async connect() {
    for (const node of this.nodes) {
      fetch(`http://${node}`)
        .then(response => response.json())
        .then(data => {
          console.log(`✅ - connected to ${node}`)
          this.compareChain(data)
        })
        .catch(() => console.warn(`⚠️ - failed to connect to ${node}`))
    }
  }

  compareChain(chain) {
    if (this.chainStrength(this.blocks) < this.chainStrength(chain)) {
      const block = Object.assign(new Block(), chain[chain.length - 1])
      this.blocks = chain
      this.currentBlock = block
      return true
    }
    return false
  }

  chainStrength(blocks) {
    let strength = 0
    let previousBlock
    for (const block of blocks) {
      block.__proto__ = Block.prototype;
      if (previousBlock) {
        if (
          block.previous !== previousBlock.hash ||
          block.height !== previousBlock.height + 1  
        ) {
          return 0
        }
        strength += block.difficulty
      }
      previousBlock = block
    }
    return strength
  }

  mine(maxCpus = Infinity) {
    this.mining = true

    let block = new Block(this.currentBlock)
    this.threads = []
    let i = 0
    for (i = 0; i < Math.min(os.cpus().length, maxCpus); i ++) {
      const thread = spawn((args, done) => {
        const Block = require(`${args.__dirname}/main.js`).Block
        let block = Object.assign(new Block(), args.block)

        const difficulty = args.difficulty
        const mine = () => {
          let i = 0
          while (i < 10000) {
            block.nonce()
            if (block.difficulty >= difficulty) {
              return done({ created:block.created, _nonce:block._nonce })
            }
            i++
          }
          setTimeout(mine, 1)
        }
        mine()
      })
      
      thread.send({ __dirname: __dirname, block: block, difficulty: this.minimumBlockDifficulty }).on('message', minedBlock => {
        block = Object.assign(block, minedBlock)
        if (block.difficulty >= this.minimumBlockDifficulty) {
          this.blocks.push(block)
          this.currentBlock = block
        }
      })

      this.threads.push(thread)
    }
  }

  stopMining() {
    this.mining = false
    for (const thread of this.threads) {
      thread.kill()
    }
    this.threads = []
  }

  on(event, callback) {
    this.events[event] = this.events[event] || []
    this.events[event].push(callback)
  }

  trigger(event, data) {
    if (this.events[event]) {
      for (const callback of this.events[event]) {
        callback(data)
      }
    }
  }
}

module.exports = {
  Blockchain: Blockchain,
  Block: Block
}