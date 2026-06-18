import { useState, useEffect } from 'react';
import { useDamStore, FaultType, FaultInfo } from '@/store/useDamStore';
import { AlertTriangle, MapPin, Users, Clock, Wrench, Radio, Zap, Target, Check, X, ChevronDown, ChevronUp, Building2, Warehouse, CircleDot } from 'lucide-react';
import { SceneCanvasRef } from './SceneCanvas';

interface FaultPanelProps {
  sceneRef: React.RefObject<SceneCanvasRef | null>;
}

const faultTypeConfig: Record<FaultType, { label: string; icon: typeof Zap; color: string }> = {
  overload: { label: '设备过载', icon: Zap, color: 'text-red-400' },
  brake: { label: '制动异常', icon: Wrench, color: 'text-orange-400' },
  limit: { label: '限位信号丢失', icon: Radio, color: 'text-yellow-400' },
  communication: { label: '通信中断', icon: Radio, color: 'text-purple-400' }
};

export default function FaultPanel({ sceneRef }: FaultPanelProps) {
  const { gates, acknowledgeFault, clearFault, triggerFocusAnimation, setFocusedFaultId, addFault } = useDamStore();
  const [expandedFault, setExpandedFault] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFaultType, setNewFaultType] = useState<FaultType>('overload');
  const [newFaultGateId, setNewFaultGateId] = useState('');
  const [newFaultDesc, setNewFaultDesc] = useState('');
  const [focusingFaultId, setFocusingFaultId] = useState<string | null>(null);

  const allFaults: (FaultInfo & { gateName: string })[] = [];
  gates.forEach(gate => {
    gate.faults.forEach(fault => {
      allFaults.push({ ...fault, gateName: gate.name });
    });
  });

  const activeFaults = allFaults.filter(f => !f.acknowledged);
  const acknowledgedFaults = allFaults.filter(f => f.acknowledged);

  const handleFocus = (faultId: string) => {
    triggerFocusAnimation(faultId);
    if (sceneRef.current) {
      sceneRef.current.focusOnFault(faultId);
    }
    setFocusingFaultId(faultId);
    setFocusedFaultId(faultId);

    setTimeout(() => {
      setFocusingFaultId(null);
    }, 3000);
  };

  const handleAddFault = () => {
    if (!newFaultGateId) return;

    const gate = gates.find(g => g.id === newFaultGateId);
    if (!gate) return;

    addFault(newFaultGateId, {
      type: newFaultType,
      description: newFaultDesc || faultTypeConfig[newFaultType].label,
      severity: newFaultType === 'overload' || newFaultType === 'communication' ? 'alarm' : 'warning',
      location: {
        damTop: { x: gate.position.x, y: 78, z: 8 },
        machineRoom: { x: gate.position.x, y: 75, z: 2 },
        gateHole: { x: gate.position.x, y: 15, z: 0 }
      },
      responsibleTeam: getResponsibleTeam(newFaultType),
      estimatedRepairTime: getEstimatedRepairTime(newFaultType)
    });

    setShowAddForm(false);
    setNewFaultDesc('');
  };

  const getResponsibleTeam = (type: FaultType): string => {
    switch (type) {
      case 'overload': return '机械一班';
      case 'brake': return '机械二班';
      case 'limit': return '电控一班';
      case 'communication': return '通信班';
      default: return '运维班';
    }
  };

  const getEstimatedRepairTime = (type: FaultType): string => {
    switch (type) {
      case 'overload': return '约 2 小时';
      case 'brake': return '约 3 小时';
      case 'limit': return '约 1 小时';
      case 'communication': return '约 30 分钟';
      default: return '待评估';
    }
  };

  useEffect(() => {
    if (gates.length > 0 && !newFaultGateId) {
      setNewFaultGateId(gates[0].id);
    }
  }, [gates, newFaultGateId]);

  const FaultCard = ({ fault }: { fault: FaultInfo & { gateName: string } }) => {
    const config = faultTypeConfig[fault.type];
    const Icon = config.icon;
    const isExpanded = expandedFault === fault.id;
    const isFocusing = focusingFaultId === fault.id;

    return (
      <div
        className={`rounded-lg overflow-hidden border transition-all ${
          fault.severity === 'alarm'
            ? 'bg-red-500/5 border-red-500/30'
            : 'bg-yellow-500/5 border-yellow-500/30'
        }`}
      >
        <button
          onClick={() => setExpandedFault(isExpanded ? null : fault.id)}
          className="w-full p-2.5 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
        >
          <div className={`p-1.5 rounded ${fault.severity === 'alarm' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{fault.gateName}</div>
            <div className="text-xs text-slate-400 truncate">{config.label}</div>
          </div>
          <div className="flex items-center gap-1">
            {fault.acknowledged ? (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                已确认
              </span>
            ) : (
              <span className={`px-1.5 py-0.5 text-xs rounded ${
                fault.severity === 'alarm'
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {fault.severity === 'alarm' ? '告警' : '预警'}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {isExpanded && (
          <div className="px-2.5 pb-2.5 space-y-3 border-t border-slate-700/50 pt-2">
            <p className="text-sm text-slate-300">{fault.description}</p>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>责任班组：</span>
                <span className="text-white">{fault.responsibleTeam}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>预计修复：</span>
                <span className="text-white">{fault.estimatedRepairTime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>发生时间：</span>
                <span className="text-white">{fault.time}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                故障路径
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-500 mt-0.5">坝顶</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-600 mx-1 relative">
                  {isFocusing && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <Warehouse className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-500 mt-0.5">机房</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-600 mx-1" />
                <div className="flex flex-col items-center">
                  <CircleDot className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-500 mt-0.5">闸孔</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleFocus(fault.id)}
                className="flex-1 py-1.5 px-3 bg-orange-600 hover:bg-orange-500 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Target className="w-3 h-3" />
                聚焦定位
              </button>
              {!fault.acknowledged ? (
                <button
                  onClick={() => acknowledgeFault(fault.id)}
                  className="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-500 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  确认
                </button>
              ) : (
                <button
                  onClick={() => clearFault(fault.id)}
                  className="flex-1 py-1.5 px-3 bg-slate-600 hover:bg-slate-500 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 w-80 max-h-96 overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-orange-400" />
          <h2 className="font-semibold">故障定位</h2>
          <div className="flex gap-1">
            {activeFaults.filter(f => f.severity === 'alarm').length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {activeFaults.filter(f => f.severity === 'alarm').length} 告警
              </span>
            )}
            {activeFaults.filter(f => f.severity === 'warning').length > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {activeFaults.filter(f => f.severity === 'warning').length} 预警
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          title="模拟故障"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
        </button>
      </div>

      {showAddForm && (
        <div className="p-3 border-b border-slate-700 bg-slate-800/50 space-y-2">
          <div className="text-xs text-slate-400 mb-1">模拟添加故障</div>
          <select
            value={newFaultGateId}
            onChange={(e) => setNewFaultGateId(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            {gates.map(gate => (
              <option key={gate.id} value={gate.id}>{gate.name}</option>
            ))}
          </select>
          <select
            value={newFaultType}
            onChange={(e) => setNewFaultType(e.target.value as FaultType)}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            {Object.entries(faultTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={newFaultDesc}
            onChange={(e) => setNewFaultDesc(e.target.value)}
            placeholder="故障描述（可选）"
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddFault}
              className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-medium transition-colors"
            >
              添加故障
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="overflow-y-auto max-h-72">
        {allFaults.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            暂无故障信息
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {activeFaults.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 px-1">待处理 ({activeFaults.length})</div>
                {activeFaults.map(fault => (
                  <FaultCard key={fault.id} fault={fault} />
                ))}
              </div>
            )}

            {acknowledgedFaults.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-500 px-1">已确认 ({acknowledgedFaults.length})</div>
                {acknowledgedFaults.map(fault => (
                  <FaultCard key={fault.id} fault={fault} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
