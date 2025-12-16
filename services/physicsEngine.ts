
import { 
  HouseConfig, 
  SystemConfig, 
  StrategyConfig, 
  SimulationResult, 
  SimulationStep, 
  StrategyType, 
  HeatingSource, 
  EmitterType,
  WeatherPreset
} from '../types';
import { ERA_U_VALUES, HOUSE_TYPE_FACTOR, BASE_THERMAL_MASS, WEATHER_PROFILES } from '../constants';

// Internal function to run a single pass
const runSingleSimulation = (
  house: HouseConfig,
  system: SystemConfig,
  strategy: StrategyConfig,
  weather: WeatherPreset,
  overrideComfortTemp?: number
): SimulationResult => {
  
  // 1. Setup Physics Parameters
  
  let HLC = ERA_U_VALUES[house.era] * HOUSE_TYPE_FACTOR[house.type] * house.sizeMultiplier;
  
  // Draughtiness effect increased
  HLC = HLC * (1 + (house.draughtiness * 0.6));

  const massMultiplier = 0.6 + (house.thermalMass * 1.2);
  const thermalMass = BASE_THERMAL_MASS * house.sizeMultiplier * massMultiplier;

  // System Characteristics
  // NOTE: We now use the explicit slider value for maxPower. 
  // We DO NOT multiply by house size anymore. 
  // This allows simulating undersized systems on large houses.
  let maxSystemPower = system.maxPower; 
  
  let rampRateKwPerMin = 0.5; // Default

  // Source Base Response
  switch (system.source) {
    case HeatingSource.ELECTRIC: 
        rampRateKwPerMin = 2.0; 
        break;
    case HeatingSource.GAS_BOILER:
    case HeatingSource.OIL_BOILER:
        rampRateKwPerMin = 0.8; 
        break;
    case HeatingSource.HEAT_PUMP:
        rampRateKwPerMin = 0.25; 
        // We no longer arbitrarily reduce maxPower here by 0.7 
        // because the slider value is the "Rated Capacity".
        break;
  }

  // Emitter Penalty
  if (system.emitter === EmitterType.UNDERFLOOR) {
    rampRateKwPerMin *= 0.2; 
  }

  // Weather Profile generator
  const getOutdoorTemp = (hour: number) => {
    const profile = WEATHER_PROFILES[weather];
    // Peak temperature usually around 14:00 (2 PM)
    const normalizedTime = (hour - 14) / 24 * Math.PI * 2;
    const range = (profile.max - profile.min) / 2;
    const avg = (profile.max + profile.min) / 2;
    
    // Cosine of 0 is 1. So at hour 14, we add range to avg (Max Temp).
    return avg + (Math.cos(normalizedTime) * range); 
  };

  // 2. Simulation Loop
  const steps: SimulationStep[] = [];
  let currentTemp = 18; 
  let cumulativeEnergy = 0; 
  let currentPowerOutput = 0; 
  
  let minTemp = 100;
  let maxTemp = -100;
  let hoursBelowComfort = 0;
  let recoveryTimeMinutes = 0;

  const stepSizeMinutes = 5;
  const stepsPerDay = (24 * 60) / stepSizeMinutes;
  
  // Use override if provided (for iterative solver)
  const effectiveComfortTemp = overrideComfortTemp ?? strategy.comfortTemp;

  // Simulation runs from 00:00 to 23:55
  for (let i = 0; i < stepsPerDay; i++) {
    const timeOfDayHours = (i * stepSizeMinutes) / 60;
    const outdoorTemp = getOutdoorTemp(timeOfDayHours);
    
    // Determine Target Temp
    let targetTemp = effectiveComfortTemp;
    let isScheduledOn = true;

    if (strategy.type === StrategyType.ALWAYS_ON) {
      targetTemp = effectiveComfortTemp;
    } else {
      const inSchedule = strategy.activeHours.some(window => 
        timeOfDayHours >= window.start && timeOfDayHours < window.end
      );
      
      if (inSchedule) {
        targetTemp = effectiveComfortTemp;
      } else {
        isScheduledOn = false;
        if (strategy.type === StrategyType.SETBACK) {
          targetTemp = strategy.setbackTemp;
        } else {
          targetTemp = -10; // Off
        }
      }
    }

    // Determine Heat Input Need (Proportional Control)
    let desiredPower = 0;
    if (currentTemp < targetTemp) {
      const error = targetTemp - currentTemp;
      const Kp = 5; 
      desiredPower = error * Kp;
    } else {
      desiredPower = 0;
    }

    // Cap at system max (adjusting for Heat Pump outdoor temp efficiency)
    let effectiveMaxPower = maxSystemPower;
    if (system.source === HeatingSource.HEAT_PUMP) {
        // Physical derating of Air Source Heat Pumps in cold weather
        // Assuming rated capacity is at 7C.
        if (outdoorTemp < -2) effectiveMaxPower *= 0.65;
        else if (outdoorTemp < 2) effectiveMaxPower *= 0.75;
        else if (outdoorTemp < 5) effectiveMaxPower *= 0.85;
    }

    desiredPower = Math.min(desiredPower, effectiveMaxPower);
    
    // Apply Ramp Rate Logic
    const maxChange = rampRateKwPerMin * stepSizeMinutes;
    
    if (desiredPower > currentPowerOutput) {
      currentPowerOutput = Math.min(currentPowerOutput + maxChange, desiredPower);
    } else {
      currentPowerOutput = Math.max(currentPowerOutput - maxChange, desiredPower);
    }
    
    // Physics Step
    const seconds = stepSizeMinutes * 60;
    const energyInputJoules = (currentPowerOutput * 1000) * seconds;
    const lossWatts = HLC * (currentTemp - outdoorTemp);
    const energyLossJoules = lossWatts * seconds;

    const netEnergy = energyInputJoules - energyLossJoules;
    const tempChange = netEnergy / thermalMass;

    currentTemp += tempChange;

    // Metrics
    cumulativeEnergy += (currentPowerOutput * stepSizeMinutes) / 60;
    if (currentTemp < minTemp) minTemp = currentTemp;
    if (currentTemp > maxTemp) maxTemp = currentTemp;
    
    // Hours Below Comfort (only count when we WANT to be comfortable)
    const isComfortTime = strategy.type === StrategyType.ALWAYS_ON || isScheduledOn;
    // Note: We compare against the actual user strategy comfort temp, not the boosted internal one
    if (isComfortTime && currentTemp < strategy.comfortTemp - 0.5) {
      hoursBelowComfort += (stepSizeMinutes / 60);
    }

    // Recovery Calculation (Morning: 05:00 to 11:00)
    if (strategy.type !== StrategyType.ALWAYS_ON && timeOfDayHours >= 5 && timeOfDayHours < 11) {
       if (isScheduledOn) {
          if (currentTemp < strategy.comfortTemp - 0.5) {
             recoveryTimeMinutes += stepSizeMinutes;
          }
       }
    }

    const hourInt = Math.floor(timeOfDayHours);
    const minuteInt = Math.floor((timeOfDayHours - hourInt) * 60);
    const timeStr = `${hourInt.toString().padStart(2, '0')}:${minuteInt.toString().padStart(2, '0')}`;

    steps.push({
      time: timeStr,
      minutes: i * stepSizeMinutes,
      outdoorTemp,
      indoorTemp: currentTemp,
      targetTemp: targetTemp > -5 ? targetTemp : 0, 
      powerInput: currentPowerOutput,
      energyConsumed: cumulativeEnergy,
      isHeating: currentPowerOutput > 0.1
    });
  }

  const avgTemp = steps.reduce((acc, s) => acc + s.indoorTemp, 0) / steps.length;

  return {
    steps,
    totalEnergy: cumulativeEnergy,
    avgTemp,
    minTemp,
    maxTemp,
    hoursBelowComfort,
    recoveryTimeMinutes
  };
};

