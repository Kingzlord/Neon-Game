// Modular Network Service Architecture for Single-Player & Future Photon Multiplayer Expansion

export interface PlayerNetState {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  aimAngle: number;
  weaponId: number;
  health: number;
  isAttacking: boolean;
}

export interface RoomInfo {
  roomId: string;
  region: string;
  playerCount: number;
  maxPlayers: number;
  levelId: number;
}

export interface INetworkAdapter {
  readonly mode: 'singleplayer' | 'photon-multiplayer';
  connect(appId?: string, region?: string): Promise<boolean>;
  disconnect(): void;
  sendPlayerState(state: PlayerNetState): void;
  onRemotePlayerUpdate(callback: (players: PlayerNetState[]) => void): void;
  getStatus(): { connected: boolean; latencyMs: number; region: string; provider: string };
}

export class SinglePlayerAdapter implements INetworkAdapter {
  public readonly mode = 'singleplayer' as const;

  public async connect(): Promise<boolean> {
    return true;
  }

  public disconnect(): void {}

  public sendPlayerState(_state: PlayerNetState): void {
    // Local session loop handles player state directly
  }

  public onRemotePlayerUpdate(_callback: (players: PlayerNetState[]) => void): void {}

  public getStatus() {
    return {
      connected: true,
      latencyMs: 0,
      region: 'local-loopback',
      provider: 'Local Single-Player Engine'
    };
  }
}

export class PhotonMultiplayerAdapter implements INetworkAdapter {
  public readonly mode = 'photon-multiplayer' as const;
  private connected: boolean = false;
  private region: string = 'eu-central-1';

  public async connect(_appId?: string, region: string = 'eu-central-1'): Promise<boolean> {
    this.region = region;
    // Modular stub for Photon Realtime SDK (Photon-Javascript_SDK.js)
    console.info(`[PhotonMultiplayerAdapter] Ready to initialize Photon LoadBalancingClient in region: ${region}`);
    this.connected = false; // Multiplayer is marked Coming Soon in UI
    return false;
  }

  public disconnect(): void {
    this.connected = false;
  }

  public sendPlayerState(_state: PlayerNetState): void {}

  public onRemotePlayerUpdate(_callback: (players: PlayerNetState[]) => void): void {}

  public getStatus() {
    return {
      connected: this.connected,
      latencyMs: 24,
      region: this.region,
      provider: 'Photon Realtime LoadBalancing v4 (Modular Ready)'
    };
  }
}

export class NetworkService {
  private adapter: INetworkAdapter;

  constructor() {
    this.adapter = new SinglePlayerAdapter();
  }

  public setAdapter(adapter: INetworkAdapter) {
    this.adapter.disconnect();
    this.adapter = adapter;
  }

  public getAdapter(): INetworkAdapter {
    return this.adapter;
  }
}

export const networkService = new NetworkService();
