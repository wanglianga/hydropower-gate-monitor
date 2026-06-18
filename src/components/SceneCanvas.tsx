import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { DamScene } from '@/scene/DamScene';

interface SceneCanvasProps {
  onGateClick: (gateId: string) => void;
  onFaultClick: (faultId: string) => void;
}

export interface SceneCanvasRef {
  focusOnFault: (faultId: string) => void;
  clearFaultFocus: () => void;
}

const SceneCanvas = forwardRef<SceneCanvasRef, SceneCanvasProps>(({ onGateClick, onFaultClick }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DamScene | null>(null);

  useImperativeHandle(ref, () => ({
    focusOnFault: (faultId: string) => {
      if (sceneRef.current) {
        sceneRef.current.focusOnFault(faultId);
      }
    },
    clearFaultFocus: () => {
      if (sceneRef.current) {
        sceneRef.current.clearFaultFocus();
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new DamScene(containerRef.current, onGateClick, onFaultClick);
    sceneRef.current = scene;
    scene.start();

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onGateClick, onFaultClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  );
});

SceneCanvas.displayName = 'SceneCanvas';

export default SceneCanvas;
