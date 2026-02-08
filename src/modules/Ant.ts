
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { FlowField } from './FlowField';
import { TerrainFlowField } from './TerrainFlowField';
import { Segment2D } from './Segment2D';
import { AntType, SimulationSettings } from '../types';

export type AntUpdateResult = 'alive' | 'death_lifetime' | 'death_oob' | 'death_stale' | 'death_water' | 'target_reached' | 'trail_left';

export interface AntOptions {
  speed?: number;
  life?: number;
  id?: string;
  trailDistance?: number;
  turnSpeed?: number;
  randomInitialDir?: boolean;
  initialDirection?: Vector2D;
  isPrimary?: boolean;
  originHubId?: string;
  wanderIntensity?: number;
  isDirect?: boolean;
  type?: AntType;
  ringCenter?: Vector2D;
  ringRadius?: number;
  ringClockwise?: boolean;
  settings?: SimulationSettings;
}

export class Ant {
  public id: string;
  public position: Vector2D;
  public lastTrailPos: Vector2D;
  public direction: Vector2D;
  public speed: number;
  public life: number;
  public maxLife: number;
  public staleSteps: number = 0;
  public accumulatedDistance: number = 0;
  public distanceSinceLastFork: number = 0;
  public isAlive: boolean = true;
  public color: string = '#fbbf24'; 
  public trailDistance: number = 20;
  public turnSpeed: number = 0.1;
  public baseTurnSpeed: number = 0.1;
  public parentShape?: Shape2D;
  public isPrimary: boolean = false;
  public history: Vector2D[] = [];
  public originHubId?: string;
  public isDirect: boolean = true;
  public type: AntType = 'hub';
  public settings?: SimulationSettings;
  
  public ringCenter?: Vector2D;
  public ringRadius?: number;
  public ringClockwise: boolean = true;
  
  private wanderAngle: number = 0;
  public wanderIntensity: number = 0.05;

  constructor(
    startPos: Vector2D,
    public targetPos: Vector2D,
    options: AntOptions = {}
  ) {
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.position = startPos.copy();
    this.lastTrailPos = startPos.copy();
    this.speed = options.speed || 2;
    this.maxLife = options.life || 500;
    this.life = this.maxLife;
    this.trailDistance = options.trailDistance || 20;
    this.baseTurnSpeed = options.turnSpeed ?? 0.05;
    this.turnSpeed = this.baseTurnSpeed;
    this.isPrimary = options.isPrimary ?? false;
    this.originHubId = options.originHubId;
    this.wanderIntensity = options.wanderIntensity ?? 0.05;
    this.isDirect = options.isDirect ?? true;
    this.type = options.type || 'hub';
    this.settings = options.settings;
    
    this.ringCenter = options.ringCenter;
    this.ringRadius = options.ringRadius;
    this.ringClockwise = options.ringClockwise !== undefined ? options.ringClockwise : (Math.random() > 0.5);
    
    if (this.type === 'hub') this.color = '#22d3ee'; 
    else if (this.type === 'termination') this.color = '#fbbf24'; 
    else if (this.type === 'perpendicular') this.color = '#f0abfc'; 
    else if (this.type === 'ring') this.color = '#818cf8'; 
    else if (this.type === 'outward') this.color = '#fb7185'; 
    else if (this.type === 'sprawl') this.color = '#10b981';
    else if (this.type === 'carrier') this.color = '#6366f1'; 
    else if (this.type === 'fork') this.color = '#ff00ff'; 
    else if (this.type === 'bridge') this.color = '#ffffff'; 
    
    this.wanderAngle = (Math.random() - 0.5) * Math.PI;

    if (this.isPrimary) {
      this.history.push(this.position.copy());
    }

    if (options.initialDirection) {
      this.direction = options.initialDirection.normalize();
    } else if (options.randomInitialDir) {
      const angle = (Math.random() * Math.PI * 2);
      this.direction = new Vector2D(Math.cos(angle), Math.sin(angle));
    } else if (this.type === 'ring' && this.ringCenter) {
      const toCenter = this.position.sub(this.ringCenter);
      const normal = toCenter.normalize();
      this.direction = this.ringClockwise 
        ? new Vector2D(-normal.y, normal.x) 
        : new Vector2D(normal.y, -normal.x);
    } else {
      this.direction = targetPos.sub(this.position).normalize();
    }
  }

