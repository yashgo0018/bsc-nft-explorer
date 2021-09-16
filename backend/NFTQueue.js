const { downloadNFTs, downloadMetadataLinks, downloadNFTData } = require('./helper');

class NFTQueue {
  constructor(web3, network) {
    this.web3 = web3;
    this.network = network;
    this.queue = [];
    this.running = false;
    this.current = null;
  }

  async addItem(address) {
    if (this.running) {
      if (!this.queue.includes(address) && this.current !== address) this.queue.push(address);
      return;
    }
    this.current = address;
    this.running = true;
    try {
      await downloadNFTs(this.web3, address, this.network);
      await downloadMetadataLinks(this.web3, address, this.network);
      await downloadNFTData(address);
    } catch (e) {
      console.log(e);
    }
    console.log('Done!!!!!! Hello - :)')
    this.running = false;
    this.current = null;
    if (this.queue.length !== 0) {
      this.addItem(this.queue.shift());
    }
  }
}

module.exports = NFTQueue;