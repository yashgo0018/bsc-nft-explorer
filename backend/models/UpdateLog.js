const Sequelize = require('sequelize');
const db = require('../database');

const UpdateLog = db.define('update_log', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, },
  address: Sequelize.STRING,
  network: Sequelize.STRING,
  block: Sequelize.STRING,
}, { underscored: true });

module.exports = UpdateLog;