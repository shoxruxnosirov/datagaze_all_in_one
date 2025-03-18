import { IsInt, IsString, IsDate } from 'class-validator';

export class ApplicationDto {
  id?: string;

  remoteId?: string;

  computerId?: string;

  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsDate()
  installed_date: Date;

  @IsString()
  type: string;

  @IsInt()
  size: number;
}
