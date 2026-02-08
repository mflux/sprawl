
import React, { useState } from 'react';
import { GenerationState, SimulationSettings } from '../../types';
import { SettingSlider, SettingToggle } from './UI/SettingControls';
import { saveSettings, DEFAULT_SETTINGS } from '../../state/store';

interface SimulationSettingsControlsProps {
  state: GenerationState;
  onUpdate: () => void;
}

export const SimulationSettingsControls: React.FC<SimulationSettingsControlsProps> = ({ state, onUpdate }) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleSettingChange = (key: keyof SimulationSettings, val: any) => {
    (state.settings as any)[key] = val;
    saveSettings(state.settings);
    onUpdate();
  };

  const handleResetSettings = () => {
    Object.assign(state.settings, DEFAULT_SETTINGS);
    saveSettings(state.settings);
    onUpdate();
  };

  const handleCopySettings = () => {
    navigator.clipboard.writeText(JSON.stringify(state.settings, null, 2));
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-0 p-3 pt-0 overflow-y-auto custom-scrollbar">
      <div className="space-y-4 pb-4 pt-2">
        <div className="border-b border-slate-800/30 pb-2 mb-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">System Behavior</span>
          <SettingSlider label="Play Speed" value={state.settings.simSpeed} min={1} max={25} step={1} onChange={(v) => handleSettingChange('simSpeed', v)} unit="x" />
        </div>

        <div className="border-b border-slate-800/30 pb-2 mb-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Population Growth</span>
          <SettingSlider label="Hub Count" value={state.settings.hubCount} min={2} max={15} step={1} onChange={(v: number) => handleSettingChange('hubCount', v)} />
          <SettingSlider label="Ants Per Hub" value={state.settings.antsPerHub} min={1} max={10} step={1} onChange={(v: number) => handleSettingChange('antsPerHub', v)} />
          <SettingSlider label="Spawn Intensity" value={state.settings.spawnIntensity} min={0.1} max={2.0} step={0.1} onChange={(v: number) => handleSettingChange('spawnIntensity', v)} unit="x" />
          <SettingSlider label="Ant Waves" value={state.settings.antWaves} min={1} max={10} step={1} onChange={(v: number) => handleSettingChange('antWaves', v)} />
        </div>

        <div className="border-b border-slate-800/30 pb-2 mb-2">
          <span className="text-[6px] font-black text-slate-400 block mb-1 uppercase tracking-tighter">Traffic Logic</span>
          <SettingSlider label="Sample Size" value={state.settings.maxTrafficTrips} min={50} max={1500} step={50} onChange={(v: number) => handleSettingChange('maxTrafficTrips', v)} unit=" trips" />
        </div>

        <div className="border-b border-slate-800/30 pb-2 mb-2">
          <span className="text-[6px] font-black text-indigo-600 block mb-1 uppercase tracking-tighter">Carrier Ants</span>
          <SettingSlider label="Carrier Count" value={state.settings.carrierCount} min={0} max={10} step={1} onChange={(v: number) => handleSettingChange('carrierCount', v)} />
          <SettingSlider label="Fork Spacing" value={state.settings.carrierForkSpacing} min={20} max={300} step={10} onChange={(v: number) => handleSettingChange('carrierForkSpacing', v)} unit="px" />
          <SettingSlider label="Min Dist" value={state.settings.carrierMinDistance} min={20} max={500} step={10} onChange={(v: number) => handleSettingChange('carrierMinDistance', v)} unit="px" />
        </div>
        
        <div className="border-t border-slate-800/30 pt-2 mt-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Parallel Separation</span>
          <SettingSlider label="Buffer Dist" value={state.settings.minParallelDist} min={10} max={100} step={1} onChange={(v: number) => handleSettingChange('minParallelDist', v)} unit="px" />
          <SettingSlider label="Repulsion Force" value={state.settings.antParallelRepulsion} min={0} max={0.5} step={0.01} onChange={(v: number) => handleSettingChange('antParallelRepulsion', v)} />
        </div>

        <div className="border-t border-slate-800/30 pt-2 mt-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Meeting Magnetism</span>
          <SettingSlider label="Magnet Radius" value={state.settings.antAttractionRadius} min={10} max={150} step={1} onChange={(v: number) => handleSettingChange('antAttractionRadius', v)} unit="px" />
          <SettingSlider label="Magnet Force" value={state.settings.antAttractionStrength} min={0} max={1.0} step={0.05} onChange={(v: number) => handleSettingChange('antAttractionStrength', v)} />
        </div>

        <SettingSlider label="Hub Influence" value={state.settings.hubInfluence} min={0} max={1} step={0.05} onChange={(v: number) => handleSettingChange('hubInfluence', v)} />
        <SettingSlider label="Directness %" value={state.settings.hubDirectness} min={0} max={1} step={0.05} onChange={(v: number) => handleSettingChange('hubDirectness', v)} />
        
        <div className="border-t border-slate-800/30 pt-2 mt-2">
          <SettingSlider label="Ring Road Prob" value={state.settings.ringRoadProbability} min={0} max={1} step={0.05} onChange={(v: number) => handleSettingChange('ringRoadProbability', v)} />
          <SettingSlider label="Ring Radius Mult" value={state.settings.ringRoadRadiusMultiplier} min={0.5} max={3.0} step={0.1} onChange={(v: number) => handleSettingChange('ringRoadRadiusMultiplier', v)} />
        </div>

        <SettingSlider label="Ant Lifetime" value={state.settings.antMaxLife} min={10} max={1500} step={10} onChange={(v: number) => handleSettingChange('antMaxLife', v)} />
        <SettingSlider label="Trail Distance" value={state.settings.antTrailDistance} min={1} max={50} step={0.5} onChange={(v: number) => handleSettingChange('antTrailDistance', v)} />
        <SettingSlider label="Turn Speed" value={state.settings.antTurnSpeed} min={0.001} max={0.5} step={0.001} onChange={(v: number) => handleSettingChange('antTurnSpeed', v)} />
        <SettingSlider label="Ant Wander" value={state.settings.antWanderIntensity} min={0} max={2.0} step={0.01} onChange={(v: number) => handleSettingChange('antWanderIntensity', v)} />
        <SettingSlider label="Ant Survival" value={state.settings.antRoadSurvivalChance} min={0} max={1.0} step={0.01} onChange={(v: number) => handleSettingChange('antRoadSurvivalChance', v)} />
        <SettingSlider label="Min Long Road" value={state.settings.minLongRoadLength} min={10} max={300} step={5} onChange={(v: number) => handleSettingChange('minLongRoadLength', v)} unit="px" />
        <SettingSlider label="Merge Threshold" value={state.settings.mergeAreaThreshold} min={0} max={10000} step={100} onChange={(v: number) => handleSettingChange('mergeAreaThreshold', v)} unit=" area" />
        
        <div className="border-t border-slate-800/30 pt-2 mt-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Terrain Topology</span>
          <SettingSlider label="Terrain Scale" value={state.settings.terrainScale} min={0.0005} max={0.01} step={0.0001} onChange={(v: number) => handleSettingChange('terrainScale', v)} />
          <SettingSlider label="Water Level" value={state.settings.terrainWaterLevel} min={0} max={0.8} step={0.01} onChange={(v: number) => handleSettingChange('terrainWaterLevel', v)} />
        </div>

        <div className="border-t border-slate-800/30 pt-2 mt-2">
          <span className="text-[6px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Network Cleanliness</span>
          <SettingSlider label="Cleanup Snap" value={state.settings.cleanupSnap} min={1} max={30} step={1} onChange={(v: number) => handleSettingChange('cleanupSnap', v)} unit="px" />
          <SettingToggle label="Sliver Reduction" value={state.settings.enableSliverReduction} onChange={(v) => handleSettingChange('enableSliverReduction', v)} />
          <SettingSlider label="Subdiv Density" value={state.settings.subdivisionDensity} min={0.2} max={5} step={0.1} onChange={(v: number) => handleSettingChange('subdivisionDensity', v)} unit="x" />
          <SettingSlider label="Min Subdiv Area" value={state.settings.minSubdivisionArea} min={0} max={10000} step={100} onChange={(v: number) => handleSettingChange('minSubdivisionArea', v)} unit=" area" />
          <SettingSlider label="Max Subdiv Area" value={state.settings.maxSubdivisionArea} min={1000} max={500000} step={1000} onChange={(v: number) => handleSettingChange('maxSubdivisionArea', v)} unit=" area" />
          <SettingSlider label="Subdiv Wander" value={state.settings.antSubdivideWander} min={0} max={0.2} step={0.001} onChange={(v: number) => handleSettingChange('antSubdivideWander', v)} />
          <SettingSlider label="Grid Warp" value={state.settings.subdivideWarp} min={0} max={100} step={1} onChange={(v: number) => handleSettingChange('subdivideWarp', v)} unit="px" />
          <SettingSlider label="Grid Relax" value={state.settings.subdivideRelax} min={0} max={30} step={1} onChange={(v: number) => handleSettingChange('subdivideRelax', v)} unit=" iters" />
          <SettingSlider label="Subdivide Snap" value={state.settings.subdivideSnap} min={1} max={50} step={1} onChange={(v: number) => handleSettingChange('subdivideSnap', v)} unit="px" />
          <SettingSlider label="Ant Subdiv Snap" value={state.settings.antSubdivideSnap} min={1} max={50} step={1} onChange={(v: number) => handleSettingChange('antSubdivideSnap', v)} unit="px" />
          <SettingSlider label="Arterial Snap" value={state.settings.antSnapDistance} min={1} max={60} step={1} onChange={(v: number) => handleSettingChange('antSnapDistance', v)} unit="px" />
        </div>

        <div className="border-t border-slate-800/30 pt-2">
          <SettingSlider label="Flow Influence" value={state.settings.flowFieldInfluence} min={0} max={0.1} step={0.001} onChange={(v: number) => handleSettingChange('flowFieldInfluence', v)} />
          <SettingSlider label="Flow Scale (L)" value={state.settings.flowFieldScaleLarge} min={0.001} max={0.5} step={0.001} onChange={(v: number) => handleSettingChange('flowFieldScaleLarge', v)} />
          <SettingSlider label="Flow Scale (S)" value={state.settings.flowFieldScaleSmall} min={0.001} max={1.0} step={0.001} onChange={(v: number) => handleSettingChange('flowFieldScaleSmall', v)} />
        </div>

        <div className="space-y-2 mt-4">
          <button 
            onClick={handleResetSettings} 
            className="w-full py-1.5 bg-slate-800/40 hover:bg-slate-700/60 text-slate-500 text-[8px] font-bold uppercase rounded border border-slate-800 transition-all"
          >
            Reset All Settings
          </button>
          <button 
            onClick={handleCopySettings} 
            className={`w-full py-1.5 text-[8px] font-bold uppercase rounded border transition-all ${showCopied ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 hover:bg-slate-700/60 text-slate-500 border-slate-800'}`}
          >
            {showCopied ? 'Settings Copied!' : 'Copy Current Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
