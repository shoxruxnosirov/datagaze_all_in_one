import { AuthType } from "src/comman/types";

export class ConnectDto {
  // server_id: string;
  host: string;
  port: string;
  username: string;
  // auth_type: AuthType;
  password?: string;
  private_key?: string;
}

// interface IServer {
//   server_id: string;
//   ip: string;
//   port: string;
//   username: string;
//   auth_type: 'password' | 'private_key'; 
//   password?: string; 
//   private_key?: string; 
// }

// export type ConnectDto = Omit<IServer, 'password' | 'private_key'> & (
//   {
//     auth_type: 'password';
//     password: string;
//   } | {
//     auth_type: 'private_key';
//     private_key: string;
//   }
// );
