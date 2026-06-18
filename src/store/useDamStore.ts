import { create } from 'zustand';

export type OperationMode = 'normal' | 'maintenance' | 'flood' | 'emergency';
export type FaultType = 'overload' | 'brake' | 'limit' | 'communication';
export type InterlockCheckResult = 'pass' | 'fail' | 'pending';
export type DispatchBatchStatus = 'waiting' | 'executing' | 'completed';

export interface DispatchBatch {
  id: string;
  name: string;
  gateIds: string[];
  targetOpening: number;
  status: DispatchBatchStatus;
  scheduledTime: string;
  estimatedDischarge: number;
  operator: string;
}

export interface InterlockCheck {
  id: string;
  name: string;
  result: InterlockCheckResult;
  description: string;
  gateId?: string;
}

export interface FaultInfo {
  id: string;
  gateId: string;
  type: FaultType;
  description: string;
  severity: 'warning' | 'alarm';
  location: {
    damTop: { x: number; y: number; z: number };
    machineRoom: { x: number; y: number; z: number };
    gateHole: { x: number; y: number; z: number };
  };
  responsibleTeam: string;
  estimatedRepairTime: string;
  time: string;
  acknowledged: boolean;
}

export interface GateData {
  id: string;
  name: string;
  opening: number;
  targetOpening: number;
  load: number;
  maxLoad: number;
  upstreamWaterLevel: number;
  downstreamWaterLevel: number;
  interlockStatus: boolean;
  lastOperator: string;
  lastCommand: string;
  lastCommandTime: string;
  position: { x: number; z: number };
  openingHistory: { time: string; value: number }[];
  status: 'normal' | 'warning' | 'alarm';
  sensorData: {
    vibration: number;
    temperature: number;
    waterPressure: number;
  };
  estimatedDischarge: number;
  batchId?: string;
  faults: FaultInfo[];
}

export interface AlarmItem {
  id: string;
  type: 'warning' | 'alarm';
  message: string;
  time: string;
  gateId?: string;
  location: string;
  faultId?: string;
}

interface DamState {
  operationMode: OperationMode;
  gates: GateData[];
  alarms: AlarmItem[];
  selectedGateId: string | null;
  upstreamWaterLevel: number;
  downstreamWaterLevel: number;
  predictedDownstreamLevel: number;
  waterFlow: number;
  showLabels: boolean;
  animationSpeed: number;
  dispatchBatches: DispatchBatch[];
  interlockChecks: InterlockCheck[];
  lastInterlockCheckTime: string;
  focusedFaultId: string | null;
  focusPathProgress: number;
  isFocusAnimating: boolean;

  setOperationMode: (mode: OperationMode) => void;
  setSelectedGateId: (id: string | null) => void;
  setGateOpening: (gateId: string, opening: number) => void;
  addAlarm: (alarm: Omit<AlarmItem, 'id' | 'time'>) => void;
  clearAlarm: (alarmId: string) => void;
  setShowLabels: (show: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  updateGateData: (gateId: string, data: Partial<GateData>) => void;
  tick: (deltaTime: number) => void;

  createDispatchBatch: (batch: Omit<DispatchBatch, 'id' | 'status' | 'estimatedDischarge'>) => void;
  startBatch: (batchId: string) => void;
  executeInterlockCheck: () => void;
  addFault: (gateId: string, fault: Omit<FaultInfo, 'id' | 'time' | 'acknowledged' | 'gateId'>) => void;
  acknowledgeFault: (faultId: string) => void;
  clearFault: (faultId: string) => void;
  setFocusedFaultId: (faultId: string | null) => void;
  triggerFocusAnimation: (faultId: string) => void;
  calculateEstimatedDischarge: (gateId: string, opening: number) => number;
  calculateTotalEstimatedDischarge: () => number;
  calculatePredictedDownstreamLevel: () => number;
}

const generateInitialGates = (): GateData[] => {
  const gates: GateData[] = [];
  const gateCount = 5;
  const spacing = 16;
  const startX = -(gateCount - 1) * spacing / 2;

  for (let i = 0; i < gateCount; i++) {
    const id = `gate-${i + 1}`;
    const history: { time: string; value: number }[] = [];
    const baseOpening = 15 + i * 3;
    for (let h = 23; h >= 0; h--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - h);
      history.push({
        time: `${hour.getHours().toString().padStart(2, '0')}:00`,
        value: Math.max(0, Math.min(100, baseOpening + (Math.random() - 0.5) * 10))
      });
    }

    gates.push({
      id,
      name: `${i + 1}号闸门`,
      opening: baseOpening,
      targetOpening: baseOpening,
      load: 45 + i * 8,
      maxLoad: 120,
      upstreamWaterLevel: 85,
      downstreamWaterLevel: 35,
      interlockStatus: true,
      lastOperator: '张工',
      lastCommand: '开度微调',
      lastCommandTime: '2026-06-15 08:30',
      position: { x: startX + i * spacing, z: 0 },
      openingHistory: history,
      status: 'normal',
      sensorData: {
        vibration: 0.12 + i * 0.03,
        temperature: 28 + i * 1.5,
        waterPressure: 0.85 + i * 0.05
      },
      estimatedDischarge: 200 + baseOpening * 15,
      faults: []
    });
  }
  return gates;
};

