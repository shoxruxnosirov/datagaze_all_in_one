export interface INetworkAdapter {
    nic_name: string;
    ip_address: string;
    mac_address: string;
    available: "Up" | "Down"; // Faqat "Up" yoki "Down" bo'lishi mumkin
  }
  
  export interface IDisk {
    drive_name: string;
    drive_type: string;
    total_size: number;
    available_space: number;
  }
  
  export interface IComputer {
    hostname: string;
    operation_system: string;
    platform: string;
    build_number: string;
    version: string;
    ram: number;
    cpu: string;
    model: string;
    cores: number;
    network_adapters: INetworkAdapter[];
    disks: IDisk[];
  }
  