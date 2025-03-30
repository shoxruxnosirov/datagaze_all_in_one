export class ConnectDto {
  host: string;
  port: string;
  username: string;
  password?: string;
  privateKey?: string;
  readyTimeout?: number;
}
