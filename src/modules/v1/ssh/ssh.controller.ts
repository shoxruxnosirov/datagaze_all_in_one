import { Controller, Post } from '@nestjs/common';

@Controller('ssh')
export class SshController {

    @Post('connect')
    async connect() {

    }
    
}
