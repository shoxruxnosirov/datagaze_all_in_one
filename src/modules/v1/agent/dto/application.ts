import { IsInt, IsString, IsDate, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class ApplicationDto {
  @IsOptional()
  @IsUUID('4', { message: 'Computer ID must be a valid UUID' })
  computerId?: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Version must be a string' })
  version?: string;

  @IsOptional()
  @IsDate({ message: 'Installed date must be a valid date' })
  installed_date?: Date;

  @IsOptional()
  @IsString({ message: 'Type must be a string' })
  type?: string;

  @IsOptional()
  @IsInt({ message: 'Size must be an integer' })
  size?: number;
}
