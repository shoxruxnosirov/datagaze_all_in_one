import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon cannot be empty' })
  icon: string;

  @IsString({ message: 'Server version must be a string' })
  @IsNotEmpty({ message: 'Server version cannot be empty' })
  serverVersion: string;

  @IsString({ message: 'Agent version must be a string' })
  @IsNotEmpty({ message: 'Agent version cannot be empty' })
  agentVersion: string;

  @IsString({ message: 'Server file path must be a string' })
  @IsNotEmpty({ message: 'Server file path cannot be empty' })
  serverFilePath: string;

  @IsInt({ message: 'Server file size must be an integer' })
  @IsPositive({ message: 'Server file size must be a positive number' })
  serverFileSize: number;

  @IsString({ message: 'Agent file path must be a string' })
  @IsNotEmpty({ message: 'Agent file path cannot be empty' })
  agentFilePath: string;

  @IsInt({ message: 'Agent file size must be an integer' })
  @IsPositive({ message: 'Agent file size must be a positive number' })
  agentFileSize: number;

  @IsString({ message: 'Publisher must be a string' })
  @IsNotEmpty({ message: 'Publisher cannot be empty' })
  publisher: string;

  @IsString({ message: 'Install script must be a string' })
  @IsNotEmpty({ message: 'Install script cannot be empty' })
  installScript: string;

  @IsString({ message: 'Update script must be a string' })
  @IsNotEmpty({ message: 'Update script cannot be empty' })
  updateScript: string;

  @IsString({ message: 'Delete script must be a string' })
  @IsNotEmpty({ message: 'Delete script cannot be empty' })
  deleteScript: string;
}
