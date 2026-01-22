export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioFrequencyData {
  values: Uint8Array;
}

export interface MessageLog {
  id: string;
  sender: 'user' | 'agent';
  text?: string;
  timestamp: number;
}
