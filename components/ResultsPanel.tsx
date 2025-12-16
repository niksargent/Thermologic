import React, { useState } from 'react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { SimulationResult, StrategyConfig, StrategyType } from '../types';
import { Zap, Clock, Thermometer, AlertTriangle } from 'lucide-react';

interface ResultsPanelProps {
  results: Record<StrategyType, SimulationResult>;
  strategyParams: StrategyConfig;
  useTargetAverage: boolean;
}

type VizMode = 'TEMP' | 'POWER';

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, strategyParams, useTargetAverage }) => {
  const [vizMode, setVizMode] = useState<VizMode>('TEMP');

  // Strategy definitions for the lanes
  const lanes = [
    { 
      type: StrategyType.ALWAYS_ON, 
      label: "Always On", 
      desc: "Maintain comfort temp 24/7",
      color: "#f59e0b" // Amber
    },
    { 
      type: StrategyType.SETBACK, 
      label: "Setback", 
      desc: `Drop to ${strategyParams.setbackTemp}°C overnight`,
      color: "#3b82f6" // Blue
    },
    { 
      type: StrategyType.TIMED, 
      label: "Timed / Off", 
      desc: "Heating off overnight",
      color: "#10b981" // Emerald
    }
  ];

  return (
    <div className="space-y-4">
      
      {/* Global Toolbar */}
      <div className="flex justify-end items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Chart View:</span>
        <button 
          onClick={() => setVizMode('TEMP')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${vizMode === 'TEMP' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Temperature
        </button>
        <button 
          onClick={() => setVizMode('POWER')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${vizMode === 'POWER' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Power Usage
        </button>
      </div>

      {/* Lanes Container */}
      <div className="space-y-3">
        {lanes.map((lane, index) => {
          const result = results[lane.type];
          const isLast = index === lanes.length - 1;
          
          return (
            <StrategyLane 
              key={lane.type}
              type={lane.type}
              label={lane.label}
              desc={lane.desc}
              color={lane.color}
              result={result}
              vizMode={vizMode}
              showXAxis={isLast}
              comfortTemp={strategyParams.comfortTemp}
              useTargetAverage={useTargetAverage}
            />
          );
        })}
      </div>

    </div>
  );
};

interface LaneProps {
  type: StrategyType;
  label: string;
  desc: string;
  color: string;
  result: SimulationResult;
  vizMode: VizMode;
  showXAxis: boolean;
  comfortTemp: number;
  useTargetAverage: boolean;
}

const StrategyLane: React.FC<LaneProps> = ({ 
  label, desc, color, result, vizMode, showXAxis, comfortTemp, useTargetAverage
}) => {
  
  // Determine failing state: Avg Temp mode is active AND we missed target by > 1.0 degree
  const isFailing = useTargetAverage && Math.abs(result.avgTemp - comfortTemp) > 1.0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the specific payloads
      const tempPayload = payload.find((p: any) => p.dataKey === 'indoorTemp');
      const powerPayload = payload.find((p: any) => p.dataKey === 'powerInput');
      const outdoorPayload = payload.find((p: any) => p.dataKey === 'outdoorTemp');

      // If we are in area chart mode or if using ghost area, payload order might vary
      // Safely accessing properties
      const indoor = tempPayload ? tempPayload.payload.indoorTemp : payload[0].payload.indoorTemp;
      const outdoor = outdoorPayload ? outdoorPayload.payload.outdoorTemp : payload[0].payload.outdoorTemp;
      const power = powerPayload ? powerPayload.payload.powerInput : payload[0].payload.powerInput;

      return (
        <div className="bg-white/95 backdrop-blur-sm p-2 border border-slate-200 shadow-xl rounded text-xs z-50">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          <div className="space-y-1">
             <p className="text-orange-600">In: {Number(indoor).toFixed(1)}°C</p>
             <p className="text-slate-400">Out: {Number(outdoor).toFixed(1)}°C</p>
             <p className="text-red-600 font-medium">{Number(power).toFixed(1)} kW</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative flex flex-col md:flex-row bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[140px] transition-opacity duration-300 ${isFailing ? 'opacity-60 grayscale-[0.2]' : 'opacity-100'}`}>
      
      {/* Failing Badge */}
      {isFailing && (
        <div className="absolute top-0 right-0 z-20 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-amber-200 flex items-center gap-1 shadow-sm">
          <AlertTriangle size={10} /> Unable to reach target
        </div>
      )}

      {/* Left: Scoreboard (20-25%) */}
      <div className="w-full md:w-48 lg:w-56 shrink-0 p-4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col justify-between md:justify-center gap-4">
         
         <div className="mb-0 md:mb-2">
            <h3 className="font-bold text-slate-800 text-sm md:text-base" style={{ color: isFailing ? undefined : color }}>{label}</h3>
            <p className="text-[10px] text-slate-400 hidden md:block">{desc}</p>
         </div>

         <div className="flex flex-row md:flex-col gap-4 md:gap-3">
            <div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                 <Zap size={10} /> Energy
               </div>
               <div className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                 {result.totalEnergy.toFixed(1)} <span className="text-sm font-normal text-slate-500">kWh</span>
               </div>
            </div>

            <div className="hidden sm:block">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                 <Thermometer size={10} /> Avg / Min
               </div>
               <div className={`text-sm font-semibold ${isFailing ? 'text-red-600' : 'text-slate-700'}`}>
                 {result.avgTemp.toFixed(1)}° <span className="text-slate-300">/</span> {result.minTemp.toFixed(1)}°
               </div>
            </div>

            {result.recoveryTimeMinutes > 0 && (
               <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                   <Clock size={10} /> Recovery
                 </div>
                 <div className={`text-sm font-semibold ${result.recoveryTimeMinutes > 120 ? 'text-red-600' : 'text-orange-600'}`}>
                   {Math.floor(result.recoveryTimeMinutes/60)}h {result.recoveryTimeMinutes % 60}m
                 </div>
               </div>
            )}
         </div>
      </div>

      {/* Right: Viz (75-80%) */}
      <div className="flex-1 relative h-40 md:h-auto min-h-[160px] p-2 md:p-4">
         <ResponsiveContainer width="100%" height="100%">
            {vizMode === 'TEMP' ? (
              <ComposedChart data={result.steps} syncId="heatingSync" margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <defs>
                   {/* Increased size 4->8 and lightened stroke for subtler effect */}
                   <pattern id="errorHatch" patternUnits="userSpaceOnUse" width="8" height="8">
                      <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#fca5a5" strokeWidth="1" />
                   </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  hide={!showXAxis} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                {/* 
                  Ghost Target Area 
                  Highlights the deficit between the curve and target.
                  baseValue puts the baseline at comfortTemp.
                */}
                <Area
                  type="monotone"
                  dataKey="indoorTemp"
                  stroke="none"
                  fill="url(#errorHatch)" 
                  fillOpacity={0.3}
                  baseValue={comfortTemp}
                  isAnimationActive={false}
                />

                <ReferenceLine 
                  y={comfortTemp} 
                  stroke={useTargetAverage ? "#64748b" : "#fb923c"} 
                  strokeDasharray={useTargetAverage ? "5 5" : "3 3"} 
                  strokeWidth={useTargetAverage ? 2 : 1}
                  strokeOpacity={0.6} 
                />
                
                <Line 
                  type="monotone" 
                  dataKey="indoorTemp" 
                  stroke={color} 
                  strokeWidth={2.5} 
                  dot={false} 
                  animationDuration={300}
                />
                <Line 
                  type="monotone" 
                  dataKey="outdoorTemp" 
                  stroke="#cbd5e1" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />
              </ComposedChart>
            ) : (
              <AreaChart data={result.steps} syncId="heatingSync" margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  hide={!showXAxis} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="step" 
                  dataKey="powerInput" 
                  stroke={color} 
                  fill={color} 
                  fillOpacity={0.2}
                  strokeWidth={2}
                  animationDuration={300}
                />
              </AreaChart>
            )}
         </ResponsiveContainer>
      </div>

    </div>
  );
}

export default ResultsPanel;