const initialGates = generateInitialGates();

const initialBatches: DispatchBatch[] = [
  {
    id: 'batch-1',
    name: '第一批（1、3号闸）',
    gateIds: ['gate-1', 'gate-3'],
    targetOpening: 60,
    status: 'completed',
    scheduledTime: '2026-06-15 08:00',
    estimatedDischarge: 1800,
    operator: '李调度'
  },
  {
    id: 'batch-2',
    name: '第二批（2、5号闸）',
    gateIds: ['gate-2', 'gate-5'],
    targetOpening: 45,
    status: 'executing',
    scheduledTime: '2026-06-15 09:30',
    estimatedDischarge: 1350,
    operator: '李调度'
  },
  {
    id: 'batch-3',
    name: '第三批（4号闸）',
    gateIds: ['gate-4'],
    targetOpening: 30,
    status: 'waiting',
    scheduledTime: '2026-06-15 11:00',
    estimatedDischarge: 450,
    operator: '王调度'
  }
];

const initialInterlockChecks: InterlockCheck[] = [
  { id: 'il-1', name: '电源联锁', result: 'pass', description: '主备电源正常' },
  { id: 'il-2', name: '水位联锁', result: 'pass', description: '上下游水位在安全范围' },
  { id: 'il-3', name: '开度差联锁', result: 'pass', description: '相邻闸门开度差小于20%' },
  { id: 'il-4', name: '负载联锁', result: 'pending', description: '检查中...' },
  { id: 'il-5', name: '通信联锁', result: 'pass', description: '所有设备通信正常' },
  { id: 'il-6', name: '安全门联锁', result: 'pass', description: '检修通道已关闭' }
];

