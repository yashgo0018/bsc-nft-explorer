const dotenv = require('dotenv');
const NFT = require('./models/Nft');
const UpdateLog = require('./models/UpdateLog');
const axios = require('axios');
const ERC721 = require('./abis/ERC721.json');
const ERC165 = require('./abis/ERC165.json');
const { Op } = require('sequelize');
const IPFS = require('ipfs-core');
const toBuffer = require('it-to-buffer');
const request = require('request');
const fs = require('fs');
const sharp = require('sharp');

let node;
async function main() {
  node = await IPFS.create();
}
main()

dotenv.config();

const { ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY, BSCSCAN_API_KEY } = process.env;

function delay(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  })
}

async function downloadNFTs(web3, address, network) {
  const updateLog = (await UpdateLog.findAll({
    where: {
      address,
      network
    }
  }))[0];
  let latestUpdatedBlock;
  if (updateLog) {
    latestUpdatedBlock = parseInt(updateLog.block);
  } else {
    latestUpdatedBlock = -1;
  }

  let host;
  switch (network) {
    case 'mainnet':
      host = 'api.etherscan.io';
      explorerApiKey = ETHERSCAN_API_KEY;
      break;
    case 'matic':
      host = 'api.polygonscan.com';
      explorerApiKey = POLYGONSCAN_API_KEY;
      break;
    case 'bsc':
      host = 'api.bscscan.com';
      explorerApiKey = BSCSCAN_API_KEY;
      break;
    default:
      return;
  }

  const { data } = await axios.get(`https://${host}/api?module=account&action=tokennfttx&address=${address}&startblock=${latestUpdatedBlock + 1}&endblock=999999999&sort=asc&apikey=${explorerApiKey}`);
  if (data.status == '0') {
    return;
  }
  for (const transaction of data.result) {
    if (transaction.from == '0x0000000000000000000000000000000000000000') {
      await NFT.create({
        contract_address: transaction.contractAddress,
        token_id: transaction.tokenID,
        having: true,
        minted: true,
        user_address: address,
        network
      });
    } else if (transaction.from.toLowerCase() === address.toLowerCase()) {
      const nft = (await NFT.findAll({
        where: {
          contract_address: transaction.contractAddress,
          token_id: transaction.tokenID,
          user_address: address,
          network
        }
      }))[0];
      if (nft) {
        nft.having = false;
        nft.save();
      }
    } else {
      const nft = (await NFT.findAll({
        where: {
          contract_address: transaction.contractAddress,
          token_id: transaction.tokenID,
          user_address: address,
          network
        }
      }))[0];
      if (nft) {
        nft.having = true;
        nft.save();
      } else {
        await NFT.create({
          contract_address: transaction.contractAddress,
          token_id: transaction.tokenID,
          having: true,
          minted: false,
          network,
          user_address: address
        });
      }
    }
  }
  if (!data.result.length) return;
  const lastTransaction = data.result[data.result.length - 1];
  if (updateLog) {
    updateLog.block = lastTransaction.blockNumber;
    updateLog.save();
  } else {
    await UpdateLog.create({
      network,
      address,
      block: lastTransaction.blockNumber
    });
  }
}

async function downloadMetadataLinks(web3, address, network) {
  const contracts = await NFT.findAll({
    attributes: ['contract_address'],
    where: { user_address: address, having: true, metadata_link: null },
    group: ['contract_address']
  });
  for (const { contract_address } of contracts) {
    const nfts = await NFT.findAll({
      where: {
        user_address: address,
        metadata_link: null,
        having: true,
        contract_address
      }
    });
    const nftContract = new web3.eth.Contract(ERC721, contract_address);
    for (const nft of nfts) {
      const tokenURI = await nftContract.methods.tokenURI(nft.token_id).call();
      nft.metadata_link = tokenURI;
      await nft.save();
    }
  }
}

