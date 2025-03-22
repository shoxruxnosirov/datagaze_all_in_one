import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/v1/admin/admin.module';
import { SshModule } from './modules/v1/ssh/ssh.module';
import { ProductsModule } from './modules/v1/product/product.module';
import { SshGateway } from './modules/v1/ssh/terminal/ssh.gateway';
import { SshGatewayConnection } from './modules/v1/ssh/terminal/ssh.gatewayService';
import knexConfig from 'src/config/database.config';
import { ComputersModule } from './modules/v1/computer/copmuter.module';
import { AgentsModule } from './modules/v1/agent/agent.module';
import { AgentGateway } from './modules/v1/agent/gateway/agent.gateway';
import { FrontendGateway } from './modules/v1/computer/gateway/computer.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    AdminModule,
    SshModule,
    ProductsModule,
    ComputersModule,
    AgentsModule,
    KnexModule.forRoot({
      config: {
        client: knexConfig.client, 
        connection: knexConfig.connection,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, SshGateway, SshGatewayConnection, AgentGateway, FrontendGateway, JwtService],
  exports: [JwtService]
})
export class AppModule { }
