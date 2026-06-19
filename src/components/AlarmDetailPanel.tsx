import { useDamStore, AlarmSeverity, AlarmCategory } from '@/store/useDamStore';
import { X, Clock, Activity, Gauge, AlertTriangle, Wrench, Radio, Waves, Crosshair, ChevronRight, ShieldAlert } from 'lucide-react';

interface AlarmDetailPanelProps {
  sceneRef: React.RefObject<{ focusOnAlarm: (alarmId: string) => void } | null>;
}

const severityConfig: Record<AlarmSeverity, { label: string; color: string; bg: string; border: string; icon: typeof ShieldAlert }> = {
  red: { label: '紧急', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', icon: ShieldAlert },
  orange: { label: '严重', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', icon: AlertTriangle },
  yellow: { label: '一般', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', icon: AlertTriangle }
};

const categoryConfig: Record<AlarmCategory, { label: string; icon: typeof Waves; color: string }> = {
  waterLevel: { label: '水位超限', icon: Waves, color: 'text-blue-400' },
  gateDeviation: { label: '闸门开度偏差', icon: Gauge, color: 'text-purple-400' },
  hoistLoad: { label: '启闭机负载异常', icon: Activity, color: 'text-orange-400' },
  communication: { label: '通信中断', icon: Radio, color: 'text-red-400' }
};

export default function AlarmDetailPanel({ sceneRef }: AlarmDetailPanelProps) {
  const { gradedAlarms, selectedAlarmId, setSelectedAlarmId, resolveGradedAlarm, gates } = useDamStore();

  const selectedAlarm = gradedAlarms.find(a => a.id === selectedAlarmId && !a.resolved);
  if (!selectedAlarm) return null;

  const sevConfig = severityConfig[selectedAlarm.severity];
  const catConfig = categoryConfig[selectedAlarm.category];
  const SevIcon = sevConfig.icon;
  const CatIcon = catConfig.icon;

  const relatedGates = gates.filter(g =>
    selectedAlarm.relatedDeviceIds.includes(g.id) || g.id === selectedAlarm.gateId
  );

  const handleClose = () => {
    setSelectedAlarmId(null);
  };

  const handleFocus = () => {
    if (sceneRef.current) {
      sceneRef.current.focusOnAlarm(selectedAlarm.id);
    }
  };

  const handleResolve = () => {
    resolveGradedAlarm(selectedAlarm.id);
  };

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900/95 backdrop-blur-md rounded-2xl text-white shadow-2xl border ${sevConfig.border} w-96 overflow-hidden`}>
      <div className={`${sevConfig.bg} p-4 border-b ${sevConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${sevConfig.bg}`}>
              <SevIcon className={`w-6 h-6 ${sevConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${sevConfig.bg} ${sevConfig.color}`}>
                  {sevConfig.label}
                </span>
                <div className="flex items-center gap-1">
                  <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                  <span className="text-sm font-medium">{catConfig.label}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {selectedAlarm.gateId ? gates.find(g => g.id === selectedAlarm.gateId)?.name : '系统级'}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">当前值</div>
            <div className={`text-xl font-bold font-mono ${sevConfig.color}`}>
              {selectedAlarm.currentValue.toFixed(1)}
              <span className="text-sm text-slate-400 ml-1">{selectedAlarm.unit}</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">阈值</div>
            <div className="text-xl font-bold font-mono text-slate-300">
              {selectedAlarm.threshold.toFixed(1)}
              <span className="text-sm text-slate-400 ml-1">{selectedAlarm.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">触发时间：</span>
            <span>{selectedAlarm.triggerTime}</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">建议处置动作</span>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">{selectedAlarm.suggestedAction}</p>
        </div>

        {relatedGates.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-sm font-medium text-slate-300 mb-2">关联设备</div>
            <div className="space-y-1.5">
              {relatedGates.map(gate => (
                <div
                  key={gate.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      gate.status === 'alarm' ? 'bg-red-400' :
                      gate.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-sm">{gate.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>开度 {gate.opening.toFixed(1)}%</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleFocus}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Crosshair className="w-4 h-4" />
            聚焦定位
          </button>
          <button
            onClick={handleResolve}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              selectedAlarm.severity === 'red'
                ? 'bg-red-600 hover:bg-red-500'
                : selectedAlarm.severity === 'orange'
                  ? 'bg-orange-600 hover:bg-orange-500'
                  : 'bg-yellow-600 hover:bg-yellow-500'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            处置完成
          </button>
        </div>
      </div>
    </div>
  );
}
