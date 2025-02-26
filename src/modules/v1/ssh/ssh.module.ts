import { Module } from '@nestjs/common';
import { SshService } from './ssh.service';
import { SshController } from './ssh.controller';
import { SshRepository } from 'src/database/repositories/ssh.repository';
import { SshConnection } from './ssh.connection';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [SshService, SshRepository, SshConnection, JwtService],
  controllers: [SshController],
})
export class SshModule {}
