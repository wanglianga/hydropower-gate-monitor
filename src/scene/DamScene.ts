import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useDamStore, GateData, OperationMode } from '@/store/useDamStore';

export class DamScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private damGroup: THREE.Group;
  private gatesGroup: THREE.Group;
  private waterUpstream: THREE.Mesh | null = null;
  private waterDownstream: THREE.Mesh | null = null;
  private spillwayGroup: THREE.Group;
  private sensorMarkers: THREE.Mesh[] = [];
  private warningLine: THREE.Line | null = null;
  private waterParticles: THREE.Points | null = null;

  private gateMeshes: Map<string, { group: THREE.Group; gateMesh: THREE.Mesh; hoist: THREE.Group }> = new Map();
  private interactiveObjects: THREE.Object3D[] = [];

  private onGateClick: (gateId: string) => void;

  constructor(container: HTMLElement, onGateClick: (gateId: string) => void) {
    this.container = container;
    this.onGateClick = onGateClick;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 200, 600);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(80, 60, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 300;
    this.controls.target.set(0, 10, 0);

    this.damGroup = new THREE.Group();
    this.gatesGroup = new THREE.Group();
    this.spillwayGroup = new THREE.Group();

    this.scene.add(this.damGroup);
    this.scene.add(this.gatesGroup);
    this.scene.add(this.spillwayGroup);

    this.setupLights();
    this.createDam();
    this.createGates();
    this.createWater();
    this.createSpillway();
    this.createWarningLine();
    this.createWaterParticles();
    this.setupEventListeners();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(80, 120, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-60, 40, -40);
    this.scene.add(fillLight);
  }

  private createDam(): void {
    const concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b8b8b,
      roughness: 0.8,
      metalness: 0.1
    });

    const damBody = new THREE.Mesh(
      new THREE.BoxGeometry(120, 70, 30),
      concreteMaterial
    );
    damBody.position.y = 35;
    damBody.position.z = 0;
    damBody.castShadow = true;
    damBody.receiveShadow = true;
    this.damGroup.add(damBody);

    const damUpstreamFace = new THREE.Mesh(
      new THREE.BoxGeometry(122, 72, 2),
      new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9 })
    );
    damUpstreamFace.position.set(0, 36, -15);
    damUpstreamFace.receiveShadow = true;
    this.damGroup.add(damUpstreamFace);

    const pierMaterial = new THREE.MeshStandardMaterial({
      color: 0x909090,
      roughness: 0.7
    });

    for (let i = 0; i < 6; i++) {
      const x = -50 + i * 20;
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(6, 75, 32),
        pierMaterial
      );
      pier.position.set(x, 37.5, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;
      this.damGroup.add(pier);

      const pierCap = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 36),
        new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.6 })
      );
      pierCap.position.set(x, 76, 0);
      pierCap.castShadow = true;
      this.damGroup.add(pierCap);
    }

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(130, 3, 45),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.2 })
    );
    platform.position.set(0, 77, 5);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.damGroup.add(platform);

    const railingMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.6,
      roughness: 0.4
    });

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 26; i++) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
          railingMaterial
        );
        post.position.set(-60 + i * 5, 79, 26 * side + 5);
        post.castShadow = true;
        this.damGroup.add(post);
      }

      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 130, 8),
        railingMaterial
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 80, 26 * side + 5);
      this.damGroup.add(rail);
    }

    this.createWaterLevelGauge();
    this.createMaintenancePlatform();
    this.createSensors();
  }

  private createWaterLevelGauge(): void {
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(-62, 10, -12);

    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(1, 70, 1),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    pole.position.y = 35;
    gaugeGroup.add(pole);

    for (let i = 0; i <= 14; i++) {
      const y = i * 5;
      const isMajor = i % 2 === 0;
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(isMajor ? 3 : 1.5, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      mark.position.set(-1.5 - (isMajor ? 0.75 : 0), y, 0);
      gaugeGroup.add(mark);
    }

    const float = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x331100 })
    );
    float.position.set(-2, 35, 0);
    float.name = 'waterLevelFloat';
    gaugeGroup.add(float);

    this.damGroup.add(gaugeGroup);
  }

  private createMaintenancePlatform(): void {
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, 60, -25);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(100, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.7 })
    );
    platform.castShadow = true;
    platform.receiveShadow = true;
    platformGroup.add(platform);

    const craneRail = new THREE.Mesh(
      new THREE.BoxGeometry(102, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 })
    );
    craneRail.position.y = 1;
    platformGroup.add(craneRail);

    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.6
    });

    for (let i = -2; i <= 2; i++) {
      const support = new THREE.Mesh(
        new THREE.BoxGeometry(3, 20, 3),
        supportMaterial
      );
      support.position.set(i * 20, -10, 0);
      support.castShadow = true;
      platformGroup.add(support);
    }

    this.damGroup.add(platformGroup);
  }

  private createSensors(): void {
    const sensorPositions = [
      { x: -40, y: 70, z: 10, type: 'vibration' },
      { x: 0, y: 70, z: 10, type: 'temperature' },
      { x: 40, y: 70, z: 10, type: 'pressure' },
      { x: -30, y: 40, z: -10, type: 'water' },
      { x: 30, y: 40, z: -10, type: 'water' }
    ];

    sensorPositions.forEach((pos, index) => {
      const sensorGeometry = new THREE.SphereGeometry(1, 16, 16);
      const sensorMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x003300,
        emissiveIntensity: 0.5
      });

      const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
      sensor.position.set(pos.x, pos.y, pos.z);
      sensor.userData = { sensorId: `sensor-${index}`, type: pos.type };
      sensor.name = 'sensor';
      this.damGroup.add(sensor);
      this.sensorMarkers.push(sensor);
    });
  }

  private createGates(): void {
    const state = useDamStore.getState();

    state.gates.forEach((gate) => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(gate.position.x, 0, 0);
      gateGroup.userData = { gateId: gate.id };

      const gateMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90d9,
        metalness: 0.7,
        roughness: 0.3
      });

      const gateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(12, 30, 2),
        gateMaterial
      );
      gateMesh.position.y = 25;
      gateMesh.castShadow = true;
      gateMesh.receiveShadow = true;
      gateMesh.userData = { gateId: gate.id, isGate: true };
      gateMesh.name = 'gatePanel';
      gateGroup.add(gateMesh);

      const gateFrameMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.8,
        roughness: 0.2
      });

      const frameThickness = 0.8;
      const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, 30, 3),
        gateFrameMaterial
      );
      leftFrame.position.set(-6 + frameThickness / 2, 25, 0);
      leftFrame.castShadow = true;
      gateGroup.add(leftFrame);

      const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, 30, 3),
        gateFrameMaterial
      );
      rightFrame.position.set(6 - frameThickness / 2, 25, 0);
      rightFrame.castShadow = true;
      gateGroup.add(rightFrame);

      const hoistGroup = this.createHoist(gate.id);
      hoistGroup.position.set(0, 75, 0);
      gateGroup.add(hoistGroup);

      const cableMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.2
      });

      for (let side = -1; side <= 1; side += 2) {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 20, 8),
          cableMaterial
        );
        cable.position.set(side * 4, 55, 0);
        cable.name = 'cable';
        gateGroup.add(cable);
      }

      const statusLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          emissive: 0x00ff00,
          emissiveIntensity: 0.5
        })
      );
      statusLight.position.set(0, 72, 5);
      statusLight.name = 'statusLight';
      gateGroup.add(statusLight);

      this.gateMeshes.set(gate.id, {
        group: gateGroup,
        gateMesh: gateMesh,
        hoist: hoistGroup
      });

      this.interactiveObjects.push(gateMesh);
      this.gatesGroup.add(gateGroup);
    });
  }

  private createHoist(gateId: string): THREE.Group {
    const hoistGroup = new THREE.Group();
    hoistGroup.name = 'hoist';

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.3
    });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 6),
      baseMaterial
    );
    base.castShadow = true;
    hoistGroup.add(base);

    const motorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });

    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 4, 16),
      motorMaterial
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0, 3, 0);
    motor.castShadow = true;
    hoistGroup.add(motor);

    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 })
    );
    drum.rotation.z = Math.PI / 2;
    drum.position.set(0, 1, 2);
    hoistGroup.add(drum);

    const gearBox = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 })
    );
    gearBox.position.set(3, 2.5, 0);
    gearBox.castShadow = true;
    hoistGroup.add(gearBox);

    return hoistGroup;
  }

  private createWater(): void {
    const waterGeometry = new THREE.PlaneGeometry(400, 200, 50, 30);

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });

    this.waterUpstream = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterUpstream.rotation.x = -Math.PI / 2;
    this.waterUpstream.position.set(0, 35, -115);
    this.waterUpstream.receiveShadow = true;
    this.scene.add(this.waterUpstream);

    const downstreamWater = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 300, 50, 40),
      new THREE.MeshStandardMaterial({
        color: 0x4169e1,
        transparent: true,
        opacity: 0.6,
        roughness: 0.15,
        metalness: 0.2,
        side: THREE.DoubleSide
      })
    );
    downstreamWater.rotation.x = -Math.PI / 2;
    downstreamWater.position.set(0, 25, 180);
    downstreamWater.receiveShadow = true;
    this.waterDownstream = downstreamWater;
    this.scene.add(this.waterDownstream);
  }

  private createSpillway(): void {
    const spillwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      roughness: 0.9
    });

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(100, 2, 80),
      spillwayMaterial
    );
    floor.position.set(0, 5, 55);
    floor.receiveShadow = true;
    this.spillwayGroup.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b6b6b,
      roughness: 0.8
    });

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 20, 80),
      wallMaterial
    );
    leftWall.position.set(-48, 14, 55);
    leftWall.castShadow = true;
    this.spillwayGroup.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 20, 80),
      wallMaterial
    );
    rightWall.position.set(48, 14, 55);
    rightWall.castShadow = true;
    this.spillwayGroup.add(rightWall);

    const flipBucket = new THREE.Mesh(
      new THREE.BoxGeometry(96, 8, 20),
      spillwayMaterial
    );
    flipBucket.position.set(0, 2, 90);
    flipBucket.rotation.x = -0.3;
    this.spillwayGroup.add(flipBucket);
  }

  private createWarningLine(): void {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      points.push(new THREE.Vector3(-80 + i * 8, 30, 100));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xff0000,
      dashSize: 3,
      gapSize: 2,
      linewidth: 2
    });

    this.warningLine = new THREE.Line(geometry, material);
    this.warningLine.computeLineDistances();
    this.scene.add(this.warningLine);
  }

  private createWaterParticles(): void {
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = 10 + Math.random() * 30;
      positions[i3 + 2] = 20 + Math.random() * 60;

      velocities[i3] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = -1 - Math.random() * 2;
      velocities[i3 + 2] = 2 + Math.random() * 3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    this.waterParticles = new THREE.Points(geometry, material);
    this.scene.add(this.waterParticles);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('click', this.handleClick);
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let object: THREE.Object3D | null = intersects[0].object;
      while (object && !object.userData.gateId) {
        object = object.parent;
      }
      if (object && object.userData.gateId) {
        this.onGateClick(object.userData.gateId);
      }
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  };

  public update(): void {
    const state = useDamStore.getState();

    state.gates.forEach((gate) => {
      const gateData = this.gateMeshes.get(gate.id);
      if (gateData) {
        const maxHeight = 30;
        const yOffset = (gate.opening / 100) * maxHeight;
        gateData.gateMesh.position.y = 25 + yOffset;

        const cables = gateData.group.children.filter(c => c.name === 'cable');
        cables.forEach((cable, idx) => {
          const side = idx === 0 ? -1 : 1;
          cable.position.set(side * 4, 55 + yOffset / 2, 0);
          (cable as THREE.Mesh).scale.y = 1 - gate.opening / 100;
        });

        const statusLight = gateData.group.children.find(c => c.name === 'statusLight');
        if (statusLight) {
          const material = (statusLight as THREE.Mesh).material as THREE.MeshStandardMaterial;
          const color = gate.status === 'alarm' ? 0xff0000 :
            gate.status === 'warning' ? 0xffff00 : 0x00ff00;
          material.color.setHex(color);
          material.emissive.setHex(color);
        }
      }
    });

    const upstreamY = state.upstreamWaterLevel * 0.7;
    if (this.waterUpstream) {
      this.waterUpstream.position.y = upstreamY;
      this.animateWater(this.waterUpstream, 0.3);
    }

    const downstreamY = state.downstreamWaterLevel * 0.7;
    if (this.waterDownstream) {
      this.waterDownstream.position.y = downstreamY;
      this.animateWater(this.waterDownstream, 0.2);
    }

    const float = this.damGroup.getObjectByName('waterLevelFloat');
    if (float) {
      float.position.y = upstreamY;
    }

    this.updateWaterParticles();
    this.updateSensorLights();
    this.updateWarningLine();
  }

  private animateWater(water: THREE.Mesh, amplitude: number): void {
    const geometry = water.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave = Math.sin(x * 0.05 + time) * amplitude +
        Math.cos(z * 0.07 + time * 0.8) * amplitude * 0.7;
      positions.setY(i, wave);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private updateWaterParticles(): void {
    if (!this.waterParticles) return;

    const state = useDamStore.getState();
    const positions = this.waterParticles.geometry.attributes.position as THREE.BufferAttribute;
    const velocities = this.waterParticles.geometry.attributes.velocity as THREE.BufferAttribute;
    const time = Date.now() * 0.001;
    const flowMultiplier = state.operationMode === 'flood' || state.operationMode === 'emergency' ? 3 : 1;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;

      let x = positions.getX(i);
      let y = positions.getY(i);
      let z = positions.getZ(i);

      const vx = velocities.getX(i);
      let vy = velocities.getY(i);
      const vz = velocities.getZ(i);

      x += vx * flowMultiplier;
      y += vy * 0.1;
      z += vz * flowMultiplier * 0.5;

      y += Math.sin(time + i) * 0.05;

      if (z > 100 || y < 5) {
        x = (Math.random() - 0.5) * 80;
        y = 30 + Math.random() * 10;
        z = 20;
      }

      positions.setX(i, x);
      positions.setY(i, y);
      positions.setZ(i, z);
    }

    positions.needsUpdate = true;
  }

  private updateSensorLights(): void {
    const time = Date.now() * 0.003;
    this.sensorMarkers.forEach((sensor, index) => {
      const material = sensor.material as THREE.MeshStandardMaterial;
      const pulse = 0.3 + Math.sin(time + index) * 0.2;
      material.emissiveIntensity = pulse;
    });
  }

  private updateWarningLine(): void {
    if (this.warningLine) {
      const positions = this.warningLine.geometry.attributes.position as THREE.BufferAttribute;
      const time = Date.now() * 0.005;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const wave = Math.sin(x * 0.1 + time) * 2;
        positions.setY(i, 30 + wave);
        positions.setZ(i, 100 + wave * 0.5);
      }

      positions.needsUpdate = true;
      this.warningLine.computeLineDistances();
    }
  }

  public animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    useDamStore.getState().tick(delta);

    this.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    this.animate();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.controls.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getControls(): OrbitControls {
    return this.controls;
  }
}
