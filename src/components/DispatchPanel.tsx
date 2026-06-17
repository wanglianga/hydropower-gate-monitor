import { useState } from 'react';
import { useDamStore } from '@/store/useDamStore';
import { Layers, Play, CheckCircle, Clock, Waves, ArrowDown, ShieldCheck, ShieldAlert, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function DispatchPanel() {
  const {
    dispatchBatches,
    gates,
    startBatch,
    executeInterlockCheck,
    interlockChecks,
    lastInterlockCheckTime,
    calculateTotalEstimatedDischarge,
    predictedDownstreamLevel,
    downstreamWaterLevel
  } = useDamStore();

  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showInterlock, setShowInterlock] = useState(true);

  const totalDischarge = calculateTotalEstimatedDischarge();
  const levelDiff = predictedDownstreamLevel - downstreamWaterLevel;

  const statusColors = {
    waiting: 'bg-slate-500',
    executing: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500'
  };

  const statusLabels = {
    waiting: '等待中',
    executing: '执行中',
    completed: '已完成'
  };

  const interlockResultIcons = {
    pass: <CheckCircle className="w-4 h-4 text-green-400" />,
    fail: <ShieldAlert className="w-4 h-4 text-red-400" />,
    pending: <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
  };

  const getGateName = (gateId: string) => {
    const gate = gates.find(g => g.id === gateId);
    return gate ? gate.name : gateId;
  };

  const getGateOpening = (gateId: string) => {
    const gate = gates.find(g => g.id === gateId);
    return gate ? gate.opening : 0;
  };

  return (
    <div className="absolute top-4 left-80 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl text-white shadow-2xl border border-slate-700 w-80 max-h-[85vh] overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <Layers className="w-5 h-5 text-purple-400" />
        <h2 className="font-semibold">联动调度</h2>
      </div>

      <div className="overflow-y-auto max-h-[calc(85vh-48px)]">
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Waves className="w-3.5 h-3.5" />
                <span>预计总泄量</span>
              </div>
              <div className="text-xl font-bold text-cyan-400">
                {totalDischarge.toFixed(0)}
                <span className="text-xs text-slate-500 ml-1">m³/s</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>预测下游水位</span>
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {predictedDownstreamLevel.toFixed(1)}
                <span className="text-xs text-slate-500 ml-1">m</span>
              </div>
              <div className={`text-xs ${levelDiff > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {levelDiff > 0 ? '↑' : '↓'} {Math.abs(levelDiff).toFixed(2)} m
              </div>
            </div>
          </div>

          <button
            onClick={executeInterlockCheck}
            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            执行联锁检查
          </button>
        </div>

        <div className="border-t border-slate-700">
          <button
            onClick={() => setShowInterlock(!showInterlock)}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">联锁检查结果</span>
              <span className="text-xs text-slate-500">
                {interlockChecks.filter(c => c.result === 'pass').length}/{interlockChecks.length} 通过
              </span>
            </div>
            {showInterlock ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showInterlock && (
            <div className="px-3 pb-3 space-y-1.5">
              <div className="text-xs text-slate-500 mb-2">
                检查时间：{lastInterlockCheckTime}
              </div>
              {interlockChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded bg-slate-800/30"
                >
                  {interlockResultIcons[check.result]}
                  <span className="text-sm flex-1">{check.name}</span>
                  <span className="text-xs text-slate-500">{check.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-3">
          <h3 className="text-sm font-medium text-slate-300 mb-3">调度批次</h3>
          <div className="space-y-2">
            {dispatchBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-slate-800/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                  className="w-full p-2.5 flex items-center gap-2 hover:bg-slate-700/30 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full ${statusColors[batch.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{batch.name}</div>
                    <div className="text-xs text-slate-500">
                      {statusLabels[batch.status]} · {batch.gateIds.length}扇闸门
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-cyan-400">
                      {batch.estimatedDischarge.toFixed(0)}
                      <span className="text-xs text-slate-500 ml-0.5">m³/s</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      目标 {batch.targetOpening}%
                    </div>
                  </div>
                </button>

                {expandedBatch === batch.id && (
                  <div className="px-2.5 pb-2.5 space-y-2 border-t border-slate-700/50 pt-2">
                    <div className="space-y-1">
                      {batch.gateIds.map((gateId) => {
                        const opening = getGateOpening(gateId);
                        const progress = (opening / batch.targetOpening) * 100;
                        return (
                          <div key={gateId} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 w-16">{getGateName(gateId)}</span>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <span className="text-slate-400 w-10 text-right">
                              {opening.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>调度员：{batch.operator}</span>
                      <span>{batch.scheduledTime}</span>
                    </div>

                    {batch.status === 'waiting' && (
                      <button
                        onClick={() => startBatch(batch.id)}
                        className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-500 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        开始执行
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
