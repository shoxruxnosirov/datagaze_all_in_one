import * as Knex from 'knex';
import * as bcrypt from 'bcryptjs';

import knexConfig from 'src/config/database.config';
const path = require('path');
const db = Knex(knexConfig);

(async function () {
  try {
    await db.schema.dropTableIfExists('Admins');
    await db.schema.dropTableIfExists('admins');

    await db.schema.dropTableIfExists('products');
    await db.schema.dropTableIfExists('Products');
    
    await db.schema.dropTableIfExists('servers');
    await db.schema.dropTableIfExists('Servers');
    
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
      table.string('port').notNullable();
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
      table.text('icon').nullable();
      table.string('version').notNullable();

      table.string('fileUrl').notNullable();
      // table.text('download_path').notNullable();

      table.uuid('serverId').nullable().references('id').inTable('servers').onDelete('SET NULL');

      table.integer('size').notNullable();
      table.string('company').notNullable();
      table.text('description').nullable();
      table.string('supportOS').notNullable();

      table.integer('requiredCpuCore').nullable();
      table.integer('requiredRam').nullable();
      table.integer('requiredStorage').nullable();
      table.bigInteger('requiredNetwork').nullable();

      table.integer('computerCount').notNullable().defaultTo(0);
      table.timestamp('firstUploadAt').nullable().defaultTo(null);
      table.timestamp('lastUploadAt').nullable().defaultTo(null);
    });

    await db('products').insert({
      id: db.raw('uuid_generate_v4()'),
      name: 'DLP',
      icon: 'icons/launchpad/dlp.png',
      version: '1.0.0',
      fileUrl: path.join(process.cwd(), 'products/dlp'),
      // download_path: '/downloads/superadmin.zip',
      serverId: null,
      size: 1200, // MB
      company: 'Datagaze',
      description: 'Datagaze DLP',
      supportOS: 'Windows, Linux, MacOS',
      requiredCpuCore: 2,
      requiredRam: 4096, // MB
      requiredStorage: 50000, // MB
      requiredNetwork: 100, // Mbps
      computerCount: 0,
      firstUploadAt: null,
      lastUploadAt: null,
    });

    await db('products').insert({
      id: db.raw('uuid_generate_v4()'),
      name: 'WAF',
      icon: 'icons/launchpad/waf.png',
      version: '1.0.0',
      fileUrl: path.join(process.cwd(), 'products/waf'),
      // download_path: '/downloads/superadmin.zip',
      serverId: null,
      size: 1200, // MB
      company: 'Datagaze',
      description: 'Datagaze WAF',
      supportOS: 'Windows, Linux, MacOS',
      requiredCpuCore: 2,
      requiredRam: 4096, // MB
      requiredStorage: 50000, // MB
      requiredNetwork: 100, // Mbps
      computerCount: 0,
      firstUploadAt: null,
      lastUploadAt: null,
    });
    

    


    await db.destroy();

    console.log('db jadvallar yaratildi!');
  } catch (err) {
    console.log('db jadvallarni yaratishda xatolik: ', err);
    await db.destroy();
  }
})();
