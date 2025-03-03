import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/v1/admins/admin.module';
import { SshModule } from './modules/v1/ssh/ssh.module';
import { ProductsModule } from './modules/v1/products/product.module';
import { SshGateway } from './modules/v1/ssh/sshGateWay';

@Module({
  imports: [AdminModule, SshModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService, SshGateway],
})
export class AppModule {}
