import React, { useRef, Suspense, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';

export type NimoEmotion = 'idle' | 'happy' | 'sleepy' | 'curious' | 'proud' | 'playful' | 'listening' | 'concerned' | 'comfort' | 'paused' | 'thinking' | 'speaking' | 'cooldown';

interface NimoModelProps {
  emotion: NimoEmotion;
}

function NimoModel({ emotion = 'idle', ...props }: NimoModelProps) {
  const { viewport } = useThree();

  // --- REFS ---
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const mouthInteriorRef = useRef<THREE.Mesh>(null);
  const tongueRef = useRef<THREE.Mesh>(null);
  const leftUpperLipRef = useRef<THREE.Mesh>(null);
  const rightUpperLipRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const leftCornerRef = useRef<THREE.Mesh>(null);
  const rightCornerRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  
  const flLegRef = useRef<THREE.Group>(null);
  const frLegRef = useRef<THREE.Group>(null);
  const blLegRef = useRef<THREE.Group>(null);
  const brLegRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  // --- WANDER STATE ---
  const wanderRef = useRef({
    state: 'walking', // 'walking' | 'stopped' | 'sitting' | 'sniffing' | 'chewing' | 'playful_run'
    direction: 1, 
    timer: 2.0,
    stateTimer: 0,
    x: 0,
    z: 0,
    targetX: 0, // Random destination they decide to walk to
    targetZ: 0, // Random destination in Z space
    rotY: Math.PI / 2, // Start by facing to the right
    expression: 0 // Tracks the random face Nimo makes when stopped
  });

  // --- INTERACTION ---
  const tapTimeRef = useRef<number>(-999);
  const tapTriggeredRef = useRef<boolean>(false);
  const tapDanceSequenceRef = useRef<number[]>([]);
  const tapRandomSeedRef = useRef<number>(0);

  // Helper to generate 2-3 random dance moves
  const generateDanceSequence = () => {
    tapRandomSeedRef.current = Math.random();
    const moves = Math.random() > 0.5 ? 2 : 3;
    return Array.from({ length: moves }, () => Math.floor(Math.random() * 5));
  };

  const handleTap = (e: any) => {
    e.stopPropagation(); // Prevents the tap from bubbling to the background and changing the global emotion
    if (emotion !== 'idle') return; // Do not allow playful taps if Nimo is actively engaged in a session
    tapTriggeredRef.current = true;
    tapDanceSequenceRef.current = generateDanceSequence();
  };

  // --- PROCEDURAL ANIMATION ENGINE ---
  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current || !headRef.current) return;
    
    // Cap delta to prevent huge physics jumps when the app resumes from the background
    const safeDelta = Math.min(delta, 0.1);

    const time = state.clock.getElapsedTime();
    
    // Dynamically calculate safe movement boundaries based on actual screen size
    const safeMargin = 0.6; // Safe padding to prevent ears/tail/body from clipping
    const maxBoundX = Math.max(0.2, (viewport.width / 2) - safeMargin);

    // --- AUTONOMOUS WANDER STATE MACHINE ---
    const w = wanderRef.current;
    w.stateTimer += safeDelta;
    
    if (tapTriggeredRef.current) {
      tapTimeRef.current = time;
      tapTriggeredRef.current = false;
      
      w.state = 'playful_run';
      w.timer = 2.0; // 2 seconds of playful zoomies after dance!
      w.targetX = (Math.random() * 2 - 1) * (maxBoundX - 0.3);
      w.targetZ = -1.5 + Math.random() * 1.0;
      const dx = w.targetX - w.x;
      const dz = w.targetZ - w.z;
      w.direction = dx > 0 ? 1 : -1;
      w.rotY = Math.atan2(dx, dz);
    }
    const timeSinceTap = time - tapTimeRef.current;
    const isTapReacting = timeSinceTap < 4.0;

    // Procedural Terrain Math (creates a natural 3D rolling hill effect in both X and Z directions)
    const baseY = -1.5 + Math.sin(w.x * 2.5) * 0.03 + Math.cos(w.z * 1.5) * 0.03;
    const slopeZ = Math.cos(w.x * 2.5) * 0.075 - Math.sin(w.z * 1.5) * 0.045;

    // Base Parameters
    let targetY = baseY; // Grounded seamlessly on the natural terrain
    let breathSpeed = 1.5; // Gentle, slow, innocent breathing
    let breathIntensity = 0.015;
    let bodySquishY = 1; // For bouncy squash/stretch
    let bodySquishXZ = 1;
    let legSquashY = 1.0; // Dynamic hoof compression
    let headTiltX = 0; // Up/Down
    let headTiltY = 0; // Left/Right
    let headTiltZ = 0; // Puppy tilt
    
    let earDroop = 0.2; // Base droopy shy ears
    let leftEarDroopOffset = 0; // Asymmetrical ear control
    let rightEarDroopOffset = 0;
    let tailWag = Math.sin(time * 1.5) * 0.05; // Tiny idle wag
    
    // Procedural Face Targets
    let mouthScaleX = 1.0;
    let mouthScaleY = 0.5;
    let browRotZ = 0;       // Angle of eyebrows
    let browPosY = 0;       // Left brow height
    let rightBrowPosY = 0;  // Right brow height (separated for asymmetrical expressions)
    let overrideBlink: number | null = null; // Allows specific expressions to hold blinks/squints
    
    // Procedural Eye Tracking / Darting
    // Base tiny ambient eye darts to make them feel alive
    let dartX = (Math.sin(time * 0.5) * Math.sin(time * 0.3)) * 0.005;
    let dartY = (Math.cos(time * 0.4) * Math.cos(time * 0.2)) * 0.003;
    let leftEyeLookX = dartX;
    let leftEyeLookY = dartY;
    let rightEyeLookX = dartX;
    let rightEyeLookY = dartY;
    
    // Procedural Leg Tracking
    let flRotX = Math.sin(time * breathSpeed) * 0.05;
    let frRotX = Math.sin(time * breathSpeed + Math.PI) * 0.05;
    let blRotX = Math.sin(time * breathSpeed + Math.PI) * 0.05;
    let brRotX = Math.sin(time * breathSpeed) * 0.05;
    let flRotZ = 0, frRotZ = 0, blRotZ = 0, brRotZ = 0;

    if (emotion === 'idle' && !isTapReacting) {
      w.timer -= delta;
      const currentRotY = groupRef.current.rotation.y;
      
      // We are turning if our actual rotation is significantly different from our target rotation
      const isTurning = Math.abs(currentRotY - w.rotY) > 0.5;

      if (w.timer <= 0) {
        w.stateTimer = 0; // Reset state timer upon transition
        if (w.state === 'walking' || w.state === 'playful_run') {
          // Time to do something else
          const rand = Math.random();
          if (rand < 0.40) { 
            w.state = 'chewing';
            w.timer = 5.0 + Math.random() * 5.0; // Chew on grass for 5-10 sec
          } else if (rand < 0.65) { 
            w.state = 'sniffing';
            w.timer = 3.0 + Math.random() * 4.0; // Sniff the grass for 3-7 sec
          } else if (rand < 0.85) { 
            w.state = 'stopped';
            w.timer = 4.0 + Math.random() * 4.0; // Rest for 4-8 sec
          } else {
            w.state = 'sitting';
            w.timer = 5.0 + Math.random() * 5.0; // Sit quietly for 5-10 sec
          }
        } else {
          // Intelligent 3D Destination Pathfinding
          w.state = 'walking';
          
          // 75% bias for lateral paths (Side profile), 25% bias for forward paths (Front profile)
          if (Math.random() < 0.75) {
            w.targetX = (w.x > 0 ? -1 : 1) * (Math.random() * maxBoundX - 0.2);
            w.targetZ = w.z + (Math.random() * 0.4 - 0.2); // Stay on similar depth plane
          } else {
            w.targetX = w.x + (Math.random() * 1.0 - 0.5);
            w.targetZ = w.z + Math.random() * 0.8; // Move forward toward camera
          }
          
          // If it gets too close to the front boundary, push it back gently diagonally
          if (w.z > 0.0) {
             w.targetZ = -1.5 + Math.random() * 0.5;
          }

          // Clamp targets to safe screen boundaries
          w.targetX = Math.max(-maxBoundX, Math.min(maxBoundX, w.targetX));
          w.targetZ = Math.max(-2.0, Math.min(0.8, w.targetZ));

          // Calculate optimal path angle and walk time
          const dx = w.targetX - w.x;
          const dz = w.targetZ - w.z;
          w.direction = dx > 0 ? 1 : -1;
          w.rotY = Math.atan2(dx, dz); // Points Nimo precisely at their new destination
          
          // Walking time based on distance
          const dist = Math.sqrt(dx * dx + dz * dz);
          w.timer = (dist / 0.1) + 1.0; // Wait slightly longer per distance because speed is slower
        }
      }

      if (w.state === 'walking' || w.state === 'playful_run') {
        const distSq = Math.pow(w.targetX - w.x, 2) + Math.pow(w.targetZ - w.z, 2);
        // Force an early stop if they arrive at their destination
        if (distSq < 0.05) {
          w.timer = 0;
        } else {
          // Smoothly move across X and Z based on actual body rotation
          const baseSpeed = w.state === 'playful_run' ? 0.35 : 0.08; // Slower peaceful walk
          let speedMult = 1.0;
          if (w.timer < 1.0) speedMult = Math.max(0.1, w.timer / 1.0); // Natural deceleration
          
          w.x += Math.sin(currentRotY) * baseSpeed * speedMult * safeDelta;
          w.z += Math.cos(currentRotY) * baseSpeed * speedMult * safeDelta;
        }
      }
      
      // Wander Layer Animations
      if (w.state === 'walking') {
        const walkSpeed = isTurning ? 3 : 4; // Much softer, slower movement
        const walkTime = time * walkSpeed;
        const walkBounce = Math.abs(Math.sin(walkTime));
        
        // Fluffy body bouncing gently
        targetY = baseY + walkBounce * (isTurning ? 0.02 : 0.03); 
        
        // Soft breathing overlap
        breathSpeed = 2.0;
        
        // Slight wool jiggle
        bodySquishY = 1.0 + walkBounce * 0.03;
        bodySquishXZ = 1.0 - walkBounce * 0.01;
        
        // Tiny hoof compression exactly when they plant their feet
        legSquashY = 1.0 - walkBounce * 0.1;
        
        // Subtle ear flop 
        earDroop = 0.15 + Math.cos(walkTime) * 0.06; 
        
        // Head movement synced to steps (bobs up/down, and waddles side-to-side)
        headTiltX = 0.05 + walkBounce * 0.04; // Look slightly down while walking naturally
        headTiltZ = Math.sin(walkTime * 0.5) * 0.05;
        
        if (isTurning) {
          // Look toward the direction of turn softly
          headTiltY = w.direction * 0.2;
        } else {
          headTiltY = Math.sin(walkTime * 0.25) * 0.1; // Gentle look around while walking
        }
        
        tailWag = Math.sin(walkTime * 0.8) * 0.05;
        
        // Tiny slow feet movement
        flRotX = Math.sin(walkTime) * 0.25; frRotX = Math.sin(walkTime + Math.PI) * 0.25;
        blRotX = Math.sin(walkTime + Math.PI) * 0.25; brRotX = Math.sin(walkTime) * 0.25;
      } else if (w.state === 'stopped') {
        // Look around calmly, enjoying the environment
        headTiltY = Math.sin(time * 0.4) * 0.4; 
        headTiltX = -0.05 + Math.cos(time * 0.3) * 0.05; 
        headTiltZ = 0; 
        
        targetY = baseY; 
        bodySquishY = 1.0; bodySquishXZ = 1.0; 
        flRotX = 0; frRotX = 0; blRotX = 0; brRotX = 0; 
        legSquashY = 1.0; 
        
        // Look around
        leftEyeLookX = Math.sin(time * 0.5) * 0.02; rightEyeLookX = leftEyeLookX;
        leftEyeLookY = Math.cos(time * 0.7) * 0.01; rightEyeLookY = leftEyeLookY;
        
        earDroop = 0.1 + Math.sin(time * 1.5) * 0.03; 
        tailWag = Math.sin(time * 2) * 0.04; 
        breathSpeed = 1.5;
        
        mouthScaleX = 0.9; mouthScaleY = 0.4; browRotZ = 0.05; browPosY = 0; rightBrowPosY = 0;
      } else if (w.state === 'sitting') {
        // Sit quietly and rest
        targetY = baseY - 0.15; 
        headTiltX = 0.1 + Math.sin(time * 0.5) * 0.05; 
        headTiltY = Math.sin(time * 0.3) * 0.15; // Slow gentle looks
        headTiltZ = 0;
        
        bodySquishY = 0.9; bodySquishXZ = 1.1; 
        legSquashY = 0.8;
        
        flRotX = -0.6; frRotX = -0.6; blRotX = 0.6; brRotX = 0.6; 
        flRotZ = -0.2; frRotZ = 0.2; blRotZ = -0.2; brRotZ = 0.2;
        
        earDroop = 0.25; 
        tailWag = 0; 
        breathSpeed = 1.0; // Very slow and calm
        
        overrideBlink = (Math.sin(time * 1.5) * Math.sin(time * 0.8)) > 0.9 ? 0.2 : 1.0; 
        
        mouthScaleX = 0.8; mouthScaleY = 0.3; browRotZ = 0.02; browPosY = 0; rightBrowPosY = 0;
      } else if (w.state === 'sniffing') {
        targetY = baseY - 0.05; // Lean down into the grass
        headTiltX = 0.45; // Head tilted way down
        headTiltY = Math.sin(time * 3) * 0.1; // Slower sniffs
        headTiltZ = Math.sin(time * 2) * 0.04; 
        breathSpeed = 2.5; // Calm sniffing breaths
        tailWag = Math.sin(time * 3) * 0.05; // Tiny happy micro wags
        earDroop = 0.25; // Ears fall forward naturally
        mouthScaleX = 0.6; mouthScaleY = 0.6; // Tiny sniffing 'o' mouth
        browRotZ = 0; // Relaxed brow
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1; // Plant feet securely
      } else if (w.state === 'chewing') {
        targetY = baseY - 0.02; // Lean down slightly
        headTiltX = 0.35 + Math.sin(time * 1.5) * 0.05; // Slow grazing head bob
        
        // Relaxed munching mouth
        const chewCycle = Math.sin(time * 15);
        mouthScaleX = 0.7 + Math.max(0, chewCycle) * 0.3;
        mouthScaleY = 0.2 + Math.max(0, chewCycle) * 0.4;
        
        breathSpeed = 1.5; // Calm breathing while eating
        tailWag = Math.sin(time * 2) * 0.06; // Happy calm eating wag
        earDroop = 0.15 + chewCycle * 0.03; // Ears twitch with each munch softly
        browRotZ = 0.05; // Content brows
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1; // Plant feet
      } else if (w.state === 'playful_run') {
        // Happy calm trot
        breathSpeed = 3.0;
        const hopSpeed = 8;
        const hopSine = Math.sin(time * hopSpeed);
        const isBounding = hopSine > 0;
        
        targetY = baseY + Math.max(0, hopSine) * 0.1; // Gentle Jumps!
        
        bodySquishY = 1.0 + (hopSine * 0.05);  
        bodySquishXZ = 1.0 - (hopSine * 0.02);  
        
        const verticalVelocity = Math.cos(time * hopSpeed);
        earDroop = 0.1 + (verticalVelocity * 0.2); 
        
        headTiltX = -0.05 + (verticalVelocity * 0.05); 
        headTiltY = w.direction * 0.2; // Look into the run
        tailWag = Math.sin(time * 15) * 0.15; // Happy tail
        
        mouthScaleX = 1.0; mouthScaleY = 0.6; // Gentle smile
        browRotZ = 0.05; browPosY = 0.01; rightBrowPosY = 0.01;
        
        if (isBounding) {
           const runTime = time * 20; 
           flRotX = Math.sin(runTime) * 0.4; frRotX = Math.sin(runTime + Math.PI) * 0.4;
           blRotX = Math.sin(runTime + Math.PI) * 0.4; brRotX = Math.sin(runTime) * 0.4;
        } else {
           flRotX = -0.2; frRotX = -0.2; blRotX = 0.2; brRotX = 0.2;
           flRotZ = 0.1; frRotZ = -0.1; blRotZ = 0.1; brRotZ = -0.1;
        }
      }
    } else if (emotion === 'playful') {
      // Playful emotion overrides wandering with hyper-speed running bounds
      const currentRotY = groupRef.current.rotation.y;
      w.x += Math.sin(currentRotY) * 0.9 * delta;
      // Trigger the turn slightly earlier so they don't skid too far off screen
      if (w.x > maxBoundX && w.direction === 1) {
        w.direction = -1;
        w.rotY = -Math.PI / 2;
      } else if (w.x < -maxBoundX && w.direction === -1) {
        w.direction = 1;
        w.rotY = Math.PI / 2;
      }
    } else if (emotion === 'listening' || emotion === 'speaking') {
      w.state = 'stopped';
      // Walk towards user to listen or speak intently
      const dx = 0 - w.x; 
      const dz = 1.2 - w.z; // Move close to screen, but stay fully visible
      const distSq = dx*dx + dz*dz;
      if (distSq > 0.05) {
        w.rotY = Math.atan2(dx, dz);
        w.x += Math.sin(w.rotY) * 0.4 * safeDelta;
        w.z += Math.cos(w.rotY) * 0.4 * safeDelta;
        
        // brisk walking animation to user
        const walkTime = time * 8;
        const walkBounce = Math.abs(Math.sin(walkTime));
        targetY = baseY + walkBounce * 0.04;
        bodySquishY = 1.0 + walkBounce * 0.04;
        bodySquishXZ = 1.0 - walkBounce * 0.015;
        flRotX = Math.sin(walkTime) * 0.35; frRotX = Math.sin(walkTime + Math.PI) * 0.35;
        blRotX = Math.sin(walkTime + Math.PI) * 0.35; brRotX = Math.sin(walkTime) * 0.35;
        headTiltX = -0.05; 
      } else {
        // Arrived at listening spot
        w.rotY = THREE.MathUtils.lerp(w.rotY, 0, 0.1); // Gently turn to face front
      }
    } else if (emotion === 'paused' || emotion === 'thinking') {
      w.state = 'stopped';
      // Step backwards slightly to give the user space
      const dx = 0 - w.x; 
      const dz = 0.8 - w.z; 
      const distSq = dx*dx + dz*dz;
      if (distSq > 0.05) {
        w.rotY = Math.atan2(dx, dz);
        w.x += Math.sin(w.rotY) * 0.3 * safeDelta;
        w.z += Math.cos(w.rotY) * 0.3 * safeDelta;
        
        const walkTime = time * 6;
        const walkBounce = Math.abs(Math.sin(walkTime));
        targetY = baseY + walkBounce * 0.03;
        flRotX = Math.sin(walkTime) * 0.2; frRotX = Math.sin(walkTime + Math.PI) * 0.2;
        blRotX = Math.sin(walkTime + Math.PI) * 0.2; brRotX = Math.sin(walkTime) * 0.2;
      } else {
        w.rotY = THREE.MathUtils.lerp(w.rotY, 0, 0.1); 
      }
    } else {
      // Pause wander logic for other static emotions
      w.state = 'stopped';
      if (emotion === 'comfort' || emotion === 'shy' || emotion === 'cooldown') {
        w.rotY = 0; // Turn around to intimately face the user
      }
    }

    // Safety clamp to ensure Nimo NEVER gets lost off-screen due to physics glitches
    w.x = Math.max(-maxBoundX - 0.5, Math.min(maxBoundX + 0.5, w.x));
    w.z = Math.max(-2.0, Math.min(2.0, w.z));

    // Apply Base Movement Globally
    groupRef.current.position.x = w.x;
    groupRef.current.position.z = w.z;
    let targetGroupRotY = w.rotY;
    let targetGroupRotZ = slopeZ; // Match the procedural terrain tilt

    // --- EMOTION LOGIC ---
    if (emotion === 'shy' || emotion === 'comfort' || emotion === 'concerned') {
      // Tucks head down shyly, ears droop further
      headTiltX = 0.25; 
      earDroop = 0.4;
      breathSpeed = 1.0; // Slow, regulating breaths
      
      mouthScaleX = 0.6; mouthScaleY = 0.6; // Small, worried 'o' shape
      browRotZ = -0.2; // Worried eyebrows ( / \ )
      browPosY = -0.01; rightBrowPosY = -0.01;
      
      // Legs tucked in defensively
      flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
      flRotZ = 0.1; frRotZ = -0.1; blRotZ = 0.1; brRotZ = -0.1;
    } else if (emotion === 'happy' || emotion === 'proud') {
      // Gentle, perked up, full of innocent joy
      breathSpeed = 3.5;
      targetY = baseY + Math.max(0, Math.sin(time * 6)) * 0.04;
      bodySquishY = 1 + Math.sin(time * 6) * 0.03;
      bodySquishXZ = 1 - Math.sin(time * 6) * 0.01;
      earDroop = -0.1; // Ears perk up
      headTiltX = -0.1; // Looking up slightly proudly
      tailWag = Math.sin(time * 8) * 0.15; // Excited wag
      
      mouthScaleX = 1.8; mouthScaleY = 0.2; // Wide happy smile
      browRotZ = 0.1; // Happy, bright eyebrows
      browPosY = 0.02; rightBrowPosY = 0.02;
      
      // Excited eye darting
      const pDartX = (Math.sin(time * 5) > 0.5 ? 1 : -1) * 0.01;
      const pDartY = (Math.cos(time * 4) > 0.5 ? 1 : -1) * 0.005;
      leftEyeLookX = pDartX; rightEyeLookX = pDartX; leftEyeLookY = pDartY; rightEyeLookY = pDartY;
      
      // Soft Bouncing
      const isBounding = Math.sin(time * 6) > 0;
      if (isBounding) {
         const runTime = time * 10;
         flRotX = Math.sin(runTime) * 0.3; frRotX = Math.sin(runTime + Math.PI) * 0.3;
         blRotX = Math.sin(runTime + Math.PI) * 0.3; brRotX = Math.sin(runTime) * 0.3;
      } else {
         flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
         flRotZ = 0.05; frRotZ = -0.05; blRotZ = 0.05; brRotZ = -0.05;
      }
    } else if (emotion === 'playful') {
      // EXAGGERATED RUNNING & HOPPING ANIMATION
      breathSpeed = 4.0;
      const hopSpeed = 10;
      const hopSine = Math.sin(time * hopSpeed);
      const isBounding = hopSine > 0;
      
      targetY = baseY + Math.max(0, hopSine) * 0.18; // High jumps!
      
      // Extreme organic squash and stretch driven smoothly by the sine wave
      bodySquishY = 1.0 + (hopSine * 0.15);  // Stretches up in air, squishes down on impact
      bodySquishXZ = 1.0 - (hopSine * 0.1);  // Skinnier in air, fatter on impact
      
      // Ears flap wildly based on vertical velocity (derivative of sine is cosine)
      const verticalVelocity = Math.cos(time * hopSpeed);
      earDroop = -0.1 + (verticalVelocity * 0.5); 
      
      headTiltX = -0.15 + (verticalVelocity * 0.15); // Head bobs into the jump
      tailWag = Math.sin(time * 20) * 0.4; // Frantic puppy tail
      
      mouthScaleX = 1.2; mouthScaleY = 1.5; // Big excited open 'O' mouth
      browRotZ = 0.15; browPosY = 0.04; rightBrowPosY = 0.04;
      
      // Frantic eye darts
      leftEyeLookX = (Math.sin(time * 8) > 0 ? 1 : -1) * 0.015;
      rightEyeLookX = leftEyeLookX;
      leftEyeLookY = (Math.cos(time * 7) > 0 ? 1 : -1) * 0.01;
      rightEyeLookY = leftEyeLookY;
      
      if (isBounding) {
         // Airborne: Tiny feet pedaling VERY fast!
         const runTime = time * 45; // Blur of motion
         flRotX = Math.sin(runTime) * 0.8; frRotX = Math.sin(runTime + Math.PI) * 0.8;
         blRotX = Math.sin(runTime + Math.PI) * 0.8; brRotX = Math.sin(runTime) * 0.8;
         flRotZ = 0; frRotZ = 0; blRotZ = 0; brRotZ = 0;
      } else {
         // Grounded: Deep squash stance bracing for impact
         flRotX = -0.5; frRotX = -0.5; blRotX = 0.5; brRotX = 0.5;
         flRotZ = 0.3; frRotZ = -0.3; blRotZ = 0.3; brRotZ = -0.3;
      }
    } else if (emotion === 'curious') {
      // Classic inquisitive puppy tilt
      headTiltZ = 0.25; 
      headTiltX = 0.1;
      earDroop = 0.0;
      
      mouthScaleX = 0.8; mouthScaleY = 0.8; // Curious 'o'
      browRotZ = 0.1; 
      browPosY = 0.04; rightBrowPosY = -0.02; // Asymmetrical: one brow up!
      
      // Dart intensely to the side, then lock focus
      leftEyeLookX = Math.sin(time * 2) > 0 ? 0.015 : 0;
      rightEyeLookX = leftEyeLookX;
      
      // One paw slightly raised
      flRotX = -0.2;
    } else if (emotion === 'sleepy') {
      // Sinks into the ground softly
      targetY = baseY - 0.15;
      headTiltX = 0.35; // Nodding off
      earDroop = 0.5; // Ears completely flat
      breathSpeed = 0.8; // Very slow breathing
      
      mouthScaleX = 0.8; mouthScaleY = 0.2; // Relaxed mouth
      browRotZ = 0; browPosY = -0.02; rightBrowPosY = -0.02; // Heavy brows
      
      // SPLOOT! Legs splayed out lazily
      flRotX = -0.6; frRotX = -0.6; blRotX = 0.5; brRotX = 0.5;
      flRotZ = -0.3; frRotZ = 0.3; blRotZ = -0.3; brRotZ = 0.3;
    } else if (emotion === 'listening') {
      // Check if arrived at listening point
      if (Math.pow(0 - w.x, 2) + Math.pow(1.2 - w.z, 2) <= 0.05) {
        targetY = baseY; 
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
        
        const nodCycle = Math.sin(time * 1.5) * Math.sin(time * 0.8);
        const isNodding = nodCycle > 0.85;
        
        headTiltX = -0.10 + (isNodding ? 0.08 : Math.sin(time * 0.5) * 0.02); // Focus up at the user directly, slight nod down
        headTiltY = Math.sin(time * 0.3) * 0.04; // tiny micro sway
        headTiltZ = 0.06 + Math.sin(time * 0.2) * 0.02; // curious puppy tilt
        
        mouthScaleX = 0.5; mouthScaleY = 1.0; // Very prominent concentrated tiny 'o' trying to understand
        browRotZ = 0.15; browPosY = 0.03; rightBrowPosY = 0.05; // Asymmetrical focused brows
        earDroop = -0.05 + (isNodding ? 0.1 : 0); // Ears adjust on nod
        
        overrideBlink = (Math.sin(time * 3) * Math.sin(time * 1.5)) > 0.98 ? 0.1 : 0.9; // intense focus, rare blink
        breathSpeed = 1.2; // very still and calm
        
        // Micro eye adjustments showing attention to user
        leftEyeLookX = Math.sin(time * 4) * 0.005;
        rightEyeLookX = leftEyeLookX;
        leftEyeLookY = Math.sin(time * 2.5) * 0.005;
        rightEyeLookY = leftEyeLookY;
      }
    } else if (emotion === 'paused') {
      // Check if arrived at step-back point
      if (Math.pow(0 - w.x, 2) + Math.pow(0.8 - w.z, 2) <= 0.05) {
        targetY = baseY;
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
        headTiltX = 0.05; // Nodding respectfully
        headTiltZ = Math.sin(time * 0.5) * 0.05; // Gentle tilt
        mouthScaleX = 0.8; mouthScaleY = 0.2; // Relaxed mouth
        browRotZ = 0.05;
        earDroop = 0.15; // Soft ears
        breathSpeed = 1.2; // Calm
        
        // Reflective eye movement, looking off slightly
        leftEyeLookX = 0.01 + Math.sin(time * 1.5) * 0.01;
        rightEyeLookX = leftEyeLookX;
        leftEyeLookY = -0.01 + Math.cos(time * 1.2) * 0.005;
        rightEyeLookY = leftEyeLookY;
      }
    } else if (emotion === 'thinking') {
      if (Math.pow(0 - w.x, 2) + Math.pow(0.8 - w.z, 2) <= 0.05) {
        targetY = baseY;
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
        headTiltX = -0.15 + Math.sin(time * 2) * 0.05; // Look up, pondering
        headTiltY = Math.sin(time * 1.5) * 0.1; // Slow sway
        leftEyeLookX = Math.sin(time * 5) * 0.02; // Darting tracking eyes
        rightEyeLookX = leftEyeLookX;
        mouthScaleX = 0.6; mouthScaleY = 0.6; // Concentrated 'o'
        browRotZ = -0.05; browPosY = 0.02; rightBrowPosY = 0.04;
        earDroop = 0.1;
        overrideBlink = 0.9; // Squinting
        breathSpeed = 1.5;
      }
    } else if (emotion === 'speaking') {
      if (Math.pow(0 - w.x, 2) + Math.pow(1.2 - w.z, 2) <= 0.05) {
        targetY = baseY + Math.max(0, Math.sin(time * 4)) * 0.03; // Gentle bounce
        flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
        headTiltX = -0.1 + Math.sin(time * 2) * 0.03;
        headTiltZ = Math.sin(time * 3) * 0.04; // Playful tilt
        
        // Progressive talking animation mapped to a sine wave
        const isTalking = Math.sin(time * 12) > 0;
        mouthScaleX = 1.2; 
        mouthScaleY = 0.4 + (isTalking ? 0.6 : 0);
        browRotZ = 0.1;
        earDroop = 0.05;
        breathSpeed = 2.0;
      }
    } else if (emotion === 'cooldown') {
      targetY = baseY;
      headTiltX = -0.05 + Math.sin(time * 0.5) * 0.05; // Soft gentle nods to the user
      headTiltZ = Math.sin(time * 0.3) * 0.02;
      earDroop = 0.05;
      breathSpeed = 1.0; // Deeply calming breaths
      mouthScaleX = 1.4; mouthScaleY = 0.3; // Soft warm smile
      browRotZ = 0.1; browPosY = 0.01; rightBrowPosY = 0.01;
      overrideBlink = 0.8; // Warm affectionate squint
      tailWag = Math.sin(time * 2) * 0.05; // Gentle happy wag
    }

    // --- TAP REACTION STACKING ---
    if (isTapReacting) {
      // Affectionate touch interaction sequence (4 seconds total)
      const fadeOut = Math.max(0, Math.min(1, (4.0 - timeSinceTap) / 0.5));
      
      // Store original values from emotion
      const origTargetY = targetY;
      const origHeadTiltX = headTiltX;
      const origHeadTiltY = headTiltY;
      const origHeadTiltZ = headTiltZ;
      const origMouthScaleX = mouthScaleX;
      const origMouthScaleY = mouthScaleY;
      const origBrowRotZ = browRotZ;
      const origEarDroop = earDroop;
      
      // 1. Notices touch immediately & turns head toward user
      let tapHeadTiltY = 0; // Turn head to face the camera
      let tapHeadTiltX = -0.1; // Look slightly up to meet eyes
      let tapHeadTiltZ = 0.05; // Soft affectionate tilt
      
      // 2. Soft eye contact & eyes brighten slightly
      leftEyeLookX = 0; rightEyeLookX = 0;
      leftEyeLookY = 0; rightEyeLookY = 0;
      
      // Tiny blink before warm smile
      if (timeSinceTap > 0.05 && timeSinceTap < 0.15) {
        overrideBlink = 0.1; // Quick blink
      } else {
        overrideBlink = 0.8; // Cheek compression / bright gentle squint
      }
      
      // 3. Small warm smile appears
      let tapMouthScaleX = 1.4; let tapMouthScaleY = 0.3; // Soft curve
      let tapBrowRotZ = 0.08; browPosY = 0.02; rightBrowPosY = 0.02;
      let tapEarDroop = 0.05; // Ears perk up affectionately
      
      // 4. Playful Dance Sequence
      let jumpOffset = 0;
      let danceRotY = 0;
      let danceRotZ = 0;
      
      if (timeSinceTap < 0.3) {
        // Anticipation energy: soft gather and gentle lift
        const prepP = timeSinceTap / 0.3;
        if (prepP < 0.5) {
            jumpOffset = -0.02 * (prepP * 2);
            bodySquishY = 0.95; bodySquishXZ = 1.02;
            flRotX = -0.2; frRotX = -0.2; blRotX = 0.2; brRotX = 0.2;
            legSquashY = 0.9;
        } else {
            jumpOffset = 0.02;
            bodySquishY = 1.02; bodySquishXZ = 0.98;
            flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
            legSquashY = 1.0;
        }
      } else {
        // Modular Dance Sequencer
        const danceTime = timeSinceTap - 0.3;
        const MOVE_DURATION = 1.5;
        const seq = tapDanceSequenceRef.current;
        
        // Find which move we are currently playing, capped to the end of the sequence
        const moveIndex = Math.min(Math.floor(danceTime / MOVE_DURATION), Math.max(0, seq.length - 1));
        const currentMove = seq[moveIndex];
        const localDanceTime = danceTime - (moveIndex * MOVE_DURATION);
        
        switch (currentMove) {
          case 0: { // 1. Soft bounces
            const hopSpeed = 2.0;
            jumpOffset = Math.abs(Math.sin(localDanceTime * Math.PI * hopSpeed)) * 0.06;
            bodySquishY = 1.0 + jumpOffset * 0.4; bodySquishXZ = 1.0 - jumpOffset * 0.2;
            
            const kickCycle = localDanceTime * 10;
            flRotX = Math.sin(kickCycle) * 0.15; frRotX = Math.sin(kickCycle + Math.PI) * 0.15;
            blRotX = Math.sin(kickCycle + Math.PI) * 0.15; brRotX = Math.sin(kickCycle) * 0.15;
            
            tapEarDroop = -0.02 + Math.cos(localDanceTime * Math.PI * hopSpeed * 2) * 0.1;
            break;
          }
          case 1: { // 2. Gentle twirl
            const spinP = Math.min(localDanceTime / MOVE_DURATION, 1.0);
            // Smooth 1 full slow spin
            const spinEase = spinP < 0.5 ? 2 * spinP * spinP : 1 - Math.pow(-2 * spinP + 2, 2) / 2;
            danceRotY = spinEase * Math.PI * 2; 
            jumpOffset = Math.sin(spinP * Math.PI) * 0.04;
            bodySquishY = 1.0 + jumpOffset;
            flRotX = -0.1; frRotX = -0.1; blRotX = 0.1; brRotX = 0.1;
            tapEarDroop = 0.1;
            tapMouthScaleX = 1.2; tapMouthScaleY = 0.4;
            break;
          }
          case 2: { // 3. Peaceful sway
            const swaySpeed = 1.2;
            danceRotZ = Math.sin(localDanceTime * Math.PI * swaySpeed * 2) * 0.08;
            jumpOffset = Math.abs(Math.cos(localDanceTime * Math.PI * swaySpeed * 2)) * 0.03;
            bodySquishY = 1.0 + jumpOffset;
            flRotZ = danceRotZ; frRotZ = danceRotZ; blRotZ = danceRotZ; brRotZ = danceRotZ;
            
            tapEarDroop = 0.05 + Math.abs(danceRotZ);
            tapMouthScaleX = 1.2; tapMouthScaleY = 0.3;
            overrideBlink = 0.8;
            break;
          }
          case 3: { // 4. Happy nods
            const nodSpeed = 3.0;
            jumpOffset = Math.sin(localDanceTime * Math.PI * nodSpeed) * 0.02;
            bodySquishY = 1.0 + jumpOffset;
            tapHeadTiltX = -0.05 + Math.sin(localDanceTime * Math.PI * nodSpeed * 2) * 0.1;
            flRotX = -0.2; frRotX = -0.2; blRotX = 0.2; brRotX = 0.2;
            
            tapEarDroop = 0.1 + Math.sin(localDanceTime * Math.PI * nodSpeed * 2) * 0.05;
            if (Math.sin(localDanceTime * 6) > 0.8) overrideBlink = 1.0;
            tapMouthScaleX = 1.2; tapMouthScaleY = 0.4;
            break;
          }
          case 4: { // 5. Soft stretch
            if (localDanceTime < 0.6) {
                const riseP = localDanceTime / 0.6;
                const easeOut = Math.sin((riseP * Math.PI) / 2);
                jumpOffset = easeOut * 0.06;
                bodySquishY = 1.0 + easeOut * 0.1;
                flRotX = easeOut * 0.3; frRotX = easeOut * 0.3; blRotX = -easeOut * 0.1; brRotX = -easeOut * 0.1;
                tapHeadTiltX = -0.1 * easeOut;
                tapMouthScaleX = 1.4; tapMouthScaleY = 0.5;
            } else {
                const landP = (localDanceTime - 0.6) / (MOVE_DURATION - 0.6);
                jumpOffset = Math.cos(landP * Math.PI) * 0.06 * Math.exp(-landP * 3);
                flRotX = -0.2; frRotX = -0.2; blRotX = 0.2; brRotX = 0.2;
                tapEarDroop = 0.1; tapMouthScaleX = 1.0; tapMouthScaleY = 0.3;
            }
            break;
          }
        }
      }
      const tapTargetY = baseY + jumpOffset;
      
      // 5. Brief excited tail movement
      if (timeSinceTap > 0.1 && timeSinceTap < 3.5) {
         tailWag = Math.sin(timeSinceTap * 15) * 0.15; // Slower and gentler tail wag
      }
      
      // Blend between tap reaction and base emotion using fadeOut
      targetY = THREE.MathUtils.lerp(origTargetY, tapTargetY, fadeOut);
      targetGroupRotY = THREE.MathUtils.lerp(w.rotY, 0 + danceRotY, fadeOut);
      targetGroupRotZ = THREE.MathUtils.lerp(slopeZ, slopeZ + danceRotZ, fadeOut);
      headTiltY = THREE.MathUtils.lerp(origHeadTiltY, tapHeadTiltY, fadeOut);
      headTiltX = THREE.MathUtils.lerp(origHeadTiltX, tapHeadTiltX, fadeOut);
      headTiltZ = THREE.MathUtils.lerp(origHeadTiltZ, tapHeadTiltZ, fadeOut);
      mouthScaleX = THREE.MathUtils.lerp(origMouthScaleX, tapMouthScaleX, fadeOut);
      mouthScaleY = THREE.MathUtils.lerp(origMouthScaleY, tapMouthScaleY, fadeOut);
      browRotZ = THREE.MathUtils.lerp(origBrowRotZ, tapBrowRotZ, fadeOut);
      earDroop = THREE.MathUtils.lerp(origEarDroop, tapEarDroop, fadeOut);
      
      if (fadeOut < 0.01) {
         overrideBlink = null; // Yield back control
      }
    }

    // --- APPLY MATH (Lerping for softness) ---
    // Position & Rotation
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.2); // Faster lerp for tighter terrain tracking
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetGroupRotY, 0.1);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetGroupRotZ, 0.15);

    // Breathing (Scale)
    const breath = 1 + Math.sin(time * breathSpeed) * breathIntensity;
    bodyRef.current.scale.set(breath * bodySquishXZ, breath * bodySquishY, breath * bodySquishXZ);

    // Head Rotation
    const idleSway = Math.sin(time * 0.8) * 0.03;
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headTiltX + idleSway, 0.1);
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headTiltY + Math.sin(time * 0.4) * 0.04, 0.1);
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, headTiltZ, 0.1);

    // Ears
    if (leftEarRef.current && rightEarRef.current) {
      const earFlop = Math.sin(time * breathSpeed) * 0.05;
      leftEarRef.current.rotation.z = THREE.MathUtils.lerp(leftEarRef.current.rotation.z, earDroop + leftEarDroopOffset + earFlop, 0.1);
      rightEarRef.current.rotation.z = THREE.MathUtils.lerp(rightEarRef.current.rotation.z, -earDroop - rightEarDroopOffset - earFlop, 0.1);
    }
    
    // Tail
    if (tailRef.current) {
      tailRef.current.rotation.y = THREE.MathUtils.lerp(tailRef.current.rotation.y, tailWag, 0.1);
    }

    // Eyes (Blinking & Squinting)
    if (leftEyeRef.current && rightEyeRef.current) {
      let blink = (Math.sin(time * 2.5) * Math.sin(time * 1.2)) > 0.95 ? 0.1 : 1;
      
      // Apply override blink if set by an expression state
      if (overrideBlink !== null) {
        blink = overrideBlink;
      }
      
      if (isTapReacting && timeSinceTap < 0.15) {
        blink = 1.0; // Wide surprised eyes (squish handles the widening now)
      } else if (emotion === 'sleepy') {
        blink = 0.2; // Heavy eyelids
      } else if (emotion === 'happy' || emotion === 'playful') {
        blink = 0.4; // Joyful squint
      }

      // Squish and Stretch Logic: When eyes blink (scale Y goes down), scale X/Z goes up to preserve volume
      const squishOut = 1 + ((1 - blink) * 0.15);
      
      leftEyeRef.current.scale.set(THREE.MathUtils.lerp(leftEyeRef.current.scale.x, squishOut, 0.3), THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blink, 0.3), THREE.MathUtils.lerp(leftEyeRef.current.scale.z, squishOut, 0.3));
      rightEyeRef.current.scale.set(THREE.MathUtils.lerp(rightEyeRef.current.scale.x, squishOut, 0.3), THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blink, 0.3), THREE.MathUtils.lerp(rightEyeRef.current.scale.z, squishOut, 0.3));
      
      // Eye Tracking Positions
      leftEyeRef.current.position.x = THREE.MathUtils.lerp(leftEyeRef.current.position.x, -0.14 + leftEyeLookX, 0.3);
      leftEyeRef.current.position.y = THREE.MathUtils.lerp(leftEyeRef.current.position.y, 0.02 + leftEyeLookY, 0.3);
      
      rightEyeRef.current.position.x = THREE.MathUtils.lerp(rightEyeRef.current.position.x, 0.14 + rightEyeLookX, 0.3);
      rightEyeRef.current.position.y = THREE.MathUtils.lerp(rightEyeRef.current.position.y, 0.02 + rightEyeLookY, 0.3);
    }
    
    // Eyebrows & Mouth
    if (leftEyebrowRef.current && rightEyebrowRef.current && mouthRef.current) {
      leftEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(leftEyebrowRef.current.rotation.z, (Math.PI / 2) - browRotZ, 0.2);
      rightEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(rightEyebrowRef.current.rotation.z, (Math.PI / 2) + browRotZ, 0.2);
      
      leftEyebrowRef.current.position.y = THREE.MathUtils.lerp(leftEyebrowRef.current.position.y, 0.12 + browPosY, 0.2);
      rightEyebrowRef.current.position.y = THREE.MathUtils.lerp(rightEyebrowRef.current.position.y, 0.12 + rightBrowPosY, 0.2);
      
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, mouthScaleX, 0.2);
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, mouthScaleY, 0.2);
      mouthRef.current.scale.z = THREE.MathUtils.lerp(mouthRef.current.scale.z, 1.0, 0.2); // Restored Z for full plush 3D deformation!
    }
    
    // Legs
    if (flLegRef.current && frLegRef.current && blLegRef.current && brLegRef.current) {
      flLegRef.current.rotation.x = THREE.MathUtils.lerp(flLegRef.current.rotation.x, flRotX, 0.2);
      flLegRef.current.rotation.z = THREE.MathUtils.lerp(flLegRef.current.rotation.z, flRotZ, 0.2);
      
      frLegRef.current.rotation.x = THREE.MathUtils.lerp(frLegRef.current.rotation.x, frRotX, 0.2);
      frLegRef.current.rotation.z = THREE.MathUtils.lerp(frLegRef.current.rotation.z, frRotZ, 0.2);
      
      blLegRef.current.rotation.x = THREE.MathUtils.lerp(blLegRef.current.rotation.x, blRotX, 0.2);
      blLegRef.current.rotation.z = THREE.MathUtils.lerp(blLegRef.current.rotation.z, blRotZ, 0.2);
      
      brLegRef.current.rotation.x = THREE.MathUtils.lerp(brLegRef.current.rotation.x, brRotX, 0.2);
      brLegRef.current.rotation.z = THREE.MathUtils.lerp(brLegRef.current.rotation.z, brRotZ, 0.2);
      
      // Apply dynamic hoof compression to the legs
      flLegRef.current.scale.y = THREE.MathUtils.lerp(flLegRef.current.scale.y, legSquashY, 0.3);
      frLegRef.current.scale.y = THREE.MathUtils.lerp(frLegRef.current.scale.y, legSquashY, 0.3);
      blLegRef.current.scale.y = THREE.MathUtils.lerp(blLegRef.current.scale.y, legSquashY, 0.3);
      brLegRef.current.scale.y = THREE.MathUtils.lerp(brLegRef.current.scale.y, legSquashY, 0.3);
    }
    
    // Ground Shadow
    if (shadowRef.current) {
      const heightAboveGround = Math.max(0, groupRef.current.position.y - baseY);
      shadowRef.current.position.y = -heightAboveGround - 0.02; // Bring shadow up right underneath the hooves
      const shadowScale = Math.max(0.1, 1.0 - heightAboveGround * 2.5); // Shrink as Nimo jumps
      shadowRef.current.scale.set(shadowScale, 1, shadowScale);
    }
  });

  // --- COLORS ---
  const cWool = "#FFFAF4";   // Very bright, warm cream
  const cSkin = "#FAD6C6";   // Soft shy peach
  const cEyes = "#4A3B32";   // Soft dark brown (avoids harsh blacks)
  const cBlush = "#FFAAA6";  // Gentle pink
  const cMagic = "#FFDF6B";  // Glowing warm starlight
  const cHoof = "#8A7365";   // Warm soft brown for hooves

  return (
    <group ref={groupRef} {...props} scale={0.5} position={[0, -1.5, 0]}>
      {/* Ground Shadow */}
      <mesh ref={shadowRef} position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial color="#000000" opacity={0.15} transparent depthWrite={false} />
      </mesh>

      {/* --- BODY --- */}
      {/* Attached unified tap interaction handler */}
      <group ref={bodyRef} position={[0, 0.35, 0]} onPointerDown={handleTap}>
        {/* Clean, fluffy quadruped body (no side arms/puffs) */}
        <mesh position={[0, 0, 0.12]}><sphereGeometry args={[0.32, 32, 32]} /><meshStandardMaterial color={cWool} roughness={0.9} /></mesh>
        <mesh position={[0, 0.02, -0.05]}><sphereGeometry args={[0.34, 32, 32]} /><meshStandardMaterial color={cWool} roughness={0.9} /></mesh>
        <mesh position={[0, 0, -0.2]}><sphereGeometry args={[0.32, 32, 32]} /><meshStandardMaterial color={cWool} roughness={0.9} /></mesh>

        {/* Dynamic Articulated Legs */}
        <group ref={flLegRef} position={[-0.15, -0.15, 0.15]}>
          <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[0.045, 0.1, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
          <mesh position={[0, -0.16, 0.02]} scale={[1, 0.8, 1.2]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cHoof} roughness={0.8} /></mesh>
        </group>
        <group ref={frLegRef} position={[0.15, -0.15, 0.15]}>
          <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[0.045, 0.1, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
          <mesh position={[0, -0.16, 0.02]} scale={[1, 0.8, 1.2]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cHoof} roughness={0.8} /></mesh>
        </group>
        <group ref={blLegRef} position={[-0.15, -0.15, -0.15]}>
          <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[0.045, 0.1, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
          <mesh position={[0, -0.16, 0.02]} scale={[1, 0.8, 1.2]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cHoof} roughness={0.8} /></mesh>
        </group>
        <group ref={brLegRef} position={[0.15, -0.15, -0.15]}>
          <mesh position={[0, -0.1, 0]}><capsuleGeometry args={[0.045, 0.1, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
          <mesh position={[0, -0.16, 0.02]} scale={[1, 0.8, 1.2]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cHoof} roughness={0.8} /></mesh>
        </group>
        
        {/* Tiny Nub Tail */}
        <mesh ref={tailRef} position={[0, -0.05, -0.36]} rotation={[Math.PI / 4, 0, 0]}>
           <capsuleGeometry args={[0.06, 0.08, 16, 16]} /><meshStandardMaterial color={cWool} roughness={0.9} />
        </mesh>
      </group>

      {/* --- HEAD & NECK --- */}
      {/* Attached unified tap interaction handler */}
      <group ref={headRef} position={[0, 0.65, 0.1]} onPointerDown={handleTap}>
        {/* Face Plate (Pushed slightly forward) */}
        <mesh position={[0, -0.02, 0.18]}><sphereGeometry args={[0.32, 32, 32]} /><meshStandardMaterial color={cSkin} roughness={0.6} /></mesh>
        
        {/* Head Wool Puff (Covers the back and top like a little cloud hat) */}
        <mesh position={[0, 0.05, -0.02]}><sphereGeometry args={[0.38, 32, 32]} /><meshStandardMaterial color={cWool} roughness={0.9} /></mesh>
        <mesh position={[0, 0.22, 0.1]}><sphereGeometry args={[0.18, 24, 24]} /><meshStandardMaterial color={cWool} roughness={0.9} /></mesh>

        {/* Small Cute Floppy Ears (At eye level) */}
        <group position={[-0.30, 0.02, 0.15]} ref={leftEarRef}>
          <mesh position={[-0.06, -0.04, 0]} rotation={[0, 0, Math.PI / 4]}><capsuleGeometry args={[0.04, 0.12, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
        </group>
        <group position={[0.30, 0.02, 0.15]} ref={rightEarRef}>
          <mesh position={[0.06, -0.04, 0]} rotation={[0, 0, -Math.PI / 4]}><capsuleGeometry args={[0.04, 0.12, 16, 16]} /><meshStandardMaterial color={cSkin} roughness={0.7} /></mesh>
        </group>

        {/* Magical Glowing Star Horns */}
        <mesh position={[-0.15, 0.32, 0.05]} rotation={[0, 0, -0.2]}><coneGeometry args={[0.035, 0.12, 16]} /><meshStandardMaterial color={cMagic} emissive={cMagic} emissiveIntensity={0.6} roughness={0.2} /></mesh>
        <mesh position={[0.15, 0.32, 0.05]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.035, 0.12, 16]} /><meshStandardMaterial color={cMagic} emissive={cMagic} emissiveIntensity={0.6} roughness={0.2} /></mesh>

        {/* Wide-set Innocent Eyes */}
        <group ref={leftEyeRef} position={[-0.14, 0.02, 0.48]}>
          <mesh>
            <sphereGeometry args={[0.03, 16, 16]} />
            {/* Glossy Physical Material for wet, deep reflections */}
            <meshPhysicalMaterial color={cEyes} roughness={0.15} metalness={0.1} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          {/* Catchlight 1 (Main gleam) */}
          <mesh position={[0.012, 0.012, 0.024]}><sphereGeometry args={[0.008, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
          {/* Catchlight 2 (Secondary soft reflection) */}
          <mesh position={[-0.01, -0.01, 0.026]}><sphereGeometry args={[0.004, 8, 8]} /><meshBasicMaterial color="#ffffff" opacity={0.5} transparent /></mesh>
        </group>
        
        <group ref={rightEyeRef} position={[0.14, 0.02, 0.48]}>
          <mesh>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshPhysicalMaterial color={cEyes} roughness={0.15} metalness={0.1} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          {/* Note: Catchlights aren't mirrored so the global light direction looks consistent! */}
          <mesh position={[0.012, 0.012, 0.024]}><sphereGeometry args={[0.008, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh position={[-0.01, -0.01, 0.026]}><sphereGeometry args={[0.004, 8, 8]} /><meshBasicMaterial color="#ffffff" opacity={0.5} transparent /></mesh>
        </group>
        
        {/* Expressive Eyebrows (Flattened into 2D decals) */}
        <mesh ref={leftEyebrowRef} position={[-0.14, 0.12, 0.45]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 8, 8]} /><meshStandardMaterial color={cEyes} roughness={1.0} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.14, 0.12, 0.45]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 8, 8]} /><meshStandardMaterial color={cEyes} roughness={1.0} />
        </mesh>

        {/* Shy Blush */}
        <mesh position={[-0.2, -0.08, 0.43]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cBlush} roughness={0.5} opacity={0.5} transparent /></mesh>
        <mesh position={[0.2, -0.08, 0.43]}><sphereGeometry args={[0.045, 16, 16]} /><meshStandardMaterial color={cBlush} roughness={0.5} opacity={0.5} transparent /></mesh>

        {/* Tiny Nose */}
        <mesh position={[0, -0.05, 0.50]}><sphereGeometry args={[0.015, 16, 16]} /><meshStandardMaterial color={cEyes} roughness={0.6} /></mesh>
        
        {/* Expressive Plush Mouth System */}
        <group ref={mouthRef} position={[0, -0.09, 0.49]}>
          {/* Dark Mouth Interior */}
          <mesh ref={mouthInteriorRef} position={[0, -0.002, 0.0]}>
            <capsuleGeometry args={[0.012, 0.018, 16, 16]} />
            <meshStandardMaterial color={cEyes} roughness={0.8} />
          </mesh>
          
          {/* Tiny Tongue */}
          <mesh ref={tongueRef} position={[0, -0.012, 0.005]}>
            <sphereGeometry args={[0.009, 16, 16]} />
            <meshStandardMaterial color={cBlush} roughness={0.6} />
          </mesh>

          {/* Left Upper Muzzle/Lip */}
          <mesh ref={leftUpperLipRef} position={[-0.014, 0.01, 0.01]} rotation={[0, 0, -0.25]}>
            <sphereGeometry args={[0.016, 24, 24]} />
            <meshStandardMaterial color={cSkin} roughness={0.6} />
          </mesh>
          
          {/* Right Upper Muzzle/Lip */}
          <mesh ref={rightUpperLipRef} position={[0.014, 0.01, 0.01]} rotation={[0, 0, 0.25]}>
            <sphereGeometry args={[0.016, 24, 24]} />
            <meshStandardMaterial color={cSkin} roughness={0.6} />
          </mesh>

          {/* Lower Lip */}
          <mesh ref={lowerLipRef} position={[0, -0.015, 0.008]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.007, 0.014, 16, 16]} />
            <meshStandardMaterial color={cSkin} roughness={0.6} />
          </mesh>
          
          {/* Mouth Corners (for expressive smiling) */}
          <mesh ref={leftCornerRef} position={[-0.024, -0.002, 0.008]}>
            <sphereGeometry args={[0.009, 16, 16]} />
            <meshStandardMaterial color={cSkin} roughness={0.6} />
          </mesh>
          <mesh ref={rightCornerRef} position={[0.024, -0.002, 0.008]}>
            <sphereGeometry args={[0.009, 16, 16]} />
            <meshStandardMaterial color={cSkin} roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

interface NimoCanvasProps {
  emotion?: NimoEmotion;
  theme?: string;
  onBackgroundTap?: () => void;
}

function ThemeLighting({ theme }: { theme: string }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);

  const targetAmbient = useRef(new THREE.Color("#ffffff"));
  const targetDir = useRef(new THREE.Color("#fff1e6"));
  const targetPoint = useRef(new THREE.Color("#e0fbfc"));
  const targetIntensity = useRef({ ambient: 1.4, dir: 1.0 });

  useEffect(() => {
    switch (theme) {
      case 'Lavender Calm':
        targetAmbient.current.set("#E6E6FA");
        targetIntensity.current.ambient = 1.5;
        targetDir.current.set("#FFF0F5");
        targetIntensity.current.dir = 0.9;
        targetPoint.current.set("#D8BFD8");
        break;
      case 'Midnight Focus':
        targetAmbient.current.set("#B5D8EB");
        targetIntensity.current.ambient = 0.7;
        targetDir.current.set("#4A90E2");
        targetIntensity.current.dir = 0.4;
        targetPoint.current.set("#e0fbfc");
        break;
      case 'Rainy Evening':
        targetAmbient.current.set("#8BA3C7");
        targetIntensity.current.ambient = 0.6;
        targetDir.current.set("#708090");
        targetIntensity.current.dir = 0.3;
        targetPoint.current.set("#A0B0C0");
        break;
      case 'Warm Sunset':
        targetAmbient.current.set("#FFDF6B");
        targetIntensity.current.ambient = 1.4;
        targetDir.current.set("#FFAAA6");
        targetIntensity.current.dir = 1.1;
        targetPoint.current.set("#FF8C00");
        break;
      default:
        targetAmbient.current.set("#ffffff");
        targetIntensity.current.ambient = 1.4;
        targetDir.current.set("#fff1e6");
        targetIntensity.current.dir = 1.0;
        targetPoint.current.set("#e0fbfc");
        break;
    }
  }, [theme]);

  // Smoothly interpolate the 3D lighting to the new target mood
  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetAmbient.current, safeDelta * 2);
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetIntensity.current.ambient, safeDelta * 2);
    }
    if (dirRef.current) {
      dirRef.current.color.lerp(targetDir.current, safeDelta * 2);
      dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, targetIntensity.current.dir, safeDelta * 2);
    }
    if (pointRef.current) {
      pointRef.current.color.lerp(targetPoint.current, safeDelta * 2);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.4} color="#ffffff" />
      <directionalLight ref={dirRef} position={[3, 8, 5]} intensity={1.0} color="#fff1e6" castShadow />
      <pointLight ref={pointRef} position={[-4, 4, -4]} intensity={0.6} color="#e0fbfc" />
    </>
  );
}

export default function NimoCanvas({ emotion = 'idle', theme = 'Midnight Focus', onBackgroundTap }: NimoCanvasProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Canvas 
        camera={{ position: [0, 0.2, 5], fov: 45 }} 
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onPointerMissed={onBackgroundTap}
      >
        <ThemeLighting theme={theme} />
        <Suspense fallback={null}>
          <NimoModel emotion={emotion} />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', backgroundColor: 'transparent' },
});