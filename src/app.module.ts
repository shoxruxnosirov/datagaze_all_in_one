import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/v1/admins/admin.module';
import { SshModule } from './modules/v1/ssh/ssh.module';

@Module({
  imports: [AdminModule, SshModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
