import { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Environment, Edges } from "@react-three/drei";
import * as THREE from "three";

/**
 * A faceted obsidian gem with luminous gold edges.
 * - Slow autonomous rotation (idle hypnotic motion)
 * - Reacts to pointer hover: spins faster, edges glow brighter
 * - Subtle internal light pulse
 * - Respects prefers-reduced-motion
 */
function Gem({
  interactive = true,
  reducedMotion = false,
}: {
  interactive?: boolean;
  reducedMotion?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  // Octahedron — sharp diamond silhouette matching the site's existing ornament
  const geo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reducedMotion) {
      const targetSpeed = hover ? 1.6 : 0.45;
      group.current.rotation.y += delta * targetSpeed;
      group.current.rotation.x += delta * targetSpeed * 0.35;
    }
    if (inner.current) {
      const t = state.clock.elapsedTime;
      const s = 0.55 + Math.sin(t * 1.3) * 0.04;
      inner.current.scale.setScalar(s);
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={reducedMotion ? 0 : 0.25}
      floatIntensity={reducedMotion ? 0 : 0.6}
    >
      <group
        ref={group}
        onPointerOver={() => interactive && setHover(true)}
        onPointerOut={() => interactive && setHover(false)}
      >
        {/* Outer crystal — transmissive, faceted */}
        <mesh geometry={geo} scale={1.15}>
          <MeshTransmissionMaterial
            backside
            thickness={0.6}
            roughness={0.08}
            transmission={1}
            ior={2.1}
            chromaticAberration={0.05}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.4}
            temporalDistortion={0.15}
            color={"#1a1a22"}
            attenuationColor={"#3a2a14"}
            attenuationDistance={1.2}
          />
          <Edges scale={1} threshold={1} color={hover ? "#e8d5a3" : "#c9a96e"} />
        </mesh>

        {/* Inner glowing core — gold light trapped inside */}
        <mesh ref={inner} geometry={geo}>
          <meshBasicMaterial
            color={"#c9a96e"}
            transparent
            opacity={hover ? 0.55 : 0.32}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

export interface ObsidianLogo3DProps {
  size?: number;
  interactive?: boolean;
  className?: string;
}

export default function ObsidianLogo3D({
  size = 220,
  interactive = true,
  className,
}: ObsidianLogo3DProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        pointerEvents: interactive ? "auto" : "none",
      }}
      aria-label="Obsidian gem mark"
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} color="#e8d5a3" />
        <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#1d3a55" />
        <pointLight position={[0, 0, 2]} intensity={0.8} color="#c9a96e" />

        <Suspense fallback={null}>
          <Gem interactive={interactive} reducedMotion={reducedMotion} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
