import { useDamStore, AlarmSeverity, AlarmCategory } from '@/store/useDamStore';
import { Bell, X, AlertTriangle, AlertCircle, ShieldAlert, Crosshair, Waves, Gauge, Activity, Radio, Eye } from 'lucide-react';

interface AlarmPanelProps {
  sceneRef: React.RefObject<{ focusOnAlarm: (alarmId: string) => void } | null>;
}

const severityConfig: Record<AlarmSeverity, { label: string; color: string; bg: string; dot: string }> = {
  red: { label: '紧急', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  orange: { label: '严重', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  yellow: { label: '一般', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-500' }
};

const categoryConfig: Record<AlarmCategory, { label: string; icon: typeof Waves; shortLabel: string }> = {
  waterLevel: { label: '水位超限', icon: Waves, shortLabel: '水位' },
  gateDeviation: { label: '闸门开度偏差', icon: Gauge, shortLabel: '开度' },
  hoistLoad: { label: '启闭机负载异常', icon: Activity, shortLabel: '负载' },
  communication: { label: '通信中断', icon: Radio, shortLabel: '通信' }
};

export default function AlarmPanel({ sceneRef }: AlarmPanelProps) {
  const { alarms, clearAlarm, gradedAlarms, alarmOverviewMode, setSelectedAlarmId, resolveGradedAlarm } = useDamStore();

  const activeGradedAlarms = gradedAlarms.filter(a => !a.resolved);
  const redCount = activeGradedAlarms.filter(a => a.severity === 'red').length;
  const orangeCount = activeGradedAlarms.filter(a => a.severity === 'orange').length;
  const yellowCount = activeGradedAlarms.filter(a => a.severity === 'yellow').length;

  const warningCount = alarms.filter(a => a.type === 'warning').length;
  const alarmCount = alarms.filter(a => a.type === 'alarm').length;

  const handleAlarmClick = (alarmId: string) => {
    setSelectedAlarmId(alarmId);
    if (sceneRef.current) {
      sceneRef.current.focusOnAlarm(alarmId);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 w-80 max-h-72 overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h2 className="font-semibold">告警信息</h2>
          <div className="flex gap-1">
            {redCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {redCount}
              </span>
            )}
            {orangeCount > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {orangeCount}
              </span>
            )}
            {yellowCount > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {yellowCount}
              </span>
            )}
            {alarmCount > 0 && !activeGradedAlarms.length && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {alarmCount} 告警
              </span>
            )}
            {warningCount > 0 && !activeGradedAlarms.length && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {warningCount} 预警
              </span>
            )}
          </div>
        </div>
        {alarmOverviewMode && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded animate-pulse">
            <Eye className="w-3 h-3" />
            总览模式
          </div>
        )}
      </div>

      <div className="overflow-y-auto max-h-56">
        {activeGradedAlarms.length > 0 && (
          <div className="divide-y divide-slate-700/50">
            {activeGradedAlarms
              .sort((a, b) => {
                const sevOrder = { red: 0, orange: 1, yellow: 2 };
                return sevOrder[a.severity] - sevOrder[b.severity] || b.priority - a.priority;
              })
              .map((alarm) => {
                const sev = severityConfig[alarm.severity];
                const cat = categoryConfig[alarm.category];
                const CatIcon = cat.icon;
                return (
                  <div
                    key={alarm.id}
                    className={`p-2.5 hover:bg-slate-800/50 transition-colors cursor-pointer ${sev.bg}`}
                    onClick={() => handleAlarmClick(alarm.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className={`p-1 rounded ${sev.bg} flex-shrink-0 mt-0.5`}>
                          <CatIcon className={`w-3.5 h-3.5 ${sev.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${alarm.severity === 'red' ? 'animate-pulse' : ''}`} />
                            <span className="text-xs text-slate-400">{sev.label}</span>
                            <span className="text-sm font-medium truncate">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className={`font-mono ${sev.color}`}>
                              {alarm.currentValue.toFixed(1)}{alarm.unit}
                            </span>
                            <span>阈值 {alarm.threshold.toFixed(1)}{alarm.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAlarmClick(alarm.id); }}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title="聚焦定位"
                        >
                          <Crosshair className="w-3 h-3 text-blue-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); resolveGradedAlarm(alarm.id); }}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title="处置完成"
                        >
                          <ShieldAlert className="w-3 h-3 text-green-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {activeGradedAlarms.length === 0 && alarms.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            暂无告警信息
          </div>
        )}

        {activeGradedAlarms.length === 0 && alarms.length > 0 && (
          <div className="divide-y divide-slate-700/50">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3 hover:bg-slate-800/50 transition-colors ${
                  alarm.type === 'alarm' ? 'bg-red-500/5' : 'bg-yellow-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {alarm.type === 'alarm' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alarm.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{alarm.location}</span>
                        <span>·</span>
                        <span>{alarm.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => clearAlarm(alarm.id)}
                    className="p-0.5 rounded hover:bg-slate-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
