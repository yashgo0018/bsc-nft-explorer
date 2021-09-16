const Sequelize = require('sequelize');
const db = require('../database');

const NFT = db.define('nft', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_address: Sequelize.STRING,
  contract_address: Sequelize.STRING,
  token_id: Sequelize.STRING,
  last_block_number: Sequelize.INTEGER,
  network: Sequelize.STRING,
  having: Sequelize.BOOLEAN,
  minted: Sequelize.BOOLEAN,
  metadata_link: {
    type: Sequelize.STRING,
    allowNull: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  imageURL: {
    type: Sequelize.STRING,
    allowNull: true
  },
  image: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  underscored: true
});

module.exports = NFT;