
import React from 'react';
import { 
  BuildEra, 
  EmitterType, 
  HeatingSource, 
  HouseConfig, 
  HouseType, 
  StrategyConfig, 
  SystemConfig, 
  WeatherPreset 
} from '../types';
import { HEATING_SYSTEM_SPECS } from '../constants';
import { Wind, Weight, ToggleLeft, ToggleRight, Thermometer, Zap } from 'lucide-react';

interface Props {
  house: HouseConfig;
  setHouse: (h: HouseConfig) => void;
  system: SystemConfig;
  setSystem: (s: SystemConfig) => void;
  strategy: StrategyConfig;
  setStrategy: (s: StrategyConfig) => void;
  weather: WeatherPreset;
  setWeather: (w: WeatherPreset) => void;
  useTargetAverage: boolean;
  setUseTargetAverage: (v: boolean) => void;
}

const SimulationConfigPanel: React.FC<Props> = ({
  house, setHouse,
  system, setSystem,
  strategy, setStrategy,
  weather, setWeather,
  useTargetAverage, setUseTargetAverage
}) => {

  const updateHouse = (field: keyof HouseConfig, value: any) => {
    setHouse({ ...house, [field]: value });
  };

  const updateStrategy = (field: keyof StrategyConfig, value: any) => {
    setStrategy({ ...strategy, [field]: value });
  };

  // When source changes, snap to default power
  const handleSourceChange = (newSource: HeatingSource) => {
    const specs = HEATING_SYSTEM_SPECS[newSource];
    setSystem({
        ...system,
        source: newSource,
        maxPower: specs.default
    });
  };

  const currentSpecs = HEATING_SYSTEM_SPECS[system.source];

  return (
    <div className="bg-white h-full overflow-y-auto p-5 space-y-8">
      
      {/* Section 1: House Profile */}
      <section>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          1. The House
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={house.type}
              onChange={(e) => updateHouse('type', e.target.value as HouseType)}
            >
              {Object.values(HouseType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Build Era</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={house.era}
              onChange={(e) => updateHouse('era', e.target.value as BuildEra)}
            >
              {Object.values(BuildEra).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Wind size={12} /> Draughtiness
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.1"
              value={house.draughtiness}
              onChange={(e) => updateHouse('draughtiness', parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Airtight</span>
              <span>Draughty</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Weight size={12} /> Thermal Mass
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.1"
              value={house.thermalMass}
              onChange={(e) => updateHouse('thermalMass', parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Heating System */}
      <section>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          2. Heating System
        </h2>
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1">Source</label>
             <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={system.source}
                onChange={(e) => handleSourceChange(e.target.value as HeatingSource)}
              >
                {Object.values(HeatingSource).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          </div>
          
          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1"><Zap size={12} /> Max Power Output</span>
                <span className="text-blue-600 font-bold">{system.maxPower} kW</span>
             </label>
             <input 
              type="range" 
              min={currentSpecs.min} max={currentSpecs.max} step="1"
              value={system.maxPower}
              onChange={(e) => setSystem({...system, maxPower: parseFloat(e.target.value)})}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{currentSpecs.min} kW</span>
              <span>{currentSpecs.max} kW</span>
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 mb-1">Emitters</label>
             <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={system.emitter}
                onChange={(e) => setSystem({...system, emitter: e.target.value as EmitterType})}
              >
                {Object.values(EmitterType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          </div>
        </div>
      </section>

      {/* Section 3: Conditions & Strategy */}
      <section>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          3. Conditions & Goals
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Outside Weather</label>
            <div className="grid grid-cols-3 gap-1">
              {Object.values(WeatherPreset).map((p) => (
                <button
                  key={p}
                  onClick={() => setWeather(p)}
                  className={`px-1 py-2 text-[10px] sm:text-xs rounded border text-center transition-all ${weather === p ? 'bg-blue-600 text-white border-blue-600 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {p.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Thermostat</span>
                <button 
                  onClick={() => setUseTargetAverage(!useTargetAverage)}
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  title="Toggle between Comfort Setpoint and Target Average"
                >
                   {useTargetAverage ? "Mode: Avg Temp" : "Mode: Setpoint"}
                   {useTargetAverage ? <ToggleRight className="text-blue-600" size={20} /> : <ToggleLeft className="text-slate-400" size={20} />}
                </button>
             </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1"><Thermometer size={14}/> Comfort</span>
                <span className="text-blue-600 font-bold">{strategy.comfortTemp}°C</span>
              </label>
              <input 
                type="range" 
                min="16" max="30" step="0.5"
                value={strategy.comfortTemp}
                onChange={(e) => updateStrategy('comfortTemp', parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-200/50">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">Setback</span>
                <span className="text-slate-500 font-bold">{strategy.setbackTemp}°C</span>
              </label>
              <input 
                type="range" 
                min="10" max="18" step="0.5"
                value={strategy.setbackTemp}
                onChange={(e) => updateStrategy('setbackTemp', parseFloat(e.target.value))}
                className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Temperature for "Setback" mode during off-hours.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default SimulationConfigPanel;
