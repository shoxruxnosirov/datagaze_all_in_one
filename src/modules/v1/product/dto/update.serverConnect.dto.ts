import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive } from 'class-validator';

export class ConnectDto {
  @IsString({ message: 'Host must be a string' })
  @IsNotEmpty({ message: 'Host cannot be empty' })
  host: string;

  @IsInt({ message: 'Port must be an integer' })
  @IsPositive({ message: 'Port must be a positive number' })
  port: number;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'Private key must be a string' })
  privateKey?: string;

  @IsOptional()
  @IsInt({ message: 'Ready timeout must be an integer' })
  @IsPositive({ message: 'Ready timeout must be a positive number' })
  readyTimeout?: number;
}
