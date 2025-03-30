import { IsString, IsInt, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NetworkAdapterDto {
  @IsString()
  nic_name: string;

  @IsString()
  ip_address: string;

  @IsString()
  mac_address: string;

  @IsEnum(['Up', 'Down'])
  available: 'Up' | 'Down';
}

class DiskDto {
  @IsString()
  drive_name: string;

  @IsString()
  drive_type: string;

  @IsInt()
  total_size: number;

  @IsInt()
  available_space: number;
}

export class CreateComputerDto {
  key?: string;

  @IsString()
  hostname: string;

  @IsString()
  operation_system: string;

  @IsString()
  platform: string;

  @IsString()
  build_number: string;

  @IsString()
  version: string;

  @IsInt()
  ram: number;

  @IsString()
  cpu: string;

  @IsString()
  model: string;

  @IsInt()
  cores: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkAdapterDto)
  network_adapters: NetworkAdapterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiskDto)
  disks: DiskDto[];
}
