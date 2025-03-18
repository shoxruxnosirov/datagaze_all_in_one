export interface IApplication {
    id?: string;
    remoteId?: string;
    computerId?: string;
    name: string;
    version: string;
    installed_date: Date;
    type: string;
    size: number;
  }
  