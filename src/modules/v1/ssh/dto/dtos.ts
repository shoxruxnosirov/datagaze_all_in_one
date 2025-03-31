export class ConnectDto {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  readyTimeout?: number;
}
