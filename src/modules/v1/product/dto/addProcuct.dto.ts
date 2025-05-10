import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Icon must be a string' })
  icon?: string;

  @IsString({ message: 'Server version must be a string' })
  @IsNotEmpty({ message: 'Server version cannot be empty' })
  serverVersion: string;

  @IsString({ message: 'Agent version must be a string' })
  @IsNotEmpty({ message: 'Agent version cannot be empty' })
  agentVersion: string;

  @IsOptional()
  @IsString({ message: 'Server file path must be a string' })
  serverFilePath?: string;

  @IsOptional()
  @IsInt({ message: 'Server file size must be an integer' })
  @IsPositive({ message: 'Server file size must be a positive number' })
  serverFileSize?: number;

  @IsOptional()
  @IsString({ message: 'Agent file path must be a string' })
  agentFilePath?: string;

  @IsOptional()
  @IsInt({ message: 'Agent file size must be an integer' })
  @IsPositive({ message: 'Agent file size must be a positive number' })
  agentFileSize?: number;

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
