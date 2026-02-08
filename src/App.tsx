
import React, { useState } from 'react';
import { AppView } from './types';
import { Header } from './components/Header';
import { GenerationView } from './components/GenerationView';
import { ConceptsView } from './components/ConceptsView';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('generation');

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-slate-300 font-sans">
      <Header currentView={view} setView={setView} />
      
      {view === 'generation' ? (
        <GenerationView setView={setView} />
      ) : (
        <ConceptsView />
      )}
    </div>
  );
};

export default App;
