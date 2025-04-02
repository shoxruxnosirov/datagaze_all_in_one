import {
  IsString,
  IsInt,
  IsArray,
  IsEnum,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class NetworkAdapterDto {
  @IsString({ message: 'NIC name must be a string' })
  @IsNotEmpty({ message: 'NIC name cannot be empty' })
  nic_name: string;

  @IsString({ message: 'IP address must be a string' })
  @IsNotEmpty({ message: 'IP address cannot be empty' })
  ip_address: string;

  @IsString({ message: 'MAC address must be a string' })
  @IsNotEmpty({ message: 'MAC address cannot be empty' })
  mac_address: string;

  @IsEnum(['Up', 'Down'], { message: "Available status must be either 'Up' or 'Down'" })
  @IsNotEmpty({ message: 'Available status cannot be empty' })
  available: 'Up' | 'Down';
}

class DiskDto {
  @IsString({ message: 'Drive name must be a string' })
  @IsNotEmpty({ message: 'Drive name cannot be empty' })
  drive_name: string;

  @IsInt({ message: 'Total size must be an integer' })
  @IsNotEmpty({ message: 'Total size cannot be empty' })
  total_size: number;

  @IsInt({ message: 'Available space must be an integer' })
  @IsNotEmpty({ message: 'Available space cannot be empty' })
  free_size: number;
}

export class CreateComputerDto {
  @IsOptional()
  @IsUUID('4', { message: 'Key must be a valid UUID' })
  key?: string;

  @IsString({ message: 'Hostname must be a string' })
  @IsNotEmpty({ message: 'Hostname cannot be empty' })
  hostname: string;

  @IsString({ message: 'Operating system must be a string' })
  @IsNotEmpty({ message: 'Operating system cannot be empty' })
  operation_system: string;

  @IsString({ message: 'Platform must be a string' })
  @IsNotEmpty({ message: 'Platform cannot be empty' })
  platform: string;

  @IsString({ message: 'Build number must be a string' })
  @IsNotEmpty({ message: 'Build number cannot be empty' })
  build_number: string;

  @IsString({ message: 'Version must be a string' })
  @IsNotEmpty({ message: 'Version cannot be empty' })
  version: string;

  @IsInt({ message: 'RAM must be an integer' })
  @IsNotEmpty({ message: 'RAM cannot be empty' })
  ram: number;

  @IsString({ message: 'CPU must be a string' })
  @IsNotEmpty({ message: 'CPU cannot be empty' })
  cpu: string;

  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  model?: string;

  @IsInt({ message: 'Cores must be an integer' })
  @IsNotEmpty({ message: 'Cores cannot be empty' })
  cores: number;

  @IsArray({ message: 'Network adapters must be an array' })
  @ValidateNested({ each: true })
  @Type(() => NetworkAdapterDto)
  @IsNotEmpty({ message: 'Network adapters cannot be empty' })
  network_adapters: NetworkAdapterDto[];

  @IsArray({ message: 'Disks must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DiskDto)
  @IsNotEmpty({ message: 'Disks cannot be empty' })
  disks: DiskDto[];
}
