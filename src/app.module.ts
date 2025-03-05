import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/v1/admins/admin.module';
import { SshModule } from './modules/v1/ssh/ssh.module';
import { ProductsModule } from './modules/v1/products/product.module';
import { SshGateway } from './modules/v1/ssh/ssh.gateway';
import { SshGatewayConnection } from './modules/v1/ssh/ssh.gatewayService';
import knexConfig from 'src/config/database.config';

@Module({
  imports: [
    AdminModule,
    SshModule,
    ProductsModule,
    KnexModule.forRoot({
      config: {
        client: knexConfig.client, 
        connection: knexConfig.connection,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, SshGateway, SshGatewayConnection],
})
export class AppModule { }
