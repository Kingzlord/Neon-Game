import { useEffect, useRef, useState, useCallback } from 'react';
import { LEVELS, LevelDef } from './data/levels';
import { WEAPONS, WeaponDef } from './data/weapons';
import { GameEngine, GameStats } from './engine/GameEngine';
import { crazyGamesService, AdSimulationState } from './services/crazyGamesService';
import { soundService } from './services/soundService';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { DeathModal } from './components/DeathModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { PauseModal } from './components/PauseModal';
import { AdSimulationOverlay } from './components/AdSimulationOverlay';

const STORAGE_KEY = 'aether_forge_save_v1';

export function App() {
  const [unlockedLevelIds, setUnlockedLevelIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.unlockedLevelIds)) return parsed.unlockedLevelIds;
      }
    } catch {
      // ignore localStorage errors
    }
    return [1];
  });

  const [unlockedWeaponIds, setUnlockedWeaponIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.unlockedWeaponIds)) return parsed.unlockedWeaponIds;
      }
    } catch {
      // ignore localStorage errors
    }
    return [1];
  });

  // View State: 'menu' | 'playing'
  const [view, setView] = useState<'menu' | 'playing'>('menu');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals State
  const [isDeadModalOpen, setIsDeadModalOpen] = useState<boolean>(false);
  const [isPausedModalOpen, setIsPausedModalOpen] = useState<boolean>(false);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [completedStats, setCompletedStats] = useState<GameStats | null>(null);
  const [adSimState, setAdSimState] = useState<AdSimulationState | null>(null);

  // Live HUD State
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(100);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponDef>(WEAPONS[0]);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(400);
  const [bossMaxHp, setBossMaxHp] = useState<number>(400);
  const [bossPhase, setBossPhase] = useState<1 | 2>(1);
  const [activatedSwitchesCount, setActivatedSwitchesCount] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Save progression to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unlockedLevelIds,
          unlockedWeaponIds
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [unlockedLevelIds, unlockedWeaponIds]);

  // Initialize CrazyGames HTML5 SDK v3 on mount
  useEffect(() => {
    crazyGamesService.init();
    crazyGamesService.onSimulationStateChange((state) => {
      setAdSimState(state);
    });
  }, []);

  const currentLevel: LevelDef = LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];

  const syncHudFromEngine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setPlayerHp(engine.player.hp);
    setPlayerMaxHp(engine.player.maxHp);
    setCurrentWeapon(engine.getWeapon());
    setBossActive(engine.boss.active && !engine.boss.defeated);
    setBossHp(engine.boss.hp);
    setBossMaxHp(engine.boss.maxHp);
    setBossPhase(engine.boss.phase);
    setActivatedSwitchesCount(engine.activatedSwitches.size);
  }, []);

  const startLevel = useCallback(
    (levelId: number) => {
      setCurrentLevelId(levelId);
      setIsDeadModalOpen(false);
      setIsPausedModalOpen(false);
      setCompletedStats(null);
      setView('playing');

      // Unlock weapon for this level automatically
      setUnlockedWeaponIds((prev) => (prev.includes(levelId) ? prev : [...prev, levelId]));

      crazyGamesService.gameplayStart();
    },
    []
  );

  // Initialize & start GameEngine when canvas is mounted in 'playing' view
  useEffect(() => {
    if (view !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const lvl = LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
    const engine = new GameEngine(
      canvas,
      lvl,
      lvl.weaponUnlockedId,
      unlockedWeaponIds.includes(lvl.weaponUnlockedId)
        ? unlockedWeaponIds
        : [...unlockedWeaponIds, lvl.weaponUnlockedId],
      () => {
        // On Player Death
        crazyGamesService.gameplayStop();
        setIsDeadModalOpen(true);
      },
      (stats) => {
        // On Level Complete
        crazyGamesService.gameplayStop();
        setCompletedStats(stats);

        // Unlock next level and next weapon
        const nextId = Math.min(10, lvl.id + 1);
        setUnlockedLevelIds((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
        setUnlockedWeaponIds((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
      },
      () => {
        syncHudFromEngine();
      }
    );

    engineRef.current = engine;
    syncHudFromEngine();
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [view, currentLevelId, unlockedWeaponIds, syncHudFromEngine]);

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleUnlockAllSandbox = () => {
    setUnlockedLevelIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    setUnlockedWeaponIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  };

  const handleReviveSuccess = () => {
    setIsDeadModalOpen(false);
    if (engineRef.current) {
      engineRef.current.revivePlayer();
      syncHudFromEngine();
    }
  };

  const handleRestartLevel = () => {
    setIsDeadModalOpen(false);
    setIsPausedModalOpen(false);
    setCompletedStats(null);
    // Force re-mount of GameEngine
    setView('menu');
    setTimeout(() => {
      startLevel(currentLevelId);
    }, 25);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0F19]">
      {/* CrazyGames SDK v3 Local Simulation / Ad Status Overlay */}
      <AdSimulationOverlay simState={adSimState} />

      {view === 'menu' ? (
        <MainMenu
          unlockedLevelIds={unlockedLevelIds}
          unlockedWeaponIds={unlockedWeaponIds}
          onStartLevel={startLevel}
          onOpenMultiplayerModal={() => setIsMultiplayerModalOpen(true)}
          onUnlockAllSandbox={handleUnlockAllSandbox}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* HTML5 60FPS Game Canvas */}
          <canvas
            ref={canvasRef}
            className="block w-full h-full cursor-crosshair"
          />

          {/* HUD Overlay */}
          <HUD
            level={currentLevel}
            hp={playerHp}
            maxHp={playerMaxHp}
            currentWeapon={currentWeapon}
            unlockedWeaponIds={unlockedWeaponIds}
            onSelectWeapon={(id) => {
              if (engineRef.current) {
                engineRef.current.setWeapon(id);
                syncHudFromEngine();
              }
            }}
            bossActive={bossActive}
            bossHp={bossHp}
            bossMaxHp={bossMaxHp}
            bossName={currentLevel.boss.name}
            bossTitle={currentLevel.boss.title}
            bossPhase={bossPhase}
            activatedSwitchesCount={activatedSwitchesCount}
            totalSwitchesCount={currentLevel.switches.length}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => {
              if (engineRef.current) {
                engineRef.current.setPaused(true);
              }
              setIsPausedModalOpen(true);
            }}
          />

          {/* Death System Modal (REVIVE — Watch Ad & START OVER) */}
          {isDeadModalOpen && (
            <DeathModal
              levelId={currentLevel.id}
              levelName={currentLevel.name}
              onReviveSuccess={handleReviveSuccess}
              onRestartLevel={handleRestartLevel}
            />
          )}

          {/* Level Completion Modal (with Midgame Ad before continuing) */}
          {completedStats && (
            <LevelCompleteModal
              level={currentLevel}
              stats={completedStats}
              onNextLevel={() => {
                const nextId = Math.min(10, currentLevel.id + 1);
                startLevel(nextId);
              }}
              onReplayLevel={handleRestartLevel}
              onMainMenu={() => {
                crazyGamesService.gameplayStop();
                setView('menu');
              }}
            />
          )}

          {/* Pause Modal */}
          {isPausedModalOpen && (
            <PauseModal
              levelName={currentLevel.name}
              onResume={() => {
                setIsPausedModalOpen(false);
                if (engineRef.current) {
                  engineRef.current.setPaused(false);
                }
              }}
              onRestart={handleRestartLevel}
              onMainMenu={() => {
                setIsPausedModalOpen(false);
                crazyGamesService.gameplayStop();
                setView('menu');
              }}
            />
          )}
        </div>
      )}

      {/* Multiplayer Coming Soon Modal */}
      {isMultiplayerModalOpen && (
        <MultiplayerModal onClose={() => setIsMultiplayerModalOpen(false)} />
      )}
    </div>
  );
}

export default App;