  private steer(flowField?: FlowField, flowInfluence: number = 0, nearbyAnts: Ant[] = []) {
    // Bridges move in a straight line with extreme inertia, ignoring environmental forces
    if (this.type === 'bridge') {
      const toTarget = this.targetPos.sub(this.position).normalize();
      this.direction = this.direction.mul(0.995).add(toTarget.mul(0.005)).normalize();
      return;
    }

    let environmentalPriority = 0;
    let fieldForce = new Vector2D(0, 0);

    if (flowField) {
      fieldForce = flowField.getVectorAt(this.position.x, this.position.y);
      if (flowField instanceof TerrainFlowField) {
        const h = flowField.elevation.getHeight(this.position.x, this.position.y);
        const distToWater = h - flowField.waterLevel;
        if (distToWater < 0.08) {
          environmentalPriority = Math.max(0, 1 - distToWater / 0.08);
        }
      }
    }

    let attractionForce = new Vector2D(0, 0);
    let attractionWeight = 0;

    if (nearbyAnts.length > 0 && !this.parentShape) {
      const attractRadius = this.settings?.antAttractionRadius || 50;
      const attractStrength = this.settings?.antAttractionStrength || 0.2;
      
      let bestAnt: Ant | null = null;
      let minDist = attractRadius;

      for (const other of nearbyAnts) {
        if (other.id === this.id) continue;
        const d = this.position.dist(other.position);
        if (d < minDist) {
          const alignment = this.direction.dot(other.direction);
          if (alignment < -0.4) {
            minDist = d;
            bestAnt = other;
          }
        }
      }

      if (bestAnt) {
        const toOther = bestAnt.position.sub(this.position).normalize();
        const normDist = minDist / attractRadius;
        const t = Math.pow(1.0 - normDist, 2);
        attractionForce = toOther;
        attractionWeight = attractStrength * t;
      }
    }

    let constraintForce = new Vector2D(0, 0);
    let constraintWeight = 0;

    if (this.type === 'ring' && this.ringCenter && this.ringRadius) {
      const toCenter = this.position.sub(this.ringCenter);
      const dist = toCenter.mag();
      if (dist > 0.1) {
        const normal = toCenter.normalize();
        const tangent = this.ringClockwise 
          ? new Vector2D(-normal.y, normal.x) 
          : new Vector2D(normal.y, -normal.x);
          
        const correctionScale = 0.3;
        const correction = normal.mul((this.ringRadius - dist) * correctionScale);
        constraintForce = tangent.add(correction).normalize();
        constraintWeight = 1.0; 
      }
    }

    const inertiaMultiplier = (this.type === 'carrier' || this.type === 'fork') ? 0.2 : 1.0;
    this.wanderAngle += (Math.random() - 0.5) * (this.type === 'ring' ? 0.02 : 0.05 * inertiaMultiplier); 
    const effectiveWander = this.wanderIntensity * (1 - environmentalPriority);
    const noiseVector = new Vector2D(Math.cos(this.wanderAngle), Math.sin(this.wanderAngle)).mul(effectiveWander);
    
    let desiredDirection = this.direction.add(noiseVector).normalize();

    if (attractionWeight > 0) {
      desiredDirection = desiredDirection.mul(1 - attractionWeight).add(attractionForce.mul(attractionWeight)).normalize();
    }

    if (constraintWeight > 0) {
      desiredDirection = desiredDirection.mul(1 - constraintWeight).add(constraintForce.mul(constraintWeight)).normalize();
    }

    const distToTarget = this.position.dist(this.targetPos);
    const seekSuppression = (constraintWeight > 0.2 || attractionWeight > 0.2 || distToTarget < 30) ? 0.05 : 1.0;
    const effectiveTurnSpeed = this.turnSpeed * (1 - environmentalPriority * 0.7) * seekSuppression;
    
    if (effectiveTurnSpeed > 0 && this.type !== 'outward' && this.type !== 'sprawl' && this.type !== 'fork') {
      const toTarget = this.targetPos.sub(this.position);
      if (toTarget.mag() > 0.1) {
        const seekDir = toTarget.normalize();
        desiredDirection = desiredDirection.mul(1 - effectiveTurnSpeed).add(seekDir.mul(effectiveTurnSpeed)).normalize();
      }
    }

    const explorerResist = (this.type === 'outward' || this.type === 'hub' || this.type === 'carrier' || this.type === 'fork') ? 0.05 : 1.0;
    if (fieldForce.mag() > 0 && (flowInfluence > 0 || environmentalPriority > 0) && !this.parentShape) {
      const effectiveInfluence = Math.max(flowInfluence * explorerResist, environmentalPriority * 2.0);
      desiredDirection = desiredDirection.add(fieldForce.mul(effectiveInfluence)).normalize();
    }

    const momentum = (this.type === 'carrier' || this.type === 'fork') ? 0.99 : 0.95; 
    this.direction = this.direction.mul(momentum).add(desiredDirection.mul(1 - momentum)).normalize();
  }

