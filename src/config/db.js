import { Sequelize } from 'sequelize';
import config from './config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: env === 'development' ? console.log : false, 
  define: {
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
    timestamps: false, // Disable automatic timestamps
  }
});

export default sequelize;
