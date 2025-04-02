import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Role } from 'src/comman/types';

export class CreateAdminDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of the following values: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;

  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
