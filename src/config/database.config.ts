import { Knex } from 'knex';

const knexConfig: Knex.Config = {
  client: 'pg', 
  connection: {
    host: '127.0.0.1',
    user: 'unknown', 
    password: 'password123', 
    database: 'datagaze',
  },
  migrations: {
    directory: './src/database/migrations/v1', 
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds/v1', 
  },
};

export default knexConfig;
