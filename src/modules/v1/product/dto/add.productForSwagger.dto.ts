import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDtoForSwagger {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Icon of Product',
        required: true
    })
    icon: Express.Multer.File;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Server executable file',
        required: true
    })
    server: Express.Multer.File;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Agent executable file',
        required: true
    })
    agent: Express.Multer.File;

    @ApiProperty({
        type: String,
        description: 'Name of Product',
        example: 'Datagaze DLP',
        required: true
    })
    name: string;

    @ApiProperty({
        type: String,
        description: 'Server Version',
        example: '2.2.2',
        required: true
    })
    serverVersion: string;

    @ApiProperty({
        type: String,
        description: 'Agent Version',
        example: '2.3.1',
        required: true
    })
    agentVersion: string;

    @ApiProperty({
        type: String,
        description: 'Publisher information',
        example: 'Datagaze LLC',
        required: true
    })
    publisher: string;

    @ApiProperty({
        type: String,
        // format: 'textarea',
        description: 'Installation script',
        example: `ls -la .`,
        required: true
    })
    installScript: string;

    @ApiProperty({
        type: String,
        // format: 'textarea',
        description: 'Update script',
        example: 'pwd',
        required: true
    })
    updateScript: string;

    @ApiProperty({
        type: String,
        // format: 'textarea',
        description: 'Delete script',
        example: 'rm app.exe',
        required: true
    })
    deleteScript: string;
}