// Wrapper export that handles the Target Average logic
export const runSimulation = (
  house: HouseConfig,
  system: SystemConfig,
  strategy: StrategyConfig,
  weather: WeatherPreset,
  targetAverageMode: boolean = false
): SimulationResult => {
  
  if (!targetAverageMode) {
    return runSingleSimulation(house, system, strategy, weather);
  }

  // Iterative Solver for Target Average
  // We want finding setpoint T_set such that Result(T_set).avgTemp = strategy.comfortTemp
  
  const targetAverage = strategy.comfortTemp;
  let currentSetpoint = targetAverage; 
  let iterations = 0;
  const maxIterations = 12; // Increased from 8 to allow better convergence
  const tolerance = 0.1;

  let result = runSingleSimulation(house, system, strategy, weather, currentSetpoint);

  while (iterations < maxIterations) {
    const diff = targetAverage - result.avgTemp;
    
    if (Math.abs(diff) < tolerance) break;
    
    // Adjustment gain. 
    // If we are below target, we need to raise setpoint.
    // If the heating is only on 50% of the time, we might need 2x the diff in setpoint adjustment.
    // A gain of 1.5 is a safe conservative start to avoid oscillation.
    const gain = 1.5;
    currentSetpoint += diff * gain;

    // Safety clamps
    if (currentSetpoint > 45) currentSetpoint = 45;
    if (currentSetpoint < targetAverage) currentSetpoint = targetAverage; // Shouldn't need to go below target

    result = runSingleSimulation(house, system, strategy, weather, currentSetpoint);
    iterations++;
  }

  return result;
};
