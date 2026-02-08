import React from 'react';
import { GenerationState, VisualizationSettings } from '../../types';
import { SettingSlider, SettingToggle } from './UI/SettingControls';
import { saveVizSettings } from '../../state/store';

interface VisualizationControlsProps {
  state: GenerationState;
  onUpdate: () => void;
}

export const VisualizationControls: React.FC<VisualizationControlsProps> = ({ state, onUpdate }) => {
  const handleVizChange = (key: keyof VisualizationSettings, val: VisualizationSettings[keyof VisualizationSettings]) => {
    Object.assign(state.visualizationSettings, { [key]: val });
    saveVizSettings(state.visualizationSettings);
    onUpdate();
  };

  return (
    <div className="flex flex-col min-h-0 p-3 pt-0 overflow-y-auto custom-scrollbar">
      <SettingToggle label="Elevation Map" value={state.visualizationSettings.renderElevation} onChange={(v) => handleVizChange('renderElevation', v)} />
      <SettingToggle label="Flow Field" value={state.visualizationSettings.renderFlowField} onChange={(v) => handleVizChange('renderFlowField', v)} />
      <SettingToggle label="Shorelines" value={state.visualizationSettings.renderShorelines} onChange={(v) => handleVizChange('renderShorelines', v)} />
      <SettingToggle label="Show Hubs" value={state.visualizationSettings.renderHubs} onChange={(v) => handleVizChange('renderHubs', v)} />
      <SettingToggle label="Show Fork Agents" value={state.visualizationSettings.showForkAgents} onChange={(v) => handleVizChange('showForkAgents', v)} />
      <SettingSlider label="Road Opacity" value={state.visualizationSettings.roadOpacity} min={0} max={255} step={1} onChange={(v) => handleVizChange('roadOpacity', v)} />
      <SettingSlider label="Road Thick" value={state.visualizationSettings.roadThickness} min={0.1} max={5} step={0.1} onChange={(v) => handleVizChange('roadThickness', v)} />
      <SettingSlider label="Node Size" value={state.visualizationSettings.roadNodeSize} min={0} max={8} step={0.1} onChange={(v) => handleVizChange('roadNodeSize', v)} />
      <SettingSlider label="Agent Size" value={state.visualizationSettings.agentSize} min={0.5} max={10} step={0.1} onChange={(v) => handleVizChange('agentSize', v)} />
      <SettingSlider label="Agent Vector" value={state.visualizationSettings.agentVectorLength} min={1} max={30} step={1} onChange={(v) => handleVizChange('agentVectorLength', v)} />
    </div>
  );
};
