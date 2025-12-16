
import React, { useState, useMemo } from 'react';
import SimulationConfigPanel from './components/SimulationConfigPanel';
import ResultsPanel from './components/ResultsPanel';
import ExplanationPanel from './components/ExplanationPanel';
import { 
  HouseConfig, 
  HouseType, 
  BuildEra, 
  SystemConfig, 
  HeatingSource, 
  EmitterType, 
  StrategyConfig, 
  StrategyType, 
  WeatherPreset,
  SimulationResult
} from './types';
import { DEFAULT_SCHEDULE, HEATING_SYSTEM_SPECS } from './constants';
import { runSimulation } from './services/physicsEngine';
import { Home } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [house, setHouse] = useState<HouseConfig>({
    type: HouseType.SEMI_DETACHED,
    sizeMultiplier: 1.0,
    era: BuildEra.ERA_1930_1980,
    draughtiness: 0.5,
    thermalMass: 0.5,
  });

  const [system, setSystem] = useState<SystemConfig>({
    source: HeatingSource.GAS_BOILER,
    emitter: EmitterType.RADIATORS,
    // Initialize with the default power for the default source
    maxPower: HEATING_SYSTEM_SPECS[HeatingSource.GAS_BOILER].default
  });

  // We keep the parameters that are common to strategies here
  // The 'type' field in this state is largely ignored now as we force run all 3
  const [strategyParams, setStrategyParams] = useState<StrategyConfig>({
    type: StrategyType.TIMED, // Default placeholder
    comfortTemp: 21,
    setbackTemp: 16,
    activeHours: DEFAULT_SCHEDULE,
  });

  const [weather, setWeather] = useState<WeatherPreset>(WeatherPreset.COLD);
  const [useTargetAverage, setUseTargetAverage] = useState<boolean>(false);

  // --- Computation ---
  // Run simulation for ALL 3 strategy types
  const resultsMap = useMemo(() => {
    const runForType = (type: StrategyType) => {
      const specificStrategy = { ...strategyParams, type };
      return runSimulation(house, system, specificStrategy, weather, useTargetAverage);
    };

    return {
      [StrategyType.ALWAYS_ON]: runForType(StrategyType.ALWAYS_ON),
      [StrategyType.SETBACK]: runForType(StrategyType.SETBACK),
      [StrategyType.TIMED]: runForType(StrategyType.TIMED),
    };
  }, [house, system, strategyParams, weather, useTargetAverage]);

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
                <Home className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-lg font-bold tracking-tight">ThermoLogic</h1>
                <p className="text-xs text-slate-400">Heating Strategy Simulator</p>
            </div>
        </div>
        <div className="hidden md:block text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
            V1.0 • Comparative Dashboard
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left: Configuration Panel */}
        <div className="w-full md:w-[320px] shrink-0 h-full overflow-hidden border-r border-slate-200">
            <SimulationConfigPanel 
                house={house} setHouse={setHouse}
                system={system} setSystem={setSystem}
                strategy={strategyParams} setStrategy={setStrategyParams}
                weather={weather} setWeather={setWeather}
                useTargetAverage={useTargetAverage}
                setUseTargetAverage={setUseTargetAverage}
            />
        </div>

        {/* Right: Results & Viz */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Intro / Context */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Performance Comparison</h2>
                        <p className="text-sm text-slate-500">
                            Simulating <span className="font-semibold">{house.era} {house.type}</span> with 
                            <span className="font-semibold"> {system.maxPower}kW {system.source}</span> ({weather.toLowerCase()}).
                        </p>
                    </div>
                </div>

                 {/* Narrative Explanation (Now at top for summary) */}
                 <ExplanationPanel 
                    results={resultsMap}
                    house={house}
                    system={system}
                    strategyParams={strategyParams}
                    useTargetAverage={useTargetAverage}
                />

                {/* Dashboard Lanes */}
                <ResultsPanel 
                  results={resultsMap} 
                  strategyParams={strategyParams} 
                  useTargetAverage={useTargetAverage}
                />

            </div>
        </div>

      </div>
    </div>
  );
};

export default App;
