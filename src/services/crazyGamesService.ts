// CrazyGames HTML5 SDK v3 Service Wrapper
// Documentation: https://docs.crazygames.com/sdk/html5-v3/

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

export type AdType = 'midgame' | 'rewarded';

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        init: () => Promise<void>;
        environment?: string;
        ad: {
          requestAd: (type: AdType, callbacks: CrazyGamesAdCallbacks) => void;
        };
        game: {
          gameplayStart: () => void;
          gameplayStop: () => void;
          happytime: () => void;
        };
      };
    };
  }
}

export interface AdSimulationState {
  active: boolean;
  type: AdType;
  reason: string;
  progress: number;
}

class CrazyGamesService {
  private initialized: boolean = false;
  private isInitializing: boolean = false;
  private simulationListener: ((state: AdSimulationState | null) => void) | null = null;

  public async init(): Promise<void> {
    if (this.initialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init();
        this.initialized = true;
        console.log('[CrazyGames SDK v3] Initialized successfully. Environment:', window.CrazyGames.SDK.environment);
      } else {
        console.log('[CrazyGames SDK v3] Running in local/standalone browser environment.');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[CrazyGames SDK v3] Init warning (continuing with local fallback):', error);
      this.initialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  public onSimulationStateChange(listener: (state: AdSimulationState | null) => void) {
    this.simulationListener = listener;
  }

  public gameplayStart() {
    try {
      if (window.CrazyGames?.SDK?.game) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.debug('[CrazyGames SDK v3] gameplayStart ignored:', e);
    }
  }

  public gameplayStop() {
    try {
      if (window.CrazyGames?.SDK?.game) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.debug('[CrazyGames SDK v3] gameplayStop ignored:', e);
    }
  }

  public happytime() {
    try {
      if (window.CrazyGames?.SDK?.game) {
        window.CrazyGames.SDK.game.happytime();
      }
    } catch (e) {
      console.debug('[CrazyGames SDK v3] happytime ignored:', e);
    }
  }

  /**
   * Requests a Midgame or Rewarded Ad from CrazyGames SDK v3.
   * Always resolves cleanly so gameplay never hangs or blocks, even if adblock is active or running on localhost.
   */
  public requestAd(
    type: AdType,
    onComplete: (rewardGranted: boolean) => void
  ): void {
    this.gameplayStop();

    let settled = false;
    const finish = (rewarded: boolean) => {
      if (settled) return;
      settled = true;
      if (this.simulationListener) {
        this.simulationListener(null);
      }
      this.gameplayStart();
      onComplete(rewarded);
    };

    // Safety timeout so the game never locks up if an ad network request hangs
    const safetyTimer = setTimeout(() => {
      if (!settled) {
        console.warn(`[CrazyGames SDK v3] Ad request (${type}) timed out. Proceeding gracefully.`);
        finish(true);
      }
    }, 5500);

    try {
      const sdk = window.CrazyGames?.SDK;
      const env = sdk?.environment || 'local';

      // If SDK is available and not disabled, call requestAd
      if (sdk && sdk.ad && env !== 'disabled') {
        sdk.ad.requestAd(type, {
          adStarted: () => {
            console.log(`[CrazyGames SDK v3] ${type.toUpperCase()} Ad started.`);
          },
          adFinished: () => {
            clearTimeout(safetyTimer);
            console.log(`[CrazyGames SDK v3] ${type.toUpperCase()} Ad finished.`);
            finish(true);
          },
          adError: (err: unknown) => {
            clearTimeout(safetyTimer);
            console.info(`[CrazyGames SDK v3] ${type.toUpperCase()} Ad error/unfilled in environment (${env}). Using graceful fallback:`, err);
            // Run brief local SDK visual fallback so user sees the ad lifecycle clearly
            this.runLocalFallbackSimulation(type, () => finish(true));
          }
        });
      } else {
        clearTimeout(safetyTimer);
        this.runLocalFallbackSimulation(type, () => finish(true));
      }
    } catch (err) {
      clearTimeout(safetyTimer);
      console.info('[CrazyGames SDK v3] Exception calling requestAd, using fallback:', err);
      this.runLocalFallbackSimulation(type, () => finish(true));
    }
  }

  private runLocalFallbackSimulation(type: AdType, onDone: () => void) {
    const durationMs = type === 'rewarded' ? 1800 : 1200;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));

      if (this.simulationListener) {
        this.simulationListener({
          active: true,
          type,
          reason: 'CrazyGames SDK v3 (Local / Test Environment)',
          progress
        });
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        if (this.simulationListener) {
          this.simulationListener(null);
        }
        onDone();
      }
    };

    requestAnimationFrame(tick);
  }
}

export const crazyGamesService = new CrazyGamesService();
