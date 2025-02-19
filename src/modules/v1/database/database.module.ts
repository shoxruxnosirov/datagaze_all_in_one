// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';

import knex from './knex';

export const KNEX_CONNECTION = 'KNEX_CONNECTION'; // KNEX_CONNECTION ni eksport qilish

const knexProvider = {
  provide: KNEX_CONNECTION, // KNEX_CONNECTION ni ishlatish
  useFactory: () => knex,
};

@Global()
@Module({
  providers: [knexProvider],
  exports: [knexProvider], // knexProvider ni eksport qilish
})
export class DatabaseModule {}