export const useDamStore = create<DamState>((set, get) => ({
  operationMode: 'normal',
  gates: initialGates,
  alarms: [
    {
      id: 'alarm-1',
      type: 'warning',
      message: '2号闸门振动值偏高',
      time: '2026-06-15 09:15',
      gateId: 'gate-2',
      location: '2号闸门启闭机'
    },
    {
      id: 'alarm-2',
      type: 'warning',
      message: '上游水位接近警戒值',
      time: '2026-06-15 08:45',
      location: '上游水位监测点'
    }
  ],
  selectedGateId: null,
  upstreamWaterLevel: 85,
  downstreamWaterLevel: 35,
  predictedDownstreamLevel: 42,
  waterFlow: 1200,
  showLabels: true,
  animationSpeed: 1,
  dispatchBatches: initialBatches,
  interlockChecks: initialInterlockChecks,
  lastInterlockCheckTime: '2026-06-15 09:00',
  focusedFaultId: null,
  focusPathProgress: 0,
  isFocusAnimating: false,

  setOperationMode: (mode) => {
    set({ operationMode: mode });
    const { gates, addAlarm } = get();

    gates.forEach(gate => {
      if (mode === 'flood') {
        get().updateGateData(gate.id, { targetOpening: 80 + Math.random() * 20 });
      } else if (mode === 'emergency') {
        get().updateGateData(gate.id, { targetOpening: 95 });
        addAlarm({
          type: 'alarm',
          message: '应急模式启动，闸门全开泄洪',
          location: '中控室'
        });
      } else if (mode === 'maintenance') {
        get().updateGateData(gate.id, { targetOpening: 0 });
      } else {
        get().updateGateData(gate.id, { targetOpening: 15 + Math.random() * 20 });
      }
    });
  },

  setSelectedGateId: (id) => set({ selectedGateId: id }),

  setGateOpening: (gateId, opening) => {
    const discharge = get().calculateEstimatedDischarge(gateId, opening);
    set(state => ({
      gates: state.gates.map(g =>
        g.id === gateId ? { ...g, targetOpening: Math.max(0, Math.min(100, opening)), estimatedDischarge: discharge } : g
      )
    }));
  },

  addAlarm: (alarm) => {
    const newAlarm: AlarmItem = {
      ...alarm,
      id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toLocaleString('zh-CN')
    };
    set(state => ({ alarms: [newAlarm, ...state.alarms].slice(0, 50) }));
  },

  clearAlarm: (alarmId) => {
    set(state => ({ alarms: state.alarms.filter(a => a.id !== alarmId) }));
  },

  setShowLabels: (show) => set({ showLabels: show }),

  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  updateGateData: (gateId, data) => {
    set(state => ({
      gates: state.gates.map(g =>
        g.id === gateId ? { ...g, ...data } : g
      )
    }));
  },

  tick: (deltaTime) => {
    const state = get();
    const newGates = state.gates.map(gate => {
      let newOpening = gate.opening;
      const diff = gate.targetOpening - gate.opening;
      const speed = 5 * deltaTime * state.animationSpeed;

      if (Math.abs(diff) > speed) {
        newOpening += Math.sign(diff) * speed;
      } else {
        newOpening = gate.targetOpening;
      }

      const loadBase = 30 + newOpening * 0.8;
      const newLoad = loadBase + Math.sin(Date.now() * 0.001 + gate.position.x) * 5;

      const hasSeriousFault = gate.faults.some(f => f.severity === 'alarm' && !f.acknowledged);
      const hasWarningFault = gate.faults.some(f => f.severity === 'warning' && !f.acknowledged);

      let newStatus: 'normal' | 'warning' | 'alarm';
      if (hasSeriousFault || newLoad > gate.maxLoad * 0.9) {
        newStatus = 'alarm';
      } else if (hasWarningFault || newLoad > gate.maxLoad * 0.75) {
        newStatus = 'warning';
      } else {
        newStatus = 'normal';
      }

      const newDischarge = get().calculateEstimatedDischarge(gate.id, newOpening);

      return {
        ...gate,
        opening: newOpening,
        load: Math.min(gate.maxLoad, newLoad),
        status: newStatus,
        estimatedDischarge: newDischarge,
        sensorData: {
          vibration: 0.1 + newOpening * 0.005 + Math.sin(Date.now() * 0.003) * 0.02,
          temperature: gate.sensorData.temperature + Math.sin(Date.now() * 0.0005) * 0.1,
          waterPressure: 0.8 + newOpening * 0.01
        }
      };
    });

    const upstreamLevel = state.operationMode === 'flood' || state.operationMode === 'emergency'
      ? 92 + Math.sin(Date.now() * 0.0003) * 2
      : state.upstreamWaterLevel + Math.sin(Date.now() * 0.0005) * 0.3;

    const avgOpening = newGates.reduce((sum, g) => sum + g.opening, 0) / newGates.length;
    const downstreamLevel = 30 + avgOpening * 0.4 + Math.sin(Date.now() * 0.0007) * 0.5;
    const waterFlow = 800 + avgOpening * 20;

    let focusProgress = state.focusPathProgress;
    if (state.isFocusAnimating) {
      focusProgress += deltaTime * 0.5;
      if (focusProgress >= 1) {
        focusProgress = 0;
        set({ isFocusAnimating: false, focusPathProgress: 0 });
      }
    }

    const predictedLevel = get().calculatePredictedDownstreamLevel();

    set({
      gates: newGates,
      upstreamWaterLevel: Math.min(100, upstreamLevel),
      downstreamWaterLevel: Math.min(60, downstreamLevel),
      predictedDownstreamLevel: predictedLevel,
      waterFlow,
      focusPathProgress: focusProgress
    });
  },

  createDispatchBatch: (batch) => {
    const estimatedDischarge = batch.gateIds.reduce((sum, gateId) => {
      return sum + get().calculateEstimatedDischarge(gateId, batch.targetOpening);
    }, 0);

    const newBatch: DispatchBatch = {
      ...batch,
      id: `batch-${Date.now()}`,
      status: 'waiting',
      estimatedDischarge
    };

    set(state => ({
      dispatchBatches: [...state.dispatchBatches, newBatch]
    }));
  },

  startBatch: (batchId) => {
    const state = get();
    const batch = state.dispatchBatches.find(b => b.id === batchId);
    if (!batch) return;

    batch.gateIds.forEach(gateId => {
      get().updateGateData(gateId, {
        targetOpening: batch.targetOpening,
        batchId: batch.id
      });
    });

    set(state => ({
      dispatchBatches: state.dispatchBatches.map(b =>
        b.id === batchId ? { ...b, status: 'executing' as const } : b
      )
    }));

    get().addAlarm({
      type: 'warning',
      message: `${batch.name} 开始执行`,
      location: '调度中心'
    });
  },

  executeInterlockCheck: () => {
    const state = get();
    const checks: InterlockCheck[] = state.interlockChecks.map(check => {
      const passes = Math.random() > 0.15;
      return {
        ...check,
        result: passes ? 'pass' : 'fail'
      };
    });

    set({
      interlockChecks: checks,
      lastInterlockCheckTime: new Date().toLocaleString('zh-CN')
    });

    const failedChecks = checks.filter(c => c.result === 'fail');
    if (failedChecks.length > 0) {
      get().addAlarm({
        type: 'warning',
        message: `联锁检查发现 ${failedChecks.length} 项异常`,
        location: '安全系统'
      });
    }
  },

  addFault: (gateId, fault) => {
    const gate = get().gates.find(g => g.id === gateId);
    if (!gate) return;

    const newFault: FaultInfo = {
      ...fault,
      id: `fault-${Date.now()}`,
      gateId,
      time: new Date().toLocaleString('zh-CN'),
      acknowledged: false
    };

    set(state => ({
      gates: state.gates.map(g =>
        g.id === gateId ? { ...g, faults: [...g.faults, newFault] } : g
      )
    }));

    const faultTypeLabels: Record<FaultType, string> = {
      overload: '设备过载',
      brake: '制动异常',
      limit: '限位信号丢失',
      communication: '通信中断'
    };

    get().addAlarm({
      type: fault.severity,
      message: `${gate.name} ${faultTypeLabels[fault.type]}：${fault.description}`,
      location: fault.responsibleTeam,
      gateId,
      faultId: newFault.id
    });
  },

  acknowledgeFault: (faultId) => {
    set(state => ({
      gates: state.gates.map(g => ({
        ...g,
        faults: g.faults.map(f =>
          f.id === faultId ? { ...f, acknowledged: true } : f
        )
      }))
    }));
  },

  clearFault: (faultId) => {
    set(state => ({
      gates: state.gates.map(g => ({
        ...g,
        faults: g.faults.filter(f => f.id !== faultId)
      })),
      focusedFaultId: state.focusedFaultId === faultId ? null : state.focusedFaultId
    }));
  },

  setFocusedFaultId: (faultId) => set({ focusedFaultId: faultId }),

  triggerFocusAnimation: (faultId) => {
    set({ focusedFaultId: faultId, isFocusAnimating: true, focusPathProgress: 0 });
  },

  calculateEstimatedDischarge: (gateId, opening) => {
    const gate = get().gates.find(g => g.id === gateId);
    if (!gate) return 0;
    const baseFlow = 50;
    const flowCoefficient = 12;
    return baseFlow + opening * flowCoefficient;
  },

  calculateTotalEstimatedDischarge: () => {
    const state = get();
    return state.gates.reduce((sum, g) => sum + g.estimatedDischarge, 0);
  },

  calculatePredictedDownstreamLevel: () => {
    const totalDischarge = get().calculateTotalEstimatedDischarge();
    const baseLevel = 30;
    const levelPerDischarge = 0.008;
    return Math.min(60, baseLevel + totalDischarge * levelPerDischarge);
  }
}));
