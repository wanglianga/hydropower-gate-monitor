import { useCallback, useRef } from 'react';
import SceneCanvas, { SceneCanvasRef } from '@/components/SceneCanvas';
import ControlPanel from '@/components/ControlPanel';
import StatusBar from '@/components/StatusBar';
import AlarmPanel from '@/components/AlarmPanel';
import GateDetailPanel from '@/components/GateDetailPanel';
import DispatchPanel from '@/components/DispatchPanel';
import FaultPanel from '@/components/FaultPanel';
import AlarmDetailPanel from '@/components/AlarmDetailPanel';
import { useDamStore } from '@/store/useDamStore';

export default function Home() {
  const setSelectedGateId = useDamStore(state => state.setSelectedGateId);
  const { triggerFocusAnimation, setFocusedFaultId, setSelectedAlarmId } = useDamStore();
  const sceneRef = useRef<SceneCanvasRef>(null);

  const handleGateClick = useCallback((gateId: string) => {
    setSelectedGateId(gateId);
  }, [setSelectedGateId]);

  const handleFaultClick = useCallback((faultId: string) => {
    triggerFocusAnimation(faultId);
    setFocusedFaultId(faultId);
    if (sceneRef.current) {
      sceneRef.current.focusOnFault(faultId);
    }
  }, [triggerFocusAnimation, setFocusedFaultId]);

  const handleAlarmClick = useCallback((alarmId: string) => {
    setSelectedAlarmId(alarmId);
    if (sceneRef.current) {
      sceneRef.current.focusOnAlarm(alarmId);
    }
  }, [setSelectedAlarmId]);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-slate-950">
      <SceneCanvas
        ref={sceneRef}
        onGateClick={handleGateClick}
        onFaultClick={handleFaultClick}
        onAlarmClick={handleAlarmClick}
      />
      <StatusBar />
      <ControlPanel />
      <DispatchPanel />
      <AlarmPanel sceneRef={sceneRef} />
      <GateDetailPanel />
      <FaultPanel sceneRef={sceneRef} />
      <AlarmDetailPanel sceneRef={sceneRef} />

      <div className="absolute bottom-4 left-84 z-10 text-xs text-white/60 bg-slate-900/70 backdrop-blur-sm px-3 py-2 rounded-lg">
        水电站闸门三维监控系统 v1.0
      </div>
    </div>
  );
}
