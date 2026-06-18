import { useDamStore, OperationMode } from '@/store/useDamStore';
import { Play, Settings, Eye, EyeOff, Zap, Wrench, Waves, AlertTriangle } from 'lucide-react';

const modes: { key: OperationMode; label: string; icon: typeof Zap; color: string }[] = [
  { key: 'normal', label: '常规运行', icon: Play, color: 'bg-green-500' },
  { key: 'maintenance', label: '检修模式', icon: Wrench, color: 'bg-yellow-500' },
  { key: 'flood', label: '泄洪模式', icon: Waves, color: 'bg-blue-500' },
  { key: 'emergency', label: '应急模式', icon: AlertTriangle, color: 'bg-red-500' },
];

export default function ControlPanel() {
  const { operationMode, setOperationMode, showLabels, setShowLabels, animationSpeed, setAnimationSpeed } = useDamStore();

  return (
    <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-2xl border border-slate-700 w-72">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
        <Settings className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold">控制面板</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">运行模式</h3>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = operationMode === mode.key;
              return (
                <button
                  key={mode.key}
                  onClick={() => setOperationMode(mode.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${mode.color} text-white shadow-lg scale-105`
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">显示标签</h3>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-lg transition-colors ${
                showLabels ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">动画速度</h3>
            <span className="text-xs text-slate-400">{animationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-2">操作提示</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• 左键拖拽：旋转视角</li>
            <li>• 右键拖拽：平移视角</li>
            <li>• 滚轮：缩放</li>
            <li>• 点击闸门：查看详情</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
