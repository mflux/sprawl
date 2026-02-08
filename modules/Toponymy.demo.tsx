import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GeographyMetadata } from '../types';

const ToponymyDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize names as an empty map
  const [names, setNames] = useState<Record<string, string>>({});

  // Mock simulation bounds for demo
  const DEMO_W = 1000;
  const DEMO_H = 1000;

  const syntheticGeo: GeographyMetadata = useMemo(() => ({
    hubs: [
      { id: 'hub-alpha', position: { x: 50, y: 50 }, size: 120, tier: 1, distToWater: 400 },
      { id: 'hub-beta', position: { x: 200, y: 450 }, size: 60, tier: 2, distToWater: 20 },
      { id: 'hub-gamma', position: { x: 800, y: 150 }, size: 40, tier: 3, distToWater: 150 },
    ],
    waterBodies: [
      { id: 'lake-01', area: 150000, center: { x: 100, y: 800 } },
      { id: 'river-east', area: 45000, center: { x: 900, y: 300 } },
    ],
    bridges: [
      { id: 'bridge-01', midpoint: { x: 150, y: 625 }, length: 120 },
      { id: 'bridge-02', midpoint: { x: 700, y: 300 }, length: 450 }
    ],
    notableShapes: [
      { id: 'dist-01', area: 85000, center: { x: 300, y: 300 }, distToNearestHub: 50, nearestHubId: 'hub-alpha' },
      { id: 'park-north', area: 250000, center: { x: 100, y: 100 }, distToNearestHub: 300, nearestHubId: 'hub-alpha' },
    ]
  }), []);

  const generateNames = async () => {
    setLoading(true);
    setError(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Enrich with normalized coordinates
    const namingPayload = {
      hubs: syntheticGeo.hubs.map(h => ({ ...h, normalizedPos: { x: h.position.x / DEMO_W, y: h.position.y / DEMO_H } })),
      waterBodies: syntheticGeo.waterBodies.map(w => ({ ...w, normalizedPos: { x: w.center.x / DEMO_W, y: w.center.y / DEMO_H } })),
      bridges: syntheticGeo.bridges.map(b => ({ ...b, normalizedPos: { x: b.midpoint.x / DEMO_W, y: b.midpoint.y / DEMO_H } })),
      notableShapes: syntheticGeo.notableShapes.map(s => ({ ...s, normalizedPos: { x: s.center.x / DEMO_W, y: s.center.y / DEMO_H } }))
    };

    const prompt = `
      You are a world-class urban toponymist.
      Generate unique, realistic, and evocative names for these procedural city features.
      Use 'normalizedPos' to determine if a cardinal prefix (North, South, etc.) adds logic, but use them sparingly. 
      Only use prefixes if they logically help anchor the feature in the city's spatial grid.
      
      Metadata:
      ${JSON.stringify(namingPayload, null, 2)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Generate exactly one unique name per ID provided. Apply cardinal prefixes ONLY when it significantly enhances realism based on coordinates. Return JSON matching the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              names: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING }
                  },
                  required: ["id", "name"]
                }
              }
            },
            required: ["names"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"names":[]}');
      const newNames: Record<string, string> = {};
      data.names.forEach((item: { id: string, name: string }) => {
        newNames[item.id] = item.name;
      });
      setNames(newNames);
    } catch (err: any) {
      setError(err.message || 'API Call Failed');
    } finally {
      setLoading(false);
    }
  };

  const FeatureItem: React.FC<{ id: string, label: string, info: string, colorClass: string }> = ({ id, label, info, colorClass }) => (
    <div className="flex flex-col gap-0.5 mb-2 border-l-2 pl-2 border-slate-800 hover:border-cyan-900/50 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">{id}</span>
        <span className={`text-[7px] font-black uppercase ${colorClass} tracking-[0.1em]`}>{label}</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className={`text-xs font-black ${names[id] ? 'text-white' : 'text-slate-600 italic'}`}>
          {names[id] || 'Unnamed Feature'}
        </span>
        <span className="text-[7px] font-mono text-slate-600">{info}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 rounded-lg border border-slate-900">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.2em]">Toponymy Engine</h4>
          <p className="text-[9px] text-slate-500 uppercase">Step 7: Semantic Identification</p>
        </div>
        <button 
          onClick={generateNames}
          disabled={loading}
          className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all shadow-lg ${loading ? 'bg-slate-800 text-slate-600 cursor-wait' : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20'}`}
        >
          {loading ? 'Synthesizing...' : 'Generate Names'}
        </button>
      </div>

      {error && (
        <div className="p-2 bg-red-900/20 border border-red-900/40 rounded text-[9px] text-red-400 font-mono italic">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border-t border-slate-900 pt-4">
        <div>
          <h5 className="text-[8px] font-black text-slate-600 uppercase mb-3 tracking-widest border-b border-slate-900 pb-1">Detected Infrastructure</h5>
          {syntheticGeo.hubs.map(h => (
            <FeatureItem key={h.id} id={h.id} label="Urban Hub" info={`Tier ${h.tier}`} colorClass="text-cyan-500" />
          ))}
          {syntheticGeo.bridges.map(b => (
            <FeatureItem key={b.id} id={b.id} label="Bridge Span" info={`${b.length}m`} colorClass="text-slate-400" />
          ))}
        </div>

        <div>
          <h5 className="text-[8px] font-black text-slate-600 uppercase mb-3 tracking-widest border-b border-slate-900 pb-1">Geographic Bounds</h5>
          {syntheticGeo.waterBodies.map(w => (
            <FeatureItem key={w.id} id={w.id} label="Hydrology" info={`${Math.floor(w.area/100)}u²`} colorClass="text-sky-500" />
          ))}
          {syntheticGeo.notableShapes.map(s => (
            <FeatureItem key={s.id} id={s.id} label="District" info={`${Math.floor(s.area/100)}u²`} colorClass="text-emerald-500" />
          ))}
        </div>
      </div>

      {!loading && Object.keys(names).length === 0 && (
        <div className="text-center py-2 border-t border-slate-900 mt-2">
          <p className="text-[8px] text-slate-700 uppercase font-bold tracking-[0.2em]">Metadata Loaded: Awaiting API Name Synthesis</p>
        </div>
      )}
    </div>
  );
};

export default ToponymyDemo;