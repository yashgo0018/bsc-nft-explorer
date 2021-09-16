// Load Dependencies
const dotenv = require('dotenv');
const Web3 = require('web3');
const express = require('express');
const db = require('./database');
const NFT = require('./models/Nft');
const NFTQueue = require('./NFTQueue');
const { getNFT } = require('./helper');
const cors = require('cors');

// Load ENV Variables
dotenv.config()
const { BSC_RPC_ENDPOINT, BSCSCAN_API_KEY, NODE_SERVER_PORT: PORT } = process.env;

// Load Web3 and NFT Queue
const web3 = new Web3(BSC_RPC_ENDPOINT);
const nftQueue = new NFTQueue(web3, 'bsc');

// Connect to DB
db.authenticate()
  .then(() => {
    console.log('Successfully Connected to the database');
    return db.sync({ force: true });
  }).then(() => console.log('Synced Models'))
  .catch(err => console.log(`Error: ${err}`));

const app = express();
app.use(cors());
app.use('/nfts', express.static('nfts'));
app.get('/address/:address', async (req, res) => {
  const { address } = req.params;
  const isValidAddress = Web3.utils.isAddress(address);
  if (!isValidAddress) {
    res.status(400).json({ message: 'Invalid Address' });
    return;
  }
  nftQueue.addItem(address);
  res.json(await NFT.findAll({ where: { user_address: address, having: true } }));
})

app.get('/assets/:contractAddress/:tokenId', async (req, res) => {
  const { contractAddress, tokenId } = req.params;
  const nft = await getNFT(web3, contractAddress, tokenId);
  res.json(nft);
});

// Start Server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));