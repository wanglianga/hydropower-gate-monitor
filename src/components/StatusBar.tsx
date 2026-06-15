import { useDamStore } from '@/store/useDamStore';
import { Waves, Droplets, Gauge, Activity, Zap } from 'lucide-react';

export default function StatusBar() {
  const { upstreamWaterLevel, downstreamWaterLevel, waterFlow, gates, operationMode } = useDamStore();

  const avgLoad = gates.reduce((sum, g) => sum + g.load, 0) / gates.length;
  const alarmGates = gates.filter(g => g.status === 'alarm').length;
  const warningGates = gates.filter(g => g.status === 'warning').length;

  const modeLabels: Record<string, { label: string; color: string }> = {
    normal: { label: '常规运行', color: 'bg-green-500' },
    maintenance: { label: '检修模式', color: 'bg-yellow-500' },
    flood: { label: '泄洪模式', color: 'bg-blue-500' },
    emergency: { label: '应急模式', color: 'bg-red-500 animate-pulse' }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 px-6 py-3">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${modeLabels[operationMode].color}`} />
          <span className="text-sm font-medium">{modeLabels[operationMode].label}</span>
        </div>

        <div className="h-6 w-px bg-slate-600" />

        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-blue-400" />
          <div className="text-sm">
            <span className="text-slate-400">上游水位: </span>
            <span className="font-mono font-medium text-blue-400">
              {upstreamWaterLevel.toFixed(1)}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <div className="text-sm">
            <span className="text-slate-400">下游水位: </span>
            <span className="font-mono font-medium text-cyan-400">
              {downstreamWaterLevel.toFixed(1)}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <div className="text-sm">
            <span className="text-slate-400">流量: </span>
            <span className="font-mono font-medium text-green-400">
              {waterFlow.toFixed(0)} m³/s
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-600" />

        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-orange-400" />
          <div className="text-sm">
            <span className="text-slate-400">平均负载: </span>
            <span className="font-mono font-medium text-orange-400">
              {avgLoad.toFixed(1)}t
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="text-sm">
            <span className="text-slate-400">闸门状态: </span>
            <span className="font-mono">
              <span className="text-green-400">{gates.length - alarmGates - warningGates}正常</span>
              {warningGates > 0 && (
                <span className="text-yellow-400"> / {warningGates}预警</span>
              )}
              {alarmGates > 0 && (
                <span className="text-red-400"> / {alarmGates}告警</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
