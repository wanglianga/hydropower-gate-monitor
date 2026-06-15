import { useEffect, useRef } from 'react';
import { DamScene } from '@/scene/DamScene';
import { useDamStore } from '@/store/useDamStore';

interface SceneCanvasProps {
  onGateClick: (gateId: string) => void;
}

export default function SceneCanvas({ onGateClick }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DamScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new DamScene(containerRef.current, onGateClick);
    sceneRef.current = scene;
    scene.start();

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onGateClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  );
}