async function downloadNFTData(address) {
  const nfts = await NFT.findAll({
    where: {
      user_address: address,
      having: true,
      metadata_link: {
        [Op.ne]: null
      },
      name: null
    }
  });
  for (const nft of nfts) {
    try {
      const { data } = await getMetadata(nft.metadata_link);
      if (data.name) nft.name = data.name;
      if (data.description) nft.description = data.description;
      if (data.image) nft.imageURL = data.image;
      await nft.save();
      await delay(300);
      const image = await getImage(`${nft.contract_address}-${nft.token_id}.png`, nft.imageURL);
      nft.image = '/' + image;
      await nft.save();
      await delay(300);
    } catch (e) {
      console.log(e);
    }
  }
}

const ERC721_INTERFACE_ID = '0x80ac58cd';

function downloadImageOverHTTP(filePath, uri) {
  return new Promise((resolve, reject) => {
    request.head(uri, function (err, res, body) {
      if (err) {
        reject(err);
        return;
      }
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      request(uri).pipe(fs.createWriteStream(filePath)).on('close', resolve);
    });
  });
}

async function getImage(name, url) {
  const filePath = `nfts/unsized/${name}`;
  if (url.startsWith('ipfs://')) {
    // const buffer = await toBuffer(node.cat(url.slice(7)));
    // const fs = require('fs')
    // fs.writeFile(filePath, buffer, () => { });
    await downloadImageOverHTTP(filePath, 'https://gateway.ipfs.io/ipfs/' + url.slice(7))
  } else {
    await downloadImageOverHTTP(filePath, url);
  }
  const resizedImagePath = `nfts/resized/${name}`;
  try {
    await sharp(filePath).resize({ height: 400 }).toFile(resizedImagePath);
    return resizedImagePath;
  } catch (e) {
    console.log(e);
    return filePath;
  }
}


async function getMetadata(url) {
  if (url.startsWith('ipfs://')) {
    return await axios({ method: 'get', url: 'https://gateway.ipfs.io/ipfs/' + url.slice(7), timeout: 1000 * 5 });
    // const stream = node.cat(url.slice(7));
    // let data = "";
    // for await (let chunk of stream) {
    //   data += chunk.toString();
    // }
    // return { data: JSON.parse(data) };
  }
  return await axios.get(url);
}

async function isERC721Contract(web3, contract_address) {
  try {
    const contract = new web3.eth.Contract(ERC165, contract_address);
    if (await contract.methods.supportsInterface(ERC721_INTERFACE_ID).call()) return true;
  } catch (e) {
    console.log(e);
  }
  return false;
}

async function getNFT(web3, contract_address, token_id) {
  const nft = (await NFT.findAll({
    where: {
      contract_address,
      token_id
    }
  }))[0];
  if (nft) return nft;
  if (!await isERC721Contract(web3, contract_address)) return null;
  let t1, t2, t3, t4, t5, t6;
  t1 = (new Date()).getTime()
  const tokenContract = new web3.eth.Contract(ERC721, contract_address);
  t2 = (new Date()).getTime()
  let metadata_link, owner_address;
  try {
    t3 = (new Date()).getTime()
    metadata_link = await tokenContract.methods.tokenURI(token_id).call();
    t4 = (new Date()).getTime()
    owner_address = await tokenContract.methods.ownerOf(token_id).call();
  } catch (e) {
    console.log(e);
    return null;
  }
  t5 = (new Date()).getTime()
  console.log(await getMetadata(metadata_link))
  const { data: { name, image: imageURL, description } } = await getMetadata(metadata_link);
  t6 = (new Date()).getTime()
  console.log(`First Step: ${(t2 - t1) / 1000}`);
  console.log(`Second Step: ${(t3 - t2) / 1000}`);
  console.log(`Third Step: ${(t4 - t3) / 1000}`);
  console.log(`Fourth Step: ${(t5 - t4) / 1000}`);
  console.log(`Fifth Step: ${(t6 - t5) / 1000}`);
  return {
    contract_address,
    owner_address,
    token_id,
    name,
    imageURL,
    description,
    metadata_link
  }
}

module.exports = {
  downloadNFTs,
  downloadMetadataLinks,
  downloadNFTData,
  getNFT
};
