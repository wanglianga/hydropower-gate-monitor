import { useDamStore } from '@/store/useDamStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { X, Activity, Thermometer, Waves, Gauge, Lock, User, Clock, Command } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GateDetailPanel() {
  const { selectedGateId, gates, setSelectedGateId, setGateOpening } = useDamStore();
  const gate = gates.find(g => g.id === selectedGateId);

  if (!gate || !selectedGateId) return null;

  const chartData = {
    labels: gate.openingHistory.map(h => h.time),
    datasets: [
      {
        label: '闸门开度 (%)',
        data: gate.openingHistory.map(h => h.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      }
    },
    maintainAspectRatio: false
  };

  const statusColors = {
    normal: 'text-green-400 bg-green-500/20',
    warning: 'text-yellow-400 bg-yellow-500/20',
    alarm: 'text-red-400 bg-red-500/20'
  };

  const statusLabels = {
    normal: '正常',
    warning: '预警',
    alarm: '告警'
  };

  const loadPercent = (gate.load / gate.maxLoad) * 100;

  return (
    <div className="absolute top-4 right-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 w-80 max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 pb-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            gate.status === 'alarm' ? 'bg-red-500 animate-pulse' :
            gate.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
          <h2 className="text-lg font-semibold">{gate.name}</h2>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[gate.status]}`}>
            {statusLabels[gate.status]}
          </span>
        </div>
        <button
          onClick={() => setSelectedGateId(null)}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>当前开度</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {gate.opening.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>负载</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {gate.load.toFixed(1)}
              <span className="text-sm text-slate-500">/{gate.maxLoad}t</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>负载进度</span>
            <span>{loadPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                loadPercent > 90 ? 'bg-red-500' :
                loadPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${loadPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            开度曲线 (24小时)
          </h3>
          <div className="h-32">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-slate-400 text-xs mb-1">振动</div>
            <div className="text-sm font-medium text-cyan-400">
              {gate.sensorData.vibration.toFixed(2)}
              <span className="text-xs text-slate-500">mm/s</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-slate-400 text-xs mb-1">
              <Thermometer className="w-3 h-3 inline" /> 温度
            </div>
            <div className="text-sm font-medium text-orange-400">
              {gate.sensorData.temperature.toFixed(1)}
              <span className="text-xs text-slate-500">°C</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-slate-400 text-xs mb-1">水压</div>
            <div className="text-sm font-medium text-blue-400">
              {gate.sensorData.waterPressure.toFixed(2)}
              <span className="text-xs text-slate-500">MPa</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            联锁状态
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">安全联锁</span>
            <span className={`text-sm font-medium ${
              gate.interlockStatus ? 'text-green-400' : 'text-red-400'
            }`}>
              {gate.interlockStatus ? '已投入' : '已解除'}
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Command className="w-4 h-4 text-yellow-400" />
            最近操作
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> 操作人
              </span>
              <span className="text-white">{gate.lastOperator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 时间
              </span>
              <span className="text-white text-xs">{gate.lastCommandTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">指令</span>
              <span className="text-white">{gate.lastCommand}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-medium mb-3">开度调节</h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={gate.targetOpening}
              onChange={(e) => setGateOpening(gate.id, parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-mono text-blue-400 w-12 text-right">
              {gate.targetOpening.toFixed(0)}%
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setGateOpening(gate.id, 0)}
              className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
            >
              全关
            </button>
            <button
              onClick={() => setGateOpening(gate.id, 50)}
              className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
            >
              半开
            </button>
            <button
              onClick={() => setGateOpening(gate.id, 100)}
              className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
            >
              全开
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
