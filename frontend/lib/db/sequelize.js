require('pg');
require('pg-hstore');
const { Sequelize } = require('sequelize');
const fs = require('fs');

// Ensure we don't open too many connections in Next.js Serverless environment
const pool = { max: 2, min: 0, acquire: 30000, idle: 10000 };

// Check if running inside a Docker container
const isDocker = fs.existsSync('/.dockerenv') || 
                 (fs.existsSync('/proc/self/cgroup') && fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker'));

let dbHost = process.env.DB_HOST || 'localhost';
if (isDocker && dbHost === 'localhost') {
  console.log('🐳 Auto-detected Docker environment. Overriding DB_HOST to "postgres"');
  dbHost = 'postgres';
}

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    logging: false,
    pool,
    define: { underscored: true, timestamps: true },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'engineering_platform',
    process.env.DB_USER || 'engadmin',
    process.env.DB_PASSWORD || 'engpassword',
    {
      host: dbHost,
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool,
      define: { underscored: true, timestamps: true },
    }
  );
}

module.exports = sequelize;
