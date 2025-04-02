import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAdminDto {
  @IsString()
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  // @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
