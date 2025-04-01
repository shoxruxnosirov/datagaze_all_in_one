import * as Knex from 'knex';
import * as bcrypt from 'bcryptjs';

import knexConfig from 'src/config/database.config';

const db = Knex(knexConfig);

(async function () {
  try {

    await db.schema.dropTableIfExists('admins');

    await db.schema.dropTableIfExists('products');

    await db.schema.dropTableIfExists('servers');

    await db.schema.dropTableIfExists('applications');

    await db.schema.dropTableIfExists('computers');

    const SUPERADMIN_PASSWORD: string = await bcrypt.hash('superadmin', 10);

    await db.schema.createTable('admins', function (table) {
      table.uuid('id').defaultTo(db.raw('uuid_generate_v4()')).primary();
      table
        .string('name')
        .notNullable()
        .defaultTo(db.raw("CONCAT('User_', ?)", [db.fn.now()]));
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('role').notNullable().defaultTo('admin');
      table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    });

    await db('admins').insert({
      name: 'superadmin',
      username: 'superadmin',
      email: 'superadmin@gmail.com',
      password: SUPERADMIN_PASSWORD,
      role: 'superadmin',
      createdAt: db.fn.now(),
    });

    await db.schema.createTable('servers', function (table) {
      table.uuid('id').defaultTo(db.raw('uuid_generate_v4()')).primary();
      table.string('host').notNullable();
      table.integer('port').notNullable();
      table.string('username').notNullable();
      // table.string('auth_type').notNullable();
      table.string('password').nullable();
      table.text('privateKey').nullable();
      // table.timestamp('last_checked').notNullable().defaultTo(db.fn.now());
      table.string('passphrase').nullable();
      table.string('tryKeyboard').nullable();
    });

    await db.schema.createTable('products', function (table) {
      table.uuid('id').defaultTo(db.raw('uuid_generate_v4()')).primary();
      table.string('name').notNullable();
      table.text('icon').notNullable();

      table.string('serverVersion').notNullable();
      table.string('agentVersion').notNullable();

      table.string('serverFilePath').notNullable();
      table.string('agentFilePath').notNullable();

      table.integer('serverFileSize').notNullable();
      table.integer('agentFileSize').notNullable();

      table.uuid('serverId').nullable().references('id').inTable('servers').onDelete('SET NULL');

      table.string('publisher').notNullable();

      table.text('description').nullable();
      table.string('supportOS').nullable();

      table.integer('requiredCpuCore').defaultTo(8);
      table.integer('requiredRam').defaultTo(16);
      table.integer('requiredStorage').defaultTo(500);
      table.integer('requiredNetwork').defaultTo(1);

      table.text('installScript').nullable();
      table.text('updateScript').nullable();
      table.text('deleteScript').nullable();

      table.integer('computerCount').defaultTo(0);
      table.timestamp('firstUploadAt').defaultTo(db.fn.now());
      table.timestamp('lastUploadAt').defaultTo(db.fn.now());
    });

    await db.schema.createTable('computers', (table) => {
      table.uuid('id').defaultTo(db.raw('uuid_generate_v4()')).primary();
      table.string('key').notNullable().unique();
      table.string('hostname').notNullable();
      table.string('operation_system').notNullable();
      table.string('platform').notNullable();
      table.string('build_number').nullable();
      table.string('version').notNullable();
      table.integer('ram').notNullable();
      table.integer('free_ram').defaultTo(50);
      table.string('cpu').notNullable();
      table.string('model').nullable();
      table.integer('cores').notNullable();
      table.jsonb('network_adapters').notNullable();
      table.jsonb('disks').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db.schema.createTable('applications', (table) => {
      // table.uuid("id").defaultTo(db.raw('uuid_generate_v4()')).primary();
      table.uuid('computerId').unsigned().references('id').inTable('computers').onDelete('CASCADE');
      table.string('name').nullable();
      table.string('version').nullable();
      table.timestamp('installed_date').defaultTo(db.fn.now());
      table.string('type').nullable();
      table.integer('size').nullable();

      table.unique(['computerId', 'name']);
    });

    await db.destroy();

    console.log('db jadvallar yaratildi!');
  } catch (err: unknown) {
    console.log('db jadvallarni yaratishda xatolik: ', err);
    await db.destroy();
  }
})();
