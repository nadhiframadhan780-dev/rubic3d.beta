import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CubeDimension, CubeMove, FaceName, RotationAxis, CubeTheme } from '../types/rubik';
import { FACE_NORMALS, coordToLayer, layerToCoord, STANDARD_FACE_ORDER } from '../utils/cubeMath';
import { soundManager } from '../audio/soundManager';
import {
  createPlasticBumpTexture,
  createCarbonFiberTexture,
  createSpeedcubeLogoTexture,
  createStudioFloorTexture,
} from './proceduralTextures';

export interface SceneCallbacks {
  onMoveExecuted?: (move: CubeMove) => void;
  onSolved?: () => void;
  onScrambleProgress?: (current: number, total: number) => void;
}

export class RubikScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cubeRoot: THREE.Group;
  private pivotGroup: THREE.Group;
  private contactShadow: THREE.Mesh | null = null;
  private internalCoreGroup: THREE.Group | null = null;
  private particlesMesh: THREE.Points | null = null;

  // Realistic procedural textures
  private plasticBumpTex: THREE.CanvasTexture = createPlasticBumpTexture();
  private carbonTex: THREE.CanvasTexture = createCarbonFiberTexture();
  private logoTex: THREE.CanvasTexture | null = null;

  // Scene state
  private dimension: CubeDimension = 3;
  private theme: CubeTheme;
  private cubieMeshes: THREE.Group[] = [];
  private callbacks: SceneCallbacks = {};

  // Animation & Queue
  private isAnimating: boolean = false;
  private isScrambling: boolean = false;
  private moveQueue: { move: CubeMove; speedMs: number; onDone?: () => void }[] = [];
  private moveSpeed: number = 180; // default turn duration in ms

  // Interactive Dragging
  private isPointerDown: boolean = false;
  private pointerDownPos = new THREE.Vector2();
  private lastPointerPos = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Active layer drag state
  private activeHit: {
    cubie: THREE.Group;
    faceNormal: THREE.Vector3;
    hitPoint: THREE.Vector3;
  } | null = null;
  private activeDrag: {
    axis: RotationAxis;
    layer: number;
    cubies: THREE.Group[];
    screenDir: THREE.Vector2;
    directionMultiplier: number;
    currentAngle: number;
  } | null = null;
  private isCameraOrbiting: boolean = false;

  // Camera Orbit state
  private spherical = {
    radius: 7.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3.4,
  };
  private targetSpherical = {
    radius: 7.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3.4,
  };

  // Exploded view
  private explosionFactor: number = 0;
  private targetExplosion: number = 0;

  // Render loop
  private reqId: number | null = null;
  private lastTime: number = performance.now();
  private disposed: boolean = false;

  constructor(container: HTMLElement, dimension: CubeDimension, theme: CubeTheme, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.dimension = dimension;
    this.theme = theme;
    this.callbacks = callbacks;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.Fog(0x0a0c10, 15, 32);

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.updateCameraPosition(true);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // fallback
    }

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Cube and Pivot groups
    this.cubeRoot = new THREE.Group();
    this.scene.add(this.cubeRoot);

    this.pivotGroup = new THREE.Group();
    this.scene.add(this.pivotGroup);

    // 7. Ground Contact Shadow & Atmosphere
    this.setupContactShadow();
    this.setupAtmosphere();

    // 8. Build Cubies
    this.rebuildCube();

    // 9. Attach Input Listeners
    this.bindEvents();

    // 10. Start loop
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.reqId = requestAnimationFrame(this.tick);
  }

  private setupLighting() {
    // 1. Key Softbox Light (Warm Sun Studio, sharp specular highlights)
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 3.2);
    keyLight.position.set(6, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 28;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
    this.scene.add(keyLight);

    // 2. High-contrast Rim / Kicker Light (grazing angle along beveled cubie chamfers)
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 2.0);
    rimLight.position.set(-7, -2, -7);
    this.scene.add(rimLight);

    // 3. Overhead Softbox Light (clean glossy top sheen)
    const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
    topLight.position.set(0, 12, 0);
    this.scene.add(topLight);

    // 4. Fill Sky & Floor Ambient bounce
    const fillLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.3);
    this.scene.add(fillLight);
  }

  private setupContactShadow() {
    // Ultra-soft realistic procedural studio floor shadow
    const shadowTex = createStudioFloorTexture();
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });

    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = -2.4;
    this.scene.add(this.contactShadow);
  }

  private setupAtmosphere() {
    // Atmospheric cinematic floating dust / light motes
    const particleCount = 65;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.045,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    this.particlesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.particlesMesh);
  }

  public rebuildCube(dimension?: CubeDimension) {
    if (dimension) {
      this.dimension = dimension;
    }

    // Clean existing cubies
    this.cubieMeshes.forEach(mesh => {
      this.cubeRoot.remove(mesh);
      mesh.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    });
    this.cubieMeshes = [];

    // Adjust camera distance depending on dimension
    const baseDist = this.dimension === 2 ? 6.2 : this.dimension === 3 ? 7.4 : this.dimension === 4 ? 8.6 : 9.8;
    this.targetSpherical.radius = baseDist;
    if (this.contactShadow) {
      this.contactShadow.position.y = -(this.dimension * 0.55 + 0.9);
      const scale = this.dimension * 0.8;
      this.contactShadow.scale.set(scale, scale, 1);
    }

    const n = this.dimension;
    const cubieSize = 0.94;
    const bevelRadius = 0.08;

    // 1. Internal Magnetic Core Mechanism (visible during rotation & exploded view)
    if (this.internalCoreGroup) {
      this.cubeRoot.remove(this.internalCoreGroup);
      this.internalCoreGroup.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
      this.internalCoreGroup = null;
    }

    const coreGroup = new THREE.Group();
    const coreBall = new THREE.Mesh(
      new THREE.SphereGeometry(cubieSize * 0.44, 24, 24),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x27272a),
        roughness: 0.25,
        metalness: 0.85,
        clearcoat: 0.6,
      })
    );
    coreBall.castShadow = true;
    coreGroup.add(coreBall);

    const stalkLength = n * 0.95;
    const stalkGeo = new THREE.CylinderGeometry(0.065, 0.065, stalkLength, 16);
    const stalkMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe4e4e7),
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.5,
    });

    const stalkY = new THREE.Mesh(stalkGeo, stalkMat);
    coreGroup.add(stalkY);

    const stalkX = new THREE.Mesh(stalkGeo, stalkMat);
    stalkX.rotation.z = Math.PI / 2;
    coreGroup.add(stalkX);

    const stalkZ = new THREE.Mesh(stalkGeo, stalkMat);
    stalkZ.rotation.x = Math.PI / 2;
    coreGroup.add(stalkZ);

    this.cubeRoot.add(coreGroup);
    this.internalCoreGroup = coreGroup;

    // 2. Prepare Speedcube Logo
    this.logoTex = createSpeedcubeLogoTexture(this.theme.colors.U);

    // 3. Cubie Geometry and Primary Plastic Body
    const cubieGeo = new RoundedBoxGeometry(cubieSize, cubieSize, cubieSize, 2, bevelRadius);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.theme.bodyColor),
      roughness: 0.42,
      metalness: 0.08,
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
    });

    const stickerSize = 0.82;
    const stickerDepth = 0.03;
    const stickerGeo = new RoundedBoxGeometry(stickerSize, stickerSize, stickerDepth, 2, 0.06);

    let id = 0;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          const isEdgeOrCorner = x === 0 || x === n - 1 || y === 0 || y === n - 1 || z === 0 || z === n - 1;
          if (!isEdgeOrCorner) {
            continue;
          }

          const cubieGroup = new THREE.Group();
          const bodyMesh = new THREE.Mesh(cubieGeo, bodyMat.clone());
          bodyMesh.castShadow = true;
          bodyMesh.receiveShadow = true;
          cubieGroup.add(bodyMesh);

          // Stickers
          const facesData: { mesh: THREE.Mesh; normal: THREE.Vector3; initialFace: FaceName }[] = [];

          const addSticker = (face: FaceName, normal: THREE.Vector3, rot: THREE.Euler) => {
            const hexColor = this.theme.colors[face];
            const isCenterU =
              face === 'U' &&
              this.theme.hasLogo &&
              (n % 2 === 1
                ? x === Math.floor(n / 2) && z === Math.floor(n / 2)
                : x === n - 1 && z === n - 1);

            const bumpMap = this.theme.isCarbon ? this.carbonTex : this.plasticBumpTex;
            const bumpScale = this.theme.bumpScale ?? (this.theme.isCarbon ? 0.012 : 0.007);

            const stickerMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(hexColor),
              map: isCenterU ? this.logoTex : null,
              bumpMap: isCenterU ? null : bumpMap,
              bumpScale,
              roughness: this.theme.roughness,
              metalness: this.theme.metalness,
              clearcoat: this.theme.clearcoat ?? 1.0,
              clearcoatRoughness: this.theme.clearcoatRoughness ?? 0.05,
              ior: this.theme.ior ?? 1.54,
              reflectivity: 0.65,
              emissive: this.theme.emission ? new THREE.Color(hexColor) : new THREE.Color(0x000000),
              emissiveIntensity: this.theme.emission ? 0.35 : 0.0,
            });

            const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
            stickerMesh.position.copy(normal).multiplyScalar(cubieSize / 2 + stickerDepth / 2 - 0.005);
            stickerMesh.rotation.copy(rot);
            stickerMesh.castShadow = true;
            stickerMesh.receiveShadow = true;

            stickerMesh.userData = {
              isSticker: true,
              face,
              isCenterLogo: isCenterU,
              cubieGroup,
              normal: normal.clone(),
            };

            cubieGroup.add(stickerMesh);
            facesData.push({
              mesh: stickerMesh,
              normal: normal.clone(),
              initialFace: face,
            });
          };

          // Right (+X)
          if (x === n - 1) addSticker('R', new THREE.Vector3(1, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
          // Left (-X)
          if (x === 0) addSticker('L', new THREE.Vector3(-1, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
          // Up (+Y)
          if (y === n - 1) addSticker('U', new THREE.Vector3(0, 1, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
          // Down (-Y)
          if (y === 0) addSticker('D', new THREE.Vector3(0, -1, 0), new THREE.Euler(Math.PI / 2, 0, 0));
          // Front (+Z)
          if (z === n - 1) addSticker('F', new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 0, 0));
          // Back (-Z)
          if (z === 0) addSticker('B', new THREE.Vector3(0, 0, -1), new THREE.Euler(0, Math.PI, 0));

          const posX = layerToCoord(x, n);
          const posY = layerToCoord(y, n);
          const posZ = layerToCoord(z, n);

          cubieGroup.position.set(posX, posY, posZ);

          cubieGroup.userData = {
            id: id++,
            gridPos: new THREE.Vector3(posX, posY, posZ),
            initialGridPos: new THREE.Vector3(posX, posY, posZ),
            stickers: facesData,
          };

          this.cubeRoot.add(cubieGroup);
          this.cubieMeshes.push(cubieGroup);
        }
      }
    }
  }

  public setTheme(theme: CubeTheme) {
    this.theme = theme;
    this.logoTex = createSpeedcubeLogoTexture(theme.colors.U);

    this.cubieMeshes.forEach(cubie => {
      cubie.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          if (obj.userData?.isSticker) {
            const face = obj.userData.face as FaceName;
            const isCenterLogo = obj.userData.isCenterLogo && theme.hasLogo;
            const hex = theme.colors[face];
            const mat = obj.material as THREE.MeshPhysicalMaterial;

            mat.color.set(hex);
            mat.roughness = theme.roughness;
            mat.metalness = theme.metalness;
            mat.clearcoat = theme.clearcoat ?? 1.0;
            mat.clearcoatRoughness = theme.clearcoatRoughness ?? 0.05;
            mat.ior = theme.ior ?? 1.54;

            if (isCenterLogo) {
              mat.map = this.logoTex;
              mat.bumpMap = null;
            } else {
              mat.map = null;
              mat.bumpMap = theme.isCarbon ? this.carbonTex : this.plasticBumpTex;
              mat.bumpScale = theme.bumpScale ?? (theme.isCarbon ? 0.012 : 0.007);
            }
            mat.needsUpdate = true;

            if (theme.emission) {
              mat.emissive.set(hex);
              mat.emissiveIntensity = 0.35;
            } else {
              mat.emissive.set(0x000000);
              mat.emissiveIntensity = 0;
            }
          } else {
            // Body plastic
            const mat = obj.material as THREE.MeshPhysicalMaterial;
            mat.color.set(theme.bodyColor);
            mat.needsUpdate = true;
          }
        }
      });
    });
  }

  public setExplodedView(factor: number) {
    this.targetExplosion = Math.max(0, Math.min(1.5, factor));
  }

  public setSpeed(speedMs: number) {
    this.moveSpeed = Math.max(30, Math.min(500, speedMs));
  }

  public resetCameraView(preset: 'front' | 'isometric' | 'top' | 'right' = 'isometric') {
    const baseDist = this.dimension === 2 ? 6.2 : this.dimension === 3 ? 7.4 : this.dimension === 4 ? 8.6 : 9.8;
    this.targetSpherical.radius = baseDist;

    switch (preset) {
      case 'front':
        this.targetSpherical.theta = 0;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'top':
        this.targetSpherical.theta = 0;
        this.targetSpherical.phi = 0.05;
        break;
      case 'right':
        this.targetSpherical.theta = Math.PI / 2;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'isometric':
      default:
        this.targetSpherical.theta = Math.PI / 4;
        this.targetSpherical.phi = Math.PI / 3.4;
        break;
    }
  }

  public orbitCameraBy(deltaTheta: number, deltaPhi: number) {
    this.targetSpherical.theta += deltaTheta;
    this.targetSpherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, this.targetSpherical.phi + deltaPhi));
  }

  /**
   * Execute a move either immediately or into the queue
   */
  public executeMove(move: CubeMove, speedOverride?: number, onDone?: () => void) {
    const speed = speedOverride !== undefined ? speedOverride : this.moveSpeed;

    if (this.isAnimating) {
      this.moveQueue.push({ move, speedMs: speed, onDone });
      return;
    }

    this.runMoveAnimation(move, speed, onDone);
  }

  private runMoveAnimation(move: CubeMove, durationMs: number, onDone?: () => void) {
    this.isAnimating = true;

    // 1. Find cubies that belong to this layer along this axis
    const cubiesToRotate = this.getCubiesInLayer(move.axis, move.layer);
    if (cubiesToRotate.length === 0) {
      this.isAnimating = false;
      if (onDone) onDone();
      this.processQueue();
      return;
    }

    // 2. Attach cubies to pivotGroup
    this.pivotGroup.rotation.set(0, 0, 0);
    this.pivotGroup.position.set(0, 0, 0);
    cubiesToRotate.forEach(cubie => {
      this.pivotGroup.attach(cubie);
    });

    const targetAngle = (Math.PI / 2) * move.direction;
    const startTime = performance.now();

    const animateStep = (now: number) => {
      if (this.disposed) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      this.pivotGroup.rotation[move.axis] = targetAngle * ease;

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        // Complete
        this.pivotGroup.rotation[move.axis] = targetAngle;
        this.pivotGroup.updateMatrixWorld(true);

        // Reattach to cubeRoot
        cubiesToRotate.forEach(cubie => {
          this.cubeRoot.attach(cubie);
          // Clean round coordinates to eliminate floating drift
          this.cleanCubieTransform(cubie);
        });

        this.pivotGroup.rotation.set(0, 0, 0);
        this.isAnimating = false;

        // Sound
        if (!move.isScramble) {
          soundManager.playTurn();
        }

        if (this.callbacks.onMoveExecuted) {
          this.callbacks.onMoveExecuted(move);
        }

        if (!this.isScrambling) {
          const solved = this.checkSolved();
          if (solved && this.callbacks.onSolved) {
            this.callbacks.onSolved();
          }
        }

        if (onDone) onDone();
        this.processQueue();
      }
    };

    requestAnimationFrame(animateStep);
  }

  private processQueue() {
    if (this.moveQueue.length > 0 && !this.isAnimating) {
      const next = this.moveQueue.shift()!;
      this.runMoveAnimation(next.move, next.speedMs, next.onDone);
    }
  }

  public scramble(moves: CubeMove[], onComplete?: () => void) {
    if (this.isAnimating) {
      this.moveQueue = [];
    }
    this.isScrambling = true;

    let index = 0;
    const total = moves.length;
    const scrambleSpeed = Math.max(30, Math.min(80, 800 / total));

    const nextStep = () => {
      if (index >= total) {
        this.isScrambling = false;
        soundManager.playBeep(true);
        if (onComplete) onComplete();
        return;
      }

      if (this.callbacks.onScrambleProgress) {
        this.callbacks.onScrambleProgress(index + 1, total);
      }

      const move = moves[index++];
      this.runMoveAnimation(move, scrambleSpeed, () => {
        // Play rapid tick sound occasionally during scramble
        if (index % 3 === 0) {
          soundManager.playClick(0.3);
        }
        nextStep();
      });
    };

    nextStep();
  }

  public getCubiesInLayer(axis: RotationAxis, layerIndex: number): THREE.Group[] {
    const eps = 0.28;
    const expectedCoord = layerToCoord(layerIndex, this.dimension);

    return this.cubieMeshes.filter(cubie => {
      const pos = cubie.position[axis];
      return Math.abs(pos - expectedCoord) < eps;
    });
  }

  private cleanCubieTransform(cubie: THREE.Group) {
    // Snap position to discrete grid
    const n = this.dimension;
    const lx = coordToLayer(cubie.position.x, n);
    const ly = coordToLayer(cubie.position.y, n);
    const lz = coordToLayer(cubie.position.z, n);

    cubie.position.x = layerToCoord(lx, n);
    cubie.position.y = layerToCoord(ly, n);
    cubie.position.z = layerToCoord(lz, n);

    // Snap rotation quaternion to clean 90-degree rotations
    const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
    const snap = (rad: number) => Math.round(rad / (Math.PI / 2)) * (Math.PI / 2);
    euler.x = snap(euler.x);
    euler.y = snap(euler.y);
    euler.z = snap(euler.z);
    cubie.quaternion.setFromEuler(euler);
    cubie.updateMatrixWorld(true);

    cubie.userData.gridPos = cubie.position.clone();
  }

  /**
   * Check if all stickers on each of the 6 faces have identical colors
   */
  public checkSolved(): boolean {
    const faces = STANDARD_FACE_ORDER;
    const faceColors: Record<FaceName, string[]> = {
      R: [],
      L: [],
      U: [],
      D: [],
      F: [],
      B: [],
    };

    const tempWorldNormal = new THREE.Vector3();
    const normalTargets: { face: FaceName; normal: THREE.Vector3 }[] = [
      { face: 'R', normal: new THREE.Vector3(1, 0, 0) },
      { face: 'L', normal: new THREE.Vector3(-1, 0, 0) },
      { face: 'U', normal: new THREE.Vector3(0, 1, 0) },
      { face: 'D', normal: new THREE.Vector3(0, -1, 0) },
      { face: 'F', normal: new THREE.Vector3(0, 0, 1) },
      { face: 'B', normal: new THREE.Vector3(0, 0, -1) },
    ];

    for (const cubie of this.cubieMeshes) {
      for (const stickerData of cubie.userData.stickers || []) {
        const mesh = stickerData.mesh as THREE.Mesh;
        // Calculate current world normal of sticker
        mesh.getWorldDirection(tempWorldNormal);

        // Find which cube face direction this sticker is currently pointing toward
        let bestFace: FaceName = 'U';
        let bestDot = -999;
        for (const target of normalTargets) {
          const dot = tempWorldNormal.dot(target.normal);
          if (dot > bestDot) {
            bestDot = dot;
            bestFace = target.face;
          }
        }

        // Must point closely along the normal (> 0.8 dot)
        if (bestDot > 0.8) {
          faceColors[bestFace].push(stickerData.initialFace);
        }
      }
    }

    // Check if each face has all stickers of the same color
    for (const face of faces) {
      const list = faceColors[face];
      if (list.length === 0) return false;
      const first = list[0];
      for (const col of list) {
        if (col !== first) {
          return false;
        }
      }
    }

    return true;
  }

  // --- Pointer & Touch Interaction ---

  private bindEvents() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    el.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onPointerDown(e: PointerEvent) {
    if (this.isAnimating) return;

    this.isPointerDown = true;
    this.pointerDownPos.set(e.clientX, e.clientY);
    this.lastPointerPos.set(e.clientX, e.clientY);
    this.activeDrag = null;
    this.isCameraOrbiting = false;

    // Raycast on cube stickers
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cubeRoot.children, true);

    const hitSticker = intersects.find(hit => hit.object.userData?.isSticker);

    if (hitSticker && hitSticker.point && hitSticker.face) {
      const stickerMesh = hitSticker.object as THREE.Mesh;
      const cubieGroup = stickerMesh.userData.cubieGroup as THREE.Group;
      const faceNormal = hitSticker.face.normal.clone().transformDirection(hitSticker.object.matrixWorld).round();

      this.activeHit = {
        cubie: cubieGroup,
        faceNormal,
        hitPoint: hitSticker.point.clone(),
      };
    } else {
      this.activeHit = null;
      this.isCameraOrbiting = true;
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.lastPointerPos.x;
    const deltaY = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos.set(e.clientX, e.clientY);

    // Orbit Camera mode
    if (this.isCameraOrbiting || !this.activeHit) {
      this.targetSpherical.theta -= deltaX * 0.007;
      this.targetSpherical.phi -= deltaY * 0.007;
      // Clamp phi to avoid flipping camera
      this.targetSpherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, this.targetSpherical.phi));
      return;
    }

    // Active Drag slice mode
    const totalDist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);

    if (!this.activeDrag && totalDist > 8) {
      // Calculate which slice to rotate
      this.initializeLayerDrag(e.clientX, e.clientY);
    }

    if (this.activeDrag) {
      // Project pointer displacement along activeDrag screen direction
      const currentDeltaX = e.clientX - this.pointerDownPos.x;
      const currentDeltaY = e.clientY - this.pointerDownPos.y;
      const dot = currentDeltaX * this.activeDrag.screenDir.x + currentDeltaY * this.activeDrag.screenDir.y;

      // Sensitive responsive rotational drag
      const angle = dot * 0.012 * this.activeDrag.directionMultiplier;
      this.activeDrag.currentAngle = angle;
      this.pivotGroup.rotation[this.activeDrag.axis] = angle;
    }
  }

  private initializeLayerDrag(clientX: number, clientY: number) {
    if (!this.activeHit) return;

    const { cubie, faceNormal, hitPoint } = this.activeHit;

    // The surface has two orthogonal tangent vectors
    const tangents: THREE.Vector3[] = [];
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

    axes.forEach(axis => {
      const testVec = new THREE.Vector3();
      testVec[axis] = 1;
      if (Math.abs(testVec.dot(faceNormal)) < 0.2) {
        tangents.push(testVec);
      }
    });

    if (tangents.length < 2) return;

    // Project both 3D tangent directions to 2D screen coordinates
    const p0 = hitPoint.clone().project(this.camera);
    const p1 = hitPoint.clone().add(tangents[0]).project(this.camera);
    const p2 = hitPoint.clone().add(tangents[1]).project(this.camera);

    const screenDir0 = new THREE.Vector2(p1.x - p0.x, -(p1.y - p0.y)).normalize();
    const screenDir1 = new THREE.Vector2(p2.x - p0.x, -(p2.y - p0.y)).normalize();

    const dragVec = new THREE.Vector2(clientX - this.pointerDownPos.x, clientY - this.pointerDownPos.y).normalize();

    const dot0 = Math.abs(dragVec.dot(screenDir0));
    const dot1 = Math.abs(dragVec.dot(screenDir1));

    let chosenTangent: THREE.Vector3;
    let chosenScreenDir: THREE.Vector2;

    if (dot0 > dot1) {
      chosenTangent = tangents[0];
      chosenScreenDir = screenDir0;
    } else {
      chosenTangent = tangents[1];
      chosenScreenDir = screenDir1;
    }

    // Rotation Axis = normal x tangent
    const rotationAxisVec = new THREE.Vector3().crossVectors(faceNormal, chosenTangent).round();

    let axis: RotationAxis = 'y';
    if (Math.abs(rotationAxisVec.x) > 0.5) axis = 'x';
    else if (Math.abs(rotationAxisVec.y) > 0.5) axis = 'y';
    else if (Math.abs(rotationAxisVec.z) > 0.5) axis = 'z';

    // Layer index of clicked cubie along that rotation axis
    const cubieLayer = coordToLayer(cubie.position[axis], this.dimension);
    const layerCubies = this.getCubiesInLayer(axis, cubieLayer);

    // Direction multiplier
    const sign = rotationAxisVec[axis] || 1;

    // Attach to pivotGroup
    this.pivotGroup.rotation.set(0, 0, 0);
    this.pivotGroup.position.set(0, 0, 0);
    layerCubies.forEach(c => this.pivotGroup.attach(c));

    this.activeDrag = {
      axis,
      layer: cubieLayer,
      cubies: layerCubies,
      screenDir: chosenScreenDir,
      directionMultiplier: sign,
      currentAngle: 0,
    };
  }

  private onPointerUp() {
    this.isPointerDown = false;

    if (this.activeDrag) {
      const { axis, layer, cubies, currentAngle } = this.activeDrag;
      this.activeDrag = null;
      this.activeHit = null;

      // Determine snap angle (snap to 0 or +/- 90 degrees)
      const threshold = 0.28; // ~16 degrees
      let targetSnap = 0;
      let moveDir: 1 | -1 = 1;

      if (currentAngle > threshold) {
        targetSnap = Math.PI / 2;
        moveDir = 1;
      } else if (currentAngle < -threshold) {
        targetSnap = -Math.PI / 2;
        moveDir = -1;
      }

      this.isAnimating = true;
      const startAngle = this.pivotGroup.rotation[axis];
      const startSnapTime = performance.now();
      const snapDuration = 140;

      const animateSnap = (now: number) => {
        if (this.disposed) return;
        const elapsed = now - startSnapTime;
        const progress = Math.min(1, elapsed / snapDuration);
        const ease = 1 - Math.pow(1 - progress, 3);

        this.pivotGroup.rotation[axis] = THREE.MathUtils.lerp(startAngle, targetSnap, ease);

        if (progress < 1) {
          requestAnimationFrame(animateSnap);
        } else {
          this.pivotGroup.rotation[axis] = targetSnap;
          this.pivotGroup.updateMatrixWorld(true);

          cubies.forEach(c => {
            this.cubeRoot.attach(c);
            this.cleanCubieTransform(c);
          });
          this.pivotGroup.rotation.set(0, 0, 0);
          this.isAnimating = false;

          if (targetSnap !== 0) {
            soundManager.playTurn();
            if (this.callbacks.onMoveExecuted) {
              this.callbacks.onMoveExecuted({
                axis,
                layer,
                direction: moveDir,
              });
            }

            const solved = this.checkSolved();
            if (solved && this.callbacks.onSolved) {
              this.callbacks.onSolved();
            }
          }

          this.processQueue();
        }
      };

      requestAnimationFrame(animateSnap);
    }

    this.activeHit = null;
    this.isCameraOrbiting = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.005;
    const minZoom = this.dimension === 2 ? 4.5 : 5.5;
    const maxZoom = 16.0;
    this.targetSpherical.radius = Math.max(minZoom, Math.min(maxZoom, this.targetSpherical.radius + zoomDelta));
  }

  private onResize() {
    if (!this.container || this.disposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateCameraPosition(immediate: boolean = false) {
    const lerpSpeed = immediate ? 1 : 0.08;
    this.spherical.theta = THREE.MathUtils.lerp(this.spherical.theta, this.targetSpherical.theta, lerpSpeed);
    this.spherical.phi = THREE.MathUtils.lerp(this.spherical.phi, this.targetSpherical.phi, lerpSpeed);
    this.spherical.radius = THREE.MathUtils.lerp(this.spherical.radius, this.targetSpherical.radius, lerpSpeed);

    const sinPhi = Math.sin(this.spherical.phi);
    const cosPhi = Math.cos(this.spherical.phi);
    const sinTheta = Math.sin(this.spherical.theta);
    const cosTheta = Math.cos(this.spherical.theta);

    this.camera.position.x = this.spherical.radius * sinPhi * sinTheta;
    this.camera.position.y = this.spherical.radius * cosPhi;
    this.camera.position.z = this.spherical.radius * sinPhi * cosTheta;
    this.camera.lookAt(0, 0, 0);
  }

  private tick() {
    if (this.disposed) return;
    const now = performance.now();
    const delta = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // 1. Smooth Camera Damping
    this.updateCameraPosition();

    // 2. Smooth Exploded View Damping
    this.explosionFactor = THREE.MathUtils.damp(this.explosionFactor, this.targetExplosion, 8, delta);
    if (Math.abs(this.explosionFactor - this.targetExplosion) > 0.001 || this.explosionFactor > 0.001) {
      const expMul = 1 + this.explosionFactor * 0.65;
      this.cubieMeshes.forEach(c => {
        if (!c.parent || c.parent === this.cubeRoot) {
          const base = c.userData.gridPos as THREE.Vector3;
          if (base) {
            c.position.copy(base).multiplyScalar(expMul);
          }
        }
      });
    }

    // 3. Ambient studio particles slow drift
    if (this.particlesMesh) {
      this.particlesMesh.rotation.y += delta * 0.03;
      this.particlesMesh.rotation.x += delta * 0.015;
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);

    this.reqId = requestAnimationFrame(this.tick);
  }

  public dispose() {
    this.disposed = true;
    if (this.reqId) cancelAnimationFrame(this.reqId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    this.plasticBumpTex.dispose();
    this.carbonTex.dispose();
    if (this.logoTex) this.logoTex.dispose();

    if (this.particlesMesh) {
      this.particlesMesh.geometry.dispose();
      (this.particlesMesh.material as THREE.Material).dispose();
    }

    this.cubieMeshes.forEach(m => {
      m.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
          else obj.material.dispose();
        }
      });
    });

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
