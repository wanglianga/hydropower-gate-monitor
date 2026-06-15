import { useCallback } from 'react';
import SceneCanvas from '@/components/SceneCanvas';
import ControlPanel from '@/components/ControlPanel';
import StatusBar from '@/components/StatusBar';
import AlarmPanel from '@/components/AlarmPanel';
import GateDetailPanel from '@/components/GateDetailPanel';
import { useDamStore } from '@/store/useDamStore';

export default function Home() {
  const setSelectedGateId = useDamStore(state => state.setSelectedGateId);

  const handleGateClick = useCallback((gateId: string) => {
    setSelectedGateId(gateId);
  }, [setSelectedGateId]);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-slate-950">
      <SceneCanvas onGateClick={handleGateClick} />
      <StatusBar />
      <ControlPanel />
      <AlarmPanel />
      <GateDetailPanel />

      <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60 bg-slate-900/70 backdrop-blur-sm px-3 py-2 rounded-lg">
        水电站闸门三维监控系统 v1.0
      </div>
    </div>
  );
}
