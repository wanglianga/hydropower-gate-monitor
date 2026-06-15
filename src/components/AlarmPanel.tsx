import { useDamStore } from '@/store/useDamStore';
import { Bell, X, AlertTriangle, AlertCircle } from 'lucide-react';

export default function AlarmPanel() {
  const { alarms, clearAlarm } = useDamStore();

  const warningCount = alarms.filter(a => a.type === 'warning').length;
  const alarmCount = alarms.filter(a => a.type === 'alarm').length;

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 w-80 max-h-72 overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h2 className="font-semibold">告警信息</h2>
          <div className="flex gap-1">
            {alarmCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {alarmCount} 告警
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {warningCount} 预警
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-56">
        {alarms.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            暂无告警信息
          </div>
        ) : (
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
