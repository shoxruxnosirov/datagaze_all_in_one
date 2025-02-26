import * as Knex from 'knex';
import * as bcrypt from 'bcrypt';

import knexConfig from 'src/config/database.config';

const db = Knex(knexConfig);

(async function () {
  try {
    await db.schema.dropTableIfExists('Admins');
    await db.schema.dropTableIfExists('admins');

    await db.schema.dropTableIfExists('products');
    await db.schema.dropTableIfExists('Products');
    
    await db.schema.dropTableIfExists('servers');
    await db.schema.dropTableIfExists('Servers');
    
    const SUPERADMIN_PASSWORD: string = await bcrypt.hash<string>('superadmin', 10);
    
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
      table.string('ip').notNullable();
      table.string('port').notNullable();
      table.string('username').notNullable();
      table.string('auth_type').notNullable();
      table.string('password').nullable();
      table.string('private_key').nullable();
      // table.timestamp('last_checked').notNullable().defaultTo(db.fn.now());
      table.string('passphrase').nullable();
      table.string('tryKeyboard').nullable();
    });

    await db.schema.createTable('products', function (table) {
      table.uuid('id').defaultTo(db.raw('uuid_generate_v4()')).primary();
      table.string('name').notNullable();
      table.text('icon').nullable();
      table.string('version').notNullable();

      // table.string('file_url').notNullable();
      // table.text('download_path').notNullable();

      table.uuid('server_id').nullable().references('id').inTable('servers').onDelete('SET NULL');

      table.integer('size').notNullable();
      table.string('company').notNullable();
      table.text('description').nullable();
      table.string('support_os').notNullable();

      table.integer('required_cpu_core').nullable();
      table.integer('required_ram').nullable();
      table.integer('required_storage').nullable();
      table.bigInteger('required_network').nullable();

      table.integer('computer_count').notNullable().defaultTo(0);
      table.timestamp('first_upload_at').nullable().defaultTo(null);
      table.timestamp('last_upload_at').nullable().defaultTo(null);
    });

    await db('products').insert({
      id: db.raw('uuid_generate_v4()'),
      name: 'DLP',
      icon: 'icons/launchpad/dlp.png',
      version: '1.0.0',
      // file_url: 'https://example.com/superadmin.zip',
      // download_path: '/downloads/superadmin.zip',
      server_id: null,
      size: 1200, // MB
      company: 'Datagaze',
      description: 'Datagaze DLP',
      support_os: 'Windows, Linux, MacOS',
      required_cpu_core: 2,
      required_ram: 4096, // MB
      required_storage: 50000, // MB
      required_network: 100, // Mbps
      computer_count: 0,
      first_upload_at: null,
      last_upload_at: null,
    });

    await db('products').insert({
      id: db.raw('uuid_generate_v4()'),
      name: 'WAF',
      icon: 'icons/launchpad/waf.png',
      version: '1.0.0',
      // file_url: 'https://example.com/superadmin.zip',
      // download_path: '/downloads/superadmin.zip',
      server_id: null,
      size: 1200, // MB
      company: 'Datagaze',
      description: 'Datagaze WAF',
      support_os: 'Windows, Linux, MacOS',
      required_cpu_core: 2,
      required_ram: 4096, // MB
      required_storage: 50000, // MB
      required_network: 100, // Mbps
      computer_count: 0,
      first_upload_at: null,
      last_upload_at: null,
    });
    

    


    await db.destroy();

    console.log('db jadvallar yaratildi!');
  } catch (err) {
    console.log('db jadvallarni yaratishda xatolik: ', err);
    await db.destroy();
  }
})();
