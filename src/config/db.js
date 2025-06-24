// src/config/db.js
const { Sequelize } = require('sequelize');

// Environment validation
if (!process.env.DATABASE_URL && (!process.env.DB_NAME || !process.env.DB_USER)) {
  console.error('❌ Database environment variables are missing!');
  console.error('Please set either DATABASE_URL or individual DB variables:');
  console.error('- DATABASE_URL (for production) OR');
  console.error('- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST (for development)');
  process.exit(1);
}

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use Neon connection string with proper SSL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Important for cloud databases like Neon
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Development: Use individual environment variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
