import React from 'react';
import { VisualizationSettings } from '../../types';
import { SettingSlider, SettingToggle } from './UI/SettingControls';
import { useUIStore } from '../../state/uiStore';

export const VisualizationControls: React.FC = () => {
  const vizSettings = useUIStore((s) => s.vizSettings);
  const updateVizSetting = useUIStore((s) => s.updateVizSetting);

  const handleVizChange = (key: keyof VisualizationSettings, val: VisualizationSettings[keyof VisualizationSettings]) => {
    updateVizSetting(key, val);
  };

  return (
    <div className="flex flex-col min-h-0 p-3 pt-0 overflow-y-auto custom-scrollbar">
      <SettingToggle label="Elevation Map" value={vizSettings.renderElevation} onChange={(v) => handleVizChange('renderElevation', v)} />
      <SettingToggle label="Flow Field" value={vizSettings.renderFlowField} onChange={(v) => handleVizChange('renderFlowField', v)} />
      <SettingToggle label="Shorelines" value={vizSettings.renderShorelines} onChange={(v) => handleVizChange('renderShorelines', v)} />
      <SettingToggle label="Show Hubs" value={vizSettings.renderHubs} onChange={(v) => handleVizChange('renderHubs', v)} />
      <SettingToggle label="Show Fork Agents" value={vizSettings.showForkAgents} onChange={(v) => handleVizChange('showForkAgents', v)} />
      <SettingSlider label="Road Opacity" value={vizSettings.roadOpacity} min={0} max={255} step={1} onChange={(v) => handleVizChange('roadOpacity', v)} />
      <SettingSlider label="Road Thick" value={vizSettings.roadThickness} min={0.1} max={5} step={0.1} onChange={(v) => handleVizChange('roadThickness', v)} />
      <SettingSlider label="Node Size" value={vizSettings.roadNodeSize} min={0} max={8} step={0.1} onChange={(v) => handleVizChange('roadNodeSize', v)} />
      <SettingSlider label="Agent Size" value={vizSettings.agentSize} min={0.5} max={10} step={0.1} onChange={(v) => handleVizChange('agentSize', v)} />
      <SettingSlider label="Agent Vector" value={vizSettings.agentVectorLength} min={1} max={30} step={1} onChange={(v) => handleVizChange('agentVectorLength', v)} />
    </div>
  );
};
