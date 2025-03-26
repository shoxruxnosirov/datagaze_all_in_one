import { Socket } from "socket.io";
import { Channel} from 'ssh2';
import * as pty from 'node-pty';

export interface ISession {
    socket: Socket;
    shell: Channel | null,// | {write: (com: string) => void, end: () => void};
    ptyTerm: pty.IPty | null;
    // skipFunc: {
    //     skipSlashNs: ((value: number) => void) | null
    //     skipData: ((value: number) => void) | null
    // };
}