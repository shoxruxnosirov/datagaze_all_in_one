import { IsInt, IsString, IsDate, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class ApplicationDto {

  @IsOptional()
  @IsUUID('4', { message: 'Computer ID must be a valid UUID' })
  computerId?: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @IsString({ message: 'Version must be a string' })
  @IsNotEmpty({ message: 'Version cannot be empty' })
  version: string;

  @IsDate({ message: 'Installed date must be a valid date' })
  @IsNotEmpty({ message: 'Installed date cannot be empty' })
  installed_date: Date;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: 'Type cannot be empty' })
  type: string;

  @IsInt({ message: 'Size must be an integer' })
  @IsNotEmpty({ message: 'Size cannot be empty' })
  size: number;
}
