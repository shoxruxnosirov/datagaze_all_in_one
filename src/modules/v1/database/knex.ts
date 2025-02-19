// src/database/knex.ts
import * as Knex from 'knex';
import knexConfig from 'src/config/database.config';

const knex = Knex(knexConfig); // knexConfig to'g'ri uzatilishi kerak

export default knex;
