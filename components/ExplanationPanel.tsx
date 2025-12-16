import React from 'react';
import { EmitterType, HeatingSource, HouseConfig, SimulationResult, StrategyConfig, StrategyType, SystemConfig } from '../types';
import { Lightbulb, Trophy, AlertTriangle, TrendingDown } from 'lucide-react';

interface Props {
  results: Record<StrategyType, SimulationResult>;
  house: HouseConfig;
  system: SystemConfig;
  strategyParams: StrategyConfig;
  useTargetAverage: boolean;
}

const ExplanationPanel: React.FC<Props> = ({ results, house, system, strategyParams, useTargetAverage }) => {

  const alwaysOn = results[StrategyType.ALWAYS_ON];
  const setback = results[StrategyType.SETBACK];
  const timed = results[StrategyType.TIMED];

  // Helper metrics
  const timedSavings = alwaysOn.totalEnergy - timed.totalEnergy;
  const timedSavingsPct = (timedSavings / alwaysOn.totalEnergy) * 100;
  
  const setbackSavings = alwaysOn.totalEnergy - setback.totalEnergy;
  const setbackSavingsPct = (setbackSavings / alwaysOn.totalEnergy) * 100;

  const recoveryTimeTimed = timed.recoveryTimeMinutes;
  const isSlowRecovery = recoveryTimeTimed > 90;
  const isHeatPump = system.source === HeatingSource.HEAT_PUMP;
  const isUFH = system.emitter === EmitterType.UNDERFLOOR;
  const isLeaky = house.draughtiness > 0.6;

  // Recommendation Logic
  let recommendation = "";
  let reason = "";
  let bestStrategy = "";

  if (useTargetAverage) {
     // --- TARGET AVERAGE MODE LOGIC ---
     // Goal: Maintain specific average. 
     // Physics: It is almost always more efficient to maintain steady state than to 'pulse and glide' to reach the same average.
     bestStrategy = "Constant";
     recommendation = "Use Constant (Always On).";
     reason = "When targeting a specific Average Temperature, 'Always On' is the most efficient strategy. To achieve the same average with a Timed schedule, you are forced to overheat the house during the day to compensate for the cold night. This 'Pulse and Glide' approach forces your heating system to work harder (reducing efficiency) and drives higher heat loss during the peak temperature periods compared to maintaining a steady, lower background warmth.";
  } else {
    // --- SETPOINT / COMFORT MODE LOGIC ---
    // Goal: Comfort only when home.
    // Physics: Off periods usually save energy.
    if (isSlowRecovery) {
      // If it takes too long to warm up, Setback or Always On is preferred
      if (setback.recoveryTimeMinutes < 60 && setbackSavingsPct > 5) {
          bestStrategy = "Setback";
          recommendation = "Use the Setback Strategy.";
          reason = "The Timed strategy lets the house cool too much, causing a very long warm-up. Setback maintains a baseline temperature, allowing for faster recovery while still saving energy.";
      } else {
          bestStrategy = "Constant";
          recommendation = "Consider Constant (Always On) or a very shallow Setback.";
          reason = "Your system struggles to recover from cold states. Keeping the heating on ensures comfort, even if it costs slightly more.";
      }
    } else {
      // Fast recovery? Go for savings.
      if (timedSavingsPct > 15) {
          bestStrategy = "Timed";
          recommendation = "Use the Timed Strategy.";
          reason = `You can save ${Math.round(timedSavingsPct)}% energy with minimal comfort penalty because your home heats up quickly.`;
      } else {
          bestStrategy = "Setback";
          recommendation = "Use the Setback Strategy.";
          reason = "It offers a balanced trade-off between energy savings and consistent comfort.";
      }
    }
  }

  // Determine styles based on best strategy
  const getBadgeColor = () => {
      if (bestStrategy === "Timed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
      if (bestStrategy === "Setback") return "bg-blue-100 text-blue-800 border-blue-200";
      return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
                <Lightbulb size={20} className="text-yellow-600" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Analysis & Recommendation</h3>
                <p className="text-xs text-slate-500">Based on your house physics</p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 ${getBadgeColor()}`}>
            <Trophy size={14} />
            Best Choice: {bestStrategy}
          </div>
      </div>
      
      <p className="text-slate-700 text-sm leading-relaxed mb-4">
        {recommendation} {reason}
      </p>

      {/* Warnings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Recovery Warning (Only for Comfort Mode) */}
          {!useTargetAverage && isSlowRecovery && (
            <div className="flex gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertTriangle className="text-red-500 shrink-0" size={18} />
                <div className="text-xs text-red-900 leading-snug">
                    <strong>Slow Warm-Up:</strong> It takes {Math.floor(recoveryTimeTimed/60)}h {recoveryTimeTimed%60}m to reach comfort in Timed mode. {isUFH && "Underfloor heating is slow to respond."} {isHeatPump && !isUFH && "Heat pumps work best maintaining steady temperatures."}
                </div>
            </div>
          )}

          {/* Efficiency Warning (Always relevant if Leaky) */}
          {isLeaky && (
             <div className="flex gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100">
                <TrendingDown className="text-orange-500 shrink-0" size={18} />
                <div className="text-xs text-orange-900 leading-snug">
                    <strong>High Heat Loss:</strong> In a draughty home, 'Always On' is expensive because you are constantly heating air that escapes immediately.
                </div>
             </div>
          )}

           {/* Savings Highlight (Only for Comfort Mode) */}
           {!useTargetAverage && !isSlowRecovery && (
             <div className="flex gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                <TrendingDown className="text-green-600 shrink-0" size={18} />
                <div className="text-xs text-green-900 leading-snug">
                    <strong>Potential Savings:</strong> Switching from Always On to Timed saves {timedSavings.toFixed(1)} kWh/day ({Math.round(timedSavingsPct)}%).
                </div>
             </div>
          )}

      </div>
    </div>
  );
};

export default ExplanationPanel;