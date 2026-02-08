import { GoogleGenAI, Type } from "@google/genai";
import { state, addEvent } from '../state/engine';
import { profile } from '../utils/Profiler';
import { Vector2D } from '../modules/Vector2D';
import { VisualizationSettings } from "../types";
import { LabelRelaxer, Label } from "../modules/LabelRelaxer";

export const stepInfo: { title: string, desc: string, vizTransitions: Partial<VisualizationSettings> } = {
  title: "AI Toponymy",
  desc: "Transmits geographic metadata with normalized coordinates to Gemini to generate grounded names. Allows the AI to apply cardinal prefixes (North, South, etc.) selectively based on spatial context.",
  vizTransitions: {
    renderElevation: true,
    renderShorelines: false
  }
};

/**
 * AI-Driven Toponymy: Calls Gemini to generate names and then relaxes their positions.
 */
export const runAINaming = async () => {
  const geo = state.geography;
  if (!geo.hubs.length && !geo.waterBodies.length && !geo.notableShapes.length && !geo.bridges.length) {
    console.warn('Geography is empty.');
    return;
  }

  // Prepare metadata with normalized coordinates for spatial reasoning
  const namingPayload = {
    hubs: geo.hubs.map(h => ({
      id: h.id,
      tier: h.tier,
      size: h.size,
      distToWater: h.distToWater,
      normalizedPos: { x: h.position.x / state.simWidth, y: h.position.y / state.simHeight }
    })),
    waterBodies: geo.waterBodies.map(w => ({
      id: w.id,
      area: w.area,
      normalizedPos: { x: w.center.x / state.simWidth, y: w.center.y / state.simHeight }
    })),
    bridges: geo.bridges.map(b => ({
      id: b.id,
      length: b.length,
      normalizedPos: { x: b.midpoint.x / state.simWidth, y: b.midpoint.y / state.simHeight }
    })),
    notableShapes: geo.notableShapes.map(s => ({
      id: s.id,
      area: s.area,
      distToNearestHub: s.distToNearestHub,
      normalizedPos: { x: s.center.x / state.simWidth, y: s.center.y / state.simHeight }
    }))
  };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a world-class urban toponymist. 
    A procedural city map has been generated. Use the provided metadata—including normalized X/Y coordinates (0.0 to 1.0)—to reason about the city's naming conventions.
    
    COORDINATE SYSTEM:
    - (0.0, 0.0) is North-West.
    - (1.0, 1.0) is South-East.
    - City center is roughly (0.5, 0.5).
    
    TASK:
    Generate unique, grounded, and realistic names for EVERY feature listed.
    
    CARDINAL PREFIX RULES:
    Use cardinal prefixes (North, West, Upper, Lower, etc.) ONLY when it adds genuine grounding or logical realism. 
    - If a bridge is at Y=0.1, "The North Span" makes sense.
    - If a hub is simply a strong central center, give it a unique proper name like "Oakhaven" rather than "Central Hub".
    - Avoid prefixing every name. If a feature doesn't need a directional indicator to feel real, don't add one.
    
    AESTHETIC:
    - Urban Districts: Mix historical, industrial, and modern neighborhood names.
    - Hubs: Major plazas, transit centers, or civic squares.
    - Bridges: Noble, functional, or historical engineering names.
    
    METADATA:
    ${JSON.stringify(namingPayload, null, 2)}
  `;

  try {
    const response = await profile('Gemini.generateNames', () => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert at urban geography. Generate exactly one unique name per ID provided. Use the normalized coordinates to inform cardinal prefixes ONLY where it logically enhances realism. Return JSON strictly matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hubs: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["id", "name"] }
            },
            waterBodies: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["id", "name"] }
            },
            bridges: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["id", "name"] }
            },
            notableShapes: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["id", "name"] }
            }
          },
          required: ["hubs", "waterBodies", "bridges", "notableShapes"]
        }
      }
    }));

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    const result = JSON.parse(text);

    // 1. Assign names
    result.hubs?.forEach((item: {id: string, name: string}) => {
      const hub = state.geography.hubs.find(h => h.id === item.id);
      if (hub) hub.name = item.name;
    });

    result.waterBodies?.forEach((item: {id: string, name: string}) => {
      const wb = state.geography.waterBodies.find(w => w.id === item.id);
      if (wb) wb.name = item.name;
    });

    result.bridges?.forEach((item: {id: string, name: string}) => {
      const bridge = state.geography.bridges.find(b => b.id === item.id);
      if (bridge) bridge.name = item.name;
    });

    result.notableShapes?.forEach((item: {id: string, name: string}) => {
      const ns = state.geography.notableShapes.find(n => n.id === item.id);
      if (ns) ns.name = item.name;
    });

    // 2. Perform Label Relaxation Simulation
    profile('LabelRelaxer.run', () => {
      const allLabels: (Label & { ref: { labelOffset?: { x: number; y: number } } })[] = [];
      const scaleHeuristic = 0.5;

      geo.hubs.forEach(h => {
        if (h.name) {
          const dims = LabelRelaxer.estimateDimensions(h.name, scaleHeuristic);
          allLabels.push({ id: h.id, anchor: new Vector2D(h.position.x, h.position.y), pos: new Vector2D(h.position.x, h.position.y), ...dims, ref: h });
        }
      });
      geo.waterBodies.forEach(w => {
        if (w.name) {
          const dims = LabelRelaxer.estimateDimensions(w.name, scaleHeuristic);
          allLabels.push({ id: w.id, anchor: new Vector2D(w.center.x, w.center.y), pos: new Vector2D(w.center.x, w.center.y), ...dims, ref: w });
        }
      });
      geo.bridges.forEach(b => {
        if (b.name) {
          const dims = LabelRelaxer.estimateDimensions(b.name, scaleHeuristic);
          allLabels.push({ id: b.id, anchor: new Vector2D(b.midpoint.x, b.midpoint.y), pos: new Vector2D(b.midpoint.x, b.midpoint.y), ...dims, ref: b });
        }
      });
      geo.notableShapes.forEach(s => {
        if (s.name) {
          const dims = LabelRelaxer.estimateDimensions(s.name, scaleHeuristic);
          allLabels.push({ id: s.id, anchor: new Vector2D(s.center.x, s.center.y), pos: new Vector2D(s.center.x, s.center.y), ...dims, ref: s });
        }
      });

      const relaxed = LabelRelaxer.relax(allLabels, 60, 20);

      relaxed.forEach(l => {
        const offset = l.pos.sub(l.anchor);
        if (l.ref) l.ref.labelOffset = { x: offset.x, y: offset.y };
      });
    });

    addEvent('naming_complete', [], new Vector2D(state.simWidth/2, state.simHeight/2), undefined, {
      message: `Urban Toponymy Applied: ${geo.hubs.length + geo.waterBodies.length + geo.notableShapes.length + geo.bridges.length} features identified.`
    });

    state.iteration++;
  } catch (error: unknown) {
    console.error('Naming Failed:', error);
    addEvent('death_lifetime', [], new Vector2D(0, 0), undefined, { message: "AI Naming Error." });
  }
};