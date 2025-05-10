import { IsString, IsOptional, MinLength, IsEmail, IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateAdminPasswordDto {
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password cannot be empty' })
  oldPassword: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}

export class UpdateAdminPasswordBySuperadminDto {
  @IsUUID('4', { message: 'Invalid UUID format' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  userId: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
