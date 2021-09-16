const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const { DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_CONNECTION } = process.env;

const db = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_CONNECTION,
  operatorAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true //for reading from database
  }
});

module.exports = db;
