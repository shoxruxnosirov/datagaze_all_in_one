import { AuthType } from "src/comman/types";

export class ConnectDto {
  // serverId: string;
  host: string;
  port: string;
  username: string;
  // authType: AuthType;
  password?: string;
  privateKey?: string;
}

// interface IServer {
//   serverId: string;
//   ip: string;
//   port: string;
//   username: string;
//   authType: 'password' | 'privateKey'; 
//   password?: string; 
//   privateKey?: string; 
// }

// export type ConnectDto = Omit<IServer, 'password' | 'privateKey'> & (
//   {
//     authType: 'password';
//     password: string;
//   } | {
//     authType: 'privateKey';
//     privateKey: string;
//   }
// );
