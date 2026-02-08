import { Vector2D } from '../../modules/Vector2D';
import p5 from 'p5';

interface P5Touch {
    x: number;
    y: number;
}

interface P5WithTouchEvents extends p5 {
    touchStarted?: (e: TouchEvent) => boolean | void;
    touchMoved?: (e: TouchEvent) => boolean | void;
    touchEnded?: (e: TouchEvent) => boolean | void;
}

export interface CanvasTransform {
    offset: Vector2D;
    scale: number;
    isPanning: boolean;
    lastMouse: Vector2D;
    lastPinchDist: number;
    lastPinchScale: number;
    lastPinchMidpoint: Vector2D;
    lastPinchOffset: Vector2D;
}

export function createInitialTransform(): CanvasTransform {
    return {
        offset: new Vector2D(0, 0),
        scale: 0.2,
        isPanning: false,
        lastMouse: new Vector2D(0, 0),
        lastPinchDist: 0,
        lastPinchScale: 0.2,
        lastPinchMidpoint: new Vector2D(0, 0),
        lastPinchOffset: new Vector2D(0, 0)
    };
}

export function centerTransform(transform: CanvasTransform, canvasWidth: number, canvasHeight: number, simWidth: number, simHeight: number): void {
    const centerX = (canvasWidth - simWidth * transform.scale) / 2;
    const centerY = (canvasHeight - simHeight * transform.scale) / 2;
    transform.offset = new Vector2D(centerX, centerY);
}

export function attachCanvasControls(
    p: p5,
    transform: CanvasTransform,
    canvasElementRef: React.MutableRefObject<HTMLCanvasElement | null>
): void {
    const pTouch = p as P5WithTouchEvents;
    const getTouches = () => p.touches as unknown as P5Touch[];

    // Touch start - Begin panning or pinch zoom
    pTouch.touchStarted = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 1) {
            transform.isPanning = true;
            transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        } else if (t.length === 2) {
            transform.isPanning = false;
            const d = p.dist(t[0].x, t[0].y, t[1].x, t[1].y);
            transform.lastPinchDist = d;
            transform.lastPinchScale = transform.scale;
            transform.lastPinchMidpoint = new Vector2D((t[0].x + t[1].x) / 2, (t[0].y + t[1].y) / 2);
            transform.lastPinchOffset = transform.offset.copy();
        }
        return false;
    };

    // Touch move - Pan or pinch zoom
    pTouch.touchMoved = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 1 && transform.isPanning) {
            const dx = t[0].x - transform.lastMouse.x;
            const dy = t[0].y - transform.lastMouse.y;
            transform.offset = transform.offset.add(new Vector2D(dx, dy));
            transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        } else if (t.length === 2) {
            const d = p.dist(t[0].x, t[0].y, t[1].x, t[1].y);
            const ratio = d / transform.lastPinchDist;
            const newS = p.constrain(transform.lastPinchScale * ratio, 0.05, 20);

            const centerX = (t[0].x + t[1].x) / 2;
            const centerY = (t[0].y + t[1].y) / 2;
            const currentMidpoint = new Vector2D(centerX, centerY);

            const worldPointAtGestureStart = transform.lastPinchMidpoint.sub(transform.lastPinchOffset).div(transform.lastPinchScale);
            transform.offset = currentMidpoint.sub(worldPointAtGestureStart.mul(newS));
            transform.scale = newS;
        }
        return false;
    };

    // Touch end - Reset panning state
    pTouch.touchEnded = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 0) {
            transform.isPanning = false;
        } else if (t.length === 1) {
            transform.isPanning = true;
            transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        }
        return false;
    };

    // Mouse press - Begin panning
    p.mousePressed = (e: MouseEvent) => {
        if (e.target === canvasElementRef.current) {
            transform.isPanning = true;
            transform.lastMouse = new Vector2D(p.mouseX, p.mouseY);
            return false;
        }
    };

    // Mouse release - End panning
    p.mouseReleased = () => {
        transform.isPanning = false;
    };

    // Mouse drag - Pan the canvas
    p.mouseDragged = () => {
        if (transform.isPanning) {
            const dx = p.mouseX - transform.lastMouse.x;
            const dy = p.mouseY - transform.lastMouse.y;
            transform.offset = transform.offset.add(new Vector2D(dx, dy));
            transform.lastMouse = new Vector2D(p.mouseX, p.mouseY);
        }
    };

    // Mouse wheel - Zoom with focal point
    p.mouseWheel = (e: WheelEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const factor = Math.pow(0.9992, e.deltaY);
        const oldS = transform.scale;
        const newS = p.constrain(oldS * factor, 0.05, 20);
        const mx = p.mouseX, my = p.mouseY;
        transform.offset = new Vector2D(
            mx - (mx - transform.offset.x) * (newS / oldS),
            my - (my - transform.offset.y) * (newS / oldS)
        );
        transform.scale = newS;
        return false;
    };

    // Window resize - Adjust canvas size
    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
}
