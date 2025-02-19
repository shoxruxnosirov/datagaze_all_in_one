import { Knex } from 'knex';

const knexConfig: Knex.Config = {
  client: 'pg', // PostgreSQL uchun
  connection: {
    host: '127.0.0.1',
    user: 'unknown', // PostgreSQL foydalanuvchi nomi
    password: 'password123', // PostgreSQL paroli
    database: 'datagaze', // Ma'lumotlar bazasi nomi
  },
  migrations: {
    directory: './src/database/migrations/v1', // Migratsiya fayllari joylashuvi
    tableName: 'knex_migrations', // Migratsiyalar jadvali nomi
  },
  seeds: {
    directory: './src/database/seeds/v1', // Seed fayllari joylashuvi
  },
};

export default knexConfig;
