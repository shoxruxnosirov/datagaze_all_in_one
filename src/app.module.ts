import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';

import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/v1/admin/admin.module';
// import { SshModule } from './modules/v1/ssh/ssh.module';
import { ProductsModule } from './modules/v1/product/product.module';
import { SshGateway } from './modules/v1/sockets/frondend/terminals/ssh.gateway';
import { SshGatewayConnection } from './modules/v1/sockets/frondend/terminals/ssh.gatewayService';
import knexConfig from 'src/config/database.config';
import { ComputersModule } from './modules/v1/computer/copmuter.module';
import { AgentsModule } from './modules/v1/agent/agent.module';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';

@Module({
  imports: [
    AdminModule,
    // SshModule,
    ProductsModule,
    ComputersModule,
    AgentsModule,
    KnexModule.forRoot({
      config: {
        client: knexConfig.client,
        connection: knexConfig.connection,
      },
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads', 'icons'),
        serveRoot: '/icons',
      },
      // {
      //   rootPath: join(__dirname, '..', 'uploads', 'apps'),
      //   serveRoot: '/apps',
      // }
    ),
  ],
  controllers: [AppController],
  providers: [AppService, SshGateway, SshGatewayConnection, JwtService],
  exports: [JwtService],
})
export class AppModule {}
