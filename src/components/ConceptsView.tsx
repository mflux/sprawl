
import React, { useState, useCallback, useEffect } from 'react';
import { MODULES } from '../modules/registry';
import { TestResult } from '../types';

export const ConceptsView: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult[] | null>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const runAllTests = useCallback(async () => {
    setIsTesting(true);
    const newResults: Record<string, TestResult[] | null> = {};
    for (const module of MODULES) {
      try {
        newResults[module.id] = await module.runTests();
      } catch (e) {
        newResults[module.id] = [{ name: 'Crash', passed: false, error: String(e) }];
      }
    }
    setTestResults(newResults);
    setIsTesting(false);
  }, []);

  useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  const resultsValues = Object.values(testResults) as (TestResult[] | null)[];

  const allPassed = resultsValues.every(
    results => results !== null && results.every(r => r.passed)
  );
  
  const totalTests = resultsValues.reduce((sum: number, results) => sum + (results ? results.length : 0), 0);
  const passedTests = resultsValues.reduce((sum: number, results) => sum + (results ? results.filter(r => r.passed).length : 0), 0);

  const copyFailedTests = () => {
    const failedList: string[] = [];
    (Object.entries(testResults) as [string, TestResult[] | null][]).forEach(([modId, results]) => {
      const module = MODULES.find(m => m.id === modId);
      results?.forEach(res => {
        if (!res.passed) {
          failedList.push(`[${module?.name || modId}] ${res.name}: ${res.error || 'Failed'}`);
        }
      });
    });

    if (failedList.length > 0) {
      navigator.clipboard.writeText(failedList.join('\n'));
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <main 
      className="pt-16 p-4 max-w-6xl mx-auto overflow-auto h-screen bg-slate-950/90 relative z-10 custom-scrollbar"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onWheel={stopEvent}
    >
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Module Registry</h2>
            {!isTesting && Object.keys(testResults).length > 0 && (
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${allPassed ? 'text-green-500' : 'text-red-500'}`}>
                  {allPassed ? '✓ All Modules Verified' : `⚠ ${totalTests - passedTests} Tests Failed`}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">({passedTests}/{totalTests} checks)</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
             {allPassed && !isTesting && (
               <div className="hidden md:block px-3 py-1 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-500 uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                 System Status: Optimal
               </div>
             )}
             
             {!allPassed && !isTesting && (
               <button 
                 onClick={copyFailedTests}
                 className="text-[9px] px-3 py-1.5 bg-slate-800 text-slate-300 font-black uppercase rounded hover:bg-slate-700 transition-all border border-slate-700"
               >
                 {showCopied ? 'Copied!' : 'Copy Failed Reports'}
               </button>
             )}

            <button 
              onClick={runAllTests} 
              disabled={isTesting}
              className="text-[10px] px-4 py-1.5 bg-cyan-600 text-white font-black uppercase rounded-sm hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Run All Tests'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODULES.map(module => (
            <div key={module.id} className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 space-y-4 hover:border-slate-700 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${testResults[module.id] ? (testResults[module.id]!.every(r => r.passed) ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]') : 'bg-slate-700'}`} />
                  <h3 className="text-xs font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{module.name}</h3>
                </div>
              </div>
              
              <div className="bg-black/20 rounded border border-slate-800/50 overflow-hidden">
                <module.DemoComponent />
              </div>

              {testResults[module.id] && (
                <div className="grid grid-cols-2 gap-2">
                  {testResults[module.id]!.map((res, i) => (
                    <div key={i} className={`flex items-center gap-2 p-1.5 rounded transition-colors ${res.passed ? 'bg-black/10' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <div className={`w-1 h-1 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                      <span className={`text-[9px] font-mono truncate ${res.passed ? 'text-slate-400' : 'text-red-400 font-bold'}`}>
                        {res.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