  update(flowField?: FlowField, flowInfluence: number = 0, simWidth?: number, simHeight?: number, nearbyAnts: Ant[] = []): AntUpdateResult {
    if (!this.isAlive) return 'alive';

    if (simWidth !== undefined && simHeight !== undefined) {
      if (this.position.x < 0 || this.position.x > simWidth || this.position.y < 0 || this.position.y > simHeight) {
        this.isAlive = false;
        return 'death_oob';
      }
    }

    if (flowField instanceof TerrainFlowField) {
      const h = flowField.elevation.getHeight(this.position.x, this.position.y);
      if (h < flowField.waterLevel) {
        // Bridge ants survive water
        if (this.type !== 'bridge') {
          this.isAlive = false;
          return 'death_water';
        }
      }
    }

    this.steer(flowField, flowInfluence, nearbyAnts);

    const moveStep = this.direction.mul(this.speed);
    this.position = this.position.add(moveStep);
    this.accumulatedDistance += this.speed;
    this.distanceSinceLastFork += this.speed;
    
    this.life--;
    this.staleSteps++;

    if (this.life <= 0) {
      this.isAlive = false;
      return 'death_lifetime';
    }

    if (this.staleSteps > 400) { 
      this.isAlive = false;
      return 'death_stale';
    }

    if (this.type !== 'ring' && this.type !== 'outward' && this.type !== 'sprawl' && this.type !== 'carrier' && this.type !== 'fork' && this.type !== 'bridge') {
      const distToTarget = this.position.dist(this.targetPos);
      if (distToTarget < 5) {
        this.isAlive = false;
        return 'target_reached';
      }
    } else if (this.type === 'bridge') {
      // Bridge ants only die if they reach the exact target world position or exceed life
      if (this.position.dist(this.targetPos) < 2) {
        this.isAlive = false;
        return 'target_reached';
      }
    }

    if (this.position.dist(this.lastTrailPos) >= this.trailDistance) {
      if (this.isPrimary) {
        this.history.push(this.position.copy());
      }
      return 'trail_left';
    }
    
    return 'alive';
  }

  commitTrail() {
    this.lastTrailPos = this.position.copy();
    this.staleSteps = 0; 
  }

  static checkCollision(antA: Ant, antB: Ant, distanceThreshold: number = 10, facingThreshold: number = -0.9): boolean {
    if (!antA.isAlive || !antB.isAlive) return false;
    
    const d = antA.position.dist(antB.position);
    if (d < distanceThreshold) {
      const dot = antA.direction.dot(antB.direction);
      if (dot < facingThreshold) {
        return true;
      }
    }
    return false;
  }

  kill(): void {
    this.isAlive = false;
  }
}
