import * as Knex from 'knex';
import * as bcrypt from 'bcrypt';

import knexConfig from 'src/config/database.config';

const db = Knex(knexConfig);

(async function () {
  try {
    await db.schema.dropTableIfExists('Admins');

    await db.schema.createTable('Admins', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().defaultTo(db.raw("CONCAT('User_', ?)", [db.fn.now()]));
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('role').notNullable().defaultTo('admin');
      table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    });

    const superadmin_password: string = await bcrypt.hash<string>('superadmin', 10);

    await db('Admins').insert({
      name: 'superadmin',
      username: 'superadmin',
      email: 'superadmin@gmail.com',
      password: superadmin_password,
      role: 'superadmin',
      createdAt: db.fn.now(),
    });

    // await db.schema.createTable('categories', function (table) {
    //     table.increments('id').primary();
    //     table.string('name').notNullable();
    // });

    // await db.schema.createTable('products', function (table) {
    //     table.increments('id').primary();
    //     table.string('name').notNullable();
    //     table.integer('category_id').notNullable().references('id').inTable('categories');
    //     table.specificType('quantity', 'text').notNullable(); // PostgreSQLda enu o'rniga text ishlatiladi
    //     table.decimal('price', 10, 2).notNullable();
    // });

    // await db.schema.createTable('warehouse', function (table) {
    //     table.increments('id').primary();
    //     table.integer('product_id').notNullable().references('id').inTable('products');
    //     table.integer('amount').notNullable();
    // });

    // await db.schema.createTable('sales', function (table) {
    //     table.increments('id').primary();
    //     table.integer('product_id').notNullable().references('id').inTable('products');
    //     table.integer('amount').notNullable();
    //     table.timestamp('date').notNullable().defaultTo(db.fn.now());
    // });

    await db.destroy();

    console.log('db jadvallar yaratildi!');
  } catch (err) {
    console.log('db jadvallarni yaratishda xatolik: ', err);
  }
})();
