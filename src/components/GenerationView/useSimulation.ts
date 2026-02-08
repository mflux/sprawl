
import { useState, useEffect, useCallback, useRef } from 'react';
import { state as genState, addEvent } from '../../state/store';
import { Ant } from '../../modules/Ant';
import { RoadNetwork } from '../../modules/RoadNetwork';
import { Segment2D } from '../../modules/Segment2D';
import { Vector2D } from '../../modules/Vector2D';
import { SpatialGrid } from '../../modules/SpatialGrid';
import { spawnAntWave } from '../../steps/urban_growth';
import { profile } from '../../utils/Profiler';
import { Capsule2D } from '../../modules/Capsule2D';

export const useSimulation = (onUpdate: () => void, onSimulationFinished?: (functionName: string, duration: number) => void) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const spatialGridRef = useRef<SpatialGrid<Vector2D> | null>(null);
  const antGridRef = useRef<SpatialGrid<Ant> | null>(null);
  const roadGridRef = useRef<SpatialGrid<Segment2D> | null>(null);
  const lastRoadCountRef = useRef<number>(-1);

  const syncRoadGrid = useCallback((force: boolean = false) => {
    if (!force && genState.roads.length === lastRoadCountRef.current && spatialGridRef.current) {
      return;
    }

    profile('Simulation.syncRoadGrid', () => {
      const snapThreshold = genState.settings.antSnapDistance;
      const vertexGrid = new SpatialGrid<Vector2D>(snapThreshold * 2);
      const segmentGrid = new SpatialGrid<Segment2D>(60);
      
      genState.roads.forEach(r => {
        vertexGrid.insert(r.p1, r.p1);
        vertexGrid.insert(r.p2, r.p2);
        segmentGrid.insert(r.midpoint(), r);
      });
      
      spatialGridRef.current = vertexGrid;
      roadGridRef.current = segmentGrid;
      lastRoadCountRef.current = genState.roads.length;
    });
  }, []);

  const syncAntGrid = useCallback(() => {
    const gridSize = Math.max(20, genState.settings.antAttractionRadius);
    const grid = new SpatialGrid<Ant>(gridSize);
    genState.ants.forEach(a => { if (a.isAlive) grid.insert(a.position, a); });
    antGridRef.current = grid;
  }, []);

  const findRoadIntersection = useCallback((p1: Vector2D, p2: Vector2D): { point: Vector2D, segment: Segment2D } | null => {
    const moveSeg = new Segment2D(p1, p2);
    let nearestHit: Vector2D | null = null;
    let nearestSeg: Segment2D | null = null;
    let minDist = Infinity;
    
    const searchRadius = moveSeg.length() + 40;
    const candidates = roadGridRef.current 
      ? roadGridRef.current.query(moveSeg.midpoint(), searchRadius, s => s.midpoint()) 
      : genState.roads;

    for (const road of candidates) {
      const hit = moveSeg.intersect(road);
      if (hit) {
        const d = p1.dist(hit);
        if (d > 0.1 && d < minDist) {
          minDist = d;
          nearestHit = hit;
          nearestSeg = road;
        }
      }
    }
    return nearestHit && nearestSeg ? { point: nearestHit, segment: nearestSeg } : null;
  }, []);

  const checkCapsuleCollision = useCallback((p1: Vector2D, p2: Vector2D, radius: number, excludePoint?: Vector2D): boolean => {
    const moveCap = new Capsule2D(p1, p2, radius);
    const searchRadius = p1.dist(p2) + radius + 40;
    
    const candidates = roadGridRef.current 
      ? roadGridRef.current.query(p1.add(p2).div(2), searchRadius, s => s.midpoint()) 
      : genState.roads;

    for (const road of candidates) {
      if (excludePoint && (road.p1.dist(excludePoint) < 1.5 || road.p2.dist(excludePoint) < 1.5)) {
        continue;
      }
      const roadCap = new Capsule2D(road.p1, road.p2, 0); 
      if (moveCap.intersects(roadCap)) {
        return true;
      }
    }
    return false;
  }, []);

  const findBoundaryIntersection = useCallback((p1: Vector2D, p2: Vector2D, ant: Ant): Vector2D | null => {
    if (!ant.parentShape) return null;
    const moveSeg = new Segment2D(p1, p2);
    const boundary = ant.parentShape.toSegments();
    let nearestHit: Vector2D | null = null;
    let minDist = Infinity;
    for (const seg of boundary) {
      const hit = moveSeg.intersect(seg);
      if (hit) {
        const d = p1.dist(hit);
        if (d > 0.5 && d < minDist) {
          minDist = d;
          nearestHit = hit;
        }
      }
    }
    return nearestHit;
  }, []);

  const checkCollisions = useCallback(() => {
    if (!antGridRef.current) return;

    const aliveAnts = genState.ants.filter(a => a.isAlive);
    const collisionDist = 14; 
    const facingThreshold = -0.6; 
    const arterialSnap = genState.settings.antSnapDistance;
    const processedPairs = new Set<string>();

    for (let i = 0; i < aliveAnts.length; i++) {
      const antA = aliveAnts[i];
      if (!antA.isAlive || antA.parentShape || antA.type === 'bridge') continue;
      if (antA.maxLife - antA.life < 10) continue;

      const neighbors = antGridRef.current.query(antA.position, collisionDist, a => a.position);
      
      for (const antB of neighbors) {
        if (antA === antB || !antB.isAlive || antB.parentShape || antB.type === 'bridge') continue;
        if (antB.maxLife - antB.life < 10) continue;

        const pairKey = antA.id < antB.id ? `${antA.id}:${antB.id}` : `${antB.id}:${antA.id}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        if (Ant.checkCollision(antA, antB, collisionDist, facingThreshold)) {
          const midPoint = antA.position.add(antB.position).div(2);
          RoadNetwork.addSegmentSnapped(antA.lastTrailPos, midPoint, genState.roads, arterialSnap * 1.5, spatialGridRef.current || undefined);
          RoadNetwork.addSegmentSnapped(antB.lastTrailPos, midPoint, genState.roads, arterialSnap * 1.5, spatialGridRef.current || undefined);
          antA.kill();
          antB.kill();
          break; 
        }
      }
    }
  }, []);

  const processAnt = useCallback((ant: Ant) => {
    if (!ant.isAlive) return;

    let snapThreshold = ant.parentShape 
      ? genState.settings.antSubdivideSnap 
      : genState.settings.antSnapDistance;

    if (ant.type === 'bridge') snapThreshold = 20;

    const oldPos = ant.position.copy();
    
    let nearbyAnts: Ant[] = [];
    if (antGridRef.current) {
      nearbyAnts = antGridRef.current.query(ant.position, genState.settings.antAttractionRadius, a => a.position);
    }

    const result = ant.update(
      genState.flowField, 
      genState.settings.flowFieldInfluence,
      genState.simWidth,
      genState.simHeight, 
      nearbyAnts
    );
    const newPos = ant.position;

    if (ant.type === 'bridge') {
      if (result === 'trail_left' || result === 'target_reached' || result === 'death_lifetime') {
        const seg = RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, genState.roads, snapThreshold, spatialGridRef.current || undefined);
        if (seg) seg.isBridge = true; 
        ant.commitTrail();
        
        if (result === 'target_reached') {
          addEvent('bridge_built', [], ant.position, undefined, { message: "Strategic connection established." });
          
          const spawnCount = 4;
          for (let i = 0; i < spawnCount; i++) {
            const angle = (i / spawnCount) * Math.PI * 2;
            const dir = new Vector2D(Math.cos(angle), Math.sin(angle));
            const targetHub = genState.hubs[Math.floor(Math.random() * genState.hubs.length)];
            
            genState.ants.push(new Ant(ant.position.copy(), targetHub.position, {
              type: 'sprawl',
              speed: 1.2,
              life: genState.settings.antMaxLife * 0.7,
              trailDistance: genState.settings.antTrailDistance,
              initialDirection: dir,
              wanderIntensity: 0.1,
              settings: genState.settings
            }));
          }
        }
      }
      return;
    }

    if (ant.type === 'fork' && (ant.maxLife - ant.life > 5)) {
      if (checkCapsuleCollision(oldPos, newPos, 4, ant.lastTrailPos)) {
        RoadNetwork.addSegmentSnapped(ant.lastTrailPos, oldPos, genState.roads, snapThreshold, spatialGridRef.current || undefined);
        ant.kill();
        return;
      }
    }

    if (result === 'death_oob' || result === 'death_stale' || result === 'death_water') {
      RoadNetwork.addSegmentSnapped(ant.lastTrailPos, oldPos, genState.roads, snapThreshold, spatialGridRef.current || undefined);
      return;
    }

    let hit: Vector2D | null = null;
    let hitSeg: Segment2D | null = null;

    if (ant.parentShape) {
      hit = findBoundaryIntersection(oldPos, newPos, ant);
    } else {
      const roadHit = findRoadIntersection(oldPos, newPos);
      if (roadHit) {
        hit = roadHit.point;
        hitSeg = roadHit.segment;
      }
    }
    
    if (hit) {
      ant.position = hit.copy();
      RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, genState.roads, snapThreshold * 1.5, spatialGridRef.current || undefined);
      
      const survives = !ant.parentShape && Math.random() < genState.settings.antRoadSurvivalChance;
      if (survives) {
        if (hitSeg) {
          const sDir = hitSeg.p2.sub(hitSeg.p1).normalize();
          let normal = new Vector2D(-sDir.y, sDir.x);
          if (normal.dot(ant.direction) < 0) normal = normal.mul(-1);
          ant.direction = normal;
        }
        ant.commitTrail();
        ant.position = ant.position.add(ant.direction.mul(5.0)); 
      } else {
        ant.kill();
      }
      return;
    }
    
    if (result === 'trail_left') {
      RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, genState.roads, snapThreshold, spatialGridRef.current || undefined);
      
      if (ant.type === 'carrier' && ant.accumulatedDistance > genState.settings.carrierMinDistance) {
        if (ant.distanceSinceLastFork >= genState.settings.carrierForkSpacing) {
          [1, -1].forEach(side => {
            const turnAngle = Math.PI / 2;
            const newDir = new Vector2D(
              ant.direction.x * Math.cos(turnAngle * side) - ant.direction.y * Math.sin(turnAngle * side),
              ant.direction.x * Math.sin(turnAngle * side) + ant.direction.y * Math.cos(turnAngle * side)
            );
            
            genState.ants.push(new Ant(ant.position.copy(), ant.position.add(newDir.mul(1000)), {
              type: 'fork',
              speed: ant.speed * 0.95,
              life: ant.life * 0.6,
              turnSpeed: 0, 
              initialDirection: newDir,
              trailDistance: ant.trailDistance,
              wanderIntensity: 0.001, 
              settings: genState.settings
            }));
          });
          ant.distanceSinceLastFork = 0;
        }
      }

      ant.commitTrail();
    } else if (result === 'target_reached' || result === 'death_lifetime') {
      RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, genState.roads, snapThreshold, spatialGridRef.current || undefined);
    }
  }, [findRoadIntersection, findBoundaryIntersection, checkCapsuleCollision]);

  const stepSimulation = useCallback(() => {
    profile('Simulation.stepBulk', () => {
      syncRoadGrid();
      syncAntGrid();
      const steps = 10 * Math.max(1, genState.settings.simSpeed);
      for (let i = 0; i < steps; i++) {
        let anyAlive = false;
        if (i % 5 === 0) syncAntGrid();
        
        for (let j = 0; j < genState.ants.length; j++) {
          const ant = genState.ants[j];
          if (ant.isAlive) {
            processAnt(ant);
            if (ant.isAlive) anyAlive = true;
          }
        }
        checkCollisions();
        if (!anyAlive && genState.ants.length > 0) break;
      }
    });
    onUpdate();
  }, [processAnt, checkCollisions, onUpdate, syncRoadGrid, syncAntGrid]);

  const resolveSimulation = useCallback(() => {
    setIsSimulating(false);
    spatialGridRef.current = null;
    antGridRef.current = null;
    roadGridRef.current = null;
    lastRoadCountRef.current = -1;
    
    profile('Simulation.resolveInstant', () => {
      let anyAlive = true;
      let safetyCounter = 0;
      while (anyAlive && safetyCounter < 5000) {
        syncRoadGrid();
        syncAntGrid();
        anyAlive = false;
        for (let j = 0; j < genState.ants.length; j++) {
          const ant = genState.ants[j];
          if (ant.isAlive) {
            processAnt(ant);
            if (ant.isAlive) anyAlive = true;
          }
        }
        checkCollisions();
        
        if (!anyAlive && genState.currentWave > 0 && genState.currentWave < genState.settings.antWaves) {
          genState.currentWave++;
          spawnAntWave();
          anyAlive = true;
        }
        safetyCounter++;
      }
    });

    const currentSnap = genState.ants.some(a => a.parentShape) ? genState.settings.antSubdivideSnap : genState.settings.cleanupSnap;
    profile('RoadNetwork.cleanupFinal', () => {
      genState.roads = RoadNetwork.cleanupNetwork(genState.roads, currentSnap);
    });
    onUpdate();
  }, [processAnt, checkCollisions, onUpdate, syncRoadGrid, syncAntGrid]);

  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        if (cooldown > 0) {
          setCooldown(c => c - 1);
          return;
        }
        
        syncRoadGrid();
        syncAntGrid();
        
        let anyAlive = false;
        const stepsPerFrame = Math.max(1, genState.settings.simSpeed);
        for (let i = 0; i < stepsPerFrame; i++) {
          if (stepsPerFrame > 5 && i % 2 === 0) syncAntGrid();

          for (let j = 0; j < genState.ants.length; j++) {
            const ant = genState.ants[j];
            if (ant.isAlive) {
              processAnt(ant);
              if (ant.isAlive) anyAlive = true;
            }
          }
          checkCollisions();
          if (!anyAlive) break;
        }

        if (!anyAlive && genState.ants.length > 0) {
          if (genState.currentWave > 0 && genState.currentWave < genState.settings.antWaves) {
            setCooldown(1); 
            genState.currentWave++;
            profile('WaveTransition.spawnNextWave', () => spawnAntWave());
          } else {
            setIsSimulating(false);
            spatialGridRef.current = null;
            antGridRef.current = null;
            roadGridRef.current = null;
            lastRoadCountRef.current = -1;
            
            const currentSnap = genState.ants.some(a => a.parentShape) ? genState.settings.antSubdivideSnap : genState.settings.cleanupSnap;
            profile('RoadNetwork.cleanupWaveEnd', () => {
              genState.roads = RoadNetwork.cleanupNetwork(genState.roads, currentSnap);
            });
          }
        }
        onUpdate();
      }, 16); 
    }
    return () => {
      clearInterval(interval);
      spatialGridRef.current = null;
      antGridRef.current = null;
      roadGridRef.current = null;
    };
  }, [isSimulating, cooldown, processAnt, checkCollisions, onUpdate, syncRoadGrid, syncAntGrid]);

  return { isSimulating, setIsSimulating, stepSimulation, resolveSimulation };
};
