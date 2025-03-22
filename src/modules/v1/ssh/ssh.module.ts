import { Module } from '@nestjs/common';
import { SshService } from './ssh.service';
import { SshController } from './ssh.controller';
import { SshRepository } from 'src/database/repositories/server.repository';
import { SshConnection } from './ssh.connection';
import { JwtService } from '@nestjs/jwt';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  providers: [SshService, SshRepository, SshConnection, JwtService, ProductRepository],
  controllers: [SshController],
})
export class SshModule {}
