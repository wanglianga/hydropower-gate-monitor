import { create } from 'zustand';

export type OperationMode = 'normal' | 'maintenance' | 'flood' | 'emergency';

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
}

export interface AlarmItem {
  id: string;
  type: 'warning' | 'alarm';
  message: string;
  time: string;
  gateId?: string;
  location: string;
}

interface DamState {
  operationMode: OperationMode;
  gates: GateData[];
  alarms: AlarmItem[];
  selectedGateId: string | null;
  upstreamWaterLevel: number;
  downstreamWaterLevel: number;
  waterFlow: number;
  showLabels: boolean;
  animationSpeed: number;

  setOperationMode: (mode: OperationMode) => void;
  setSelectedGateId: (id: string | null) => void;
  setGateOpening: (gateId: string, opening: number) => void;
  addAlarm: (alarm: Omit<AlarmItem, 'id' | 'time'>) => void;
  clearAlarm: (alarmId: string) => void;
  setShowLabels: (show: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  updateGateData: (gateId: string, data: Partial<GateData>) => void;
  tick: (deltaTime: number) => void;
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
      }
    });
  }
  return gates;
};

const initialGates = generateInitialGates();

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
  waterFlow: 1200,
  showLabels: true,
  animationSpeed: 1,

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
    set(state => ({
      gates: state.gates.map(g =>
        g.id === gateId ? { ...g, targetOpening: Math.max(0, Math.min(100, opening)) } : g
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

      const newStatus: 'normal' | 'warning' | 'alarm' =
        newLoad > gate.maxLoad * 0.9 ? 'alarm' :
        newLoad > gate.maxLoad * 0.75 ? 'warning' : 'normal';

      return {
        ...gate,
        opening: newOpening,
        load: Math.min(gate.maxLoad, newLoad),
        status: newStatus,
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

    set({
      gates: newGates,
      upstreamWaterLevel: Math.min(100, upstreamLevel),
      downstreamWaterLevel: Math.min(60, downstreamLevel),
      waterFlow
    });
  }
}));
