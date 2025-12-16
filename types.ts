
export enum HouseType {
  FLAT = 'Flat',
  TERRACED = 'Terraced',
  SEMI_DETACHED = 'Semi-Detached',
  DETACHED = 'Detached',
}

export enum BuildEra {
  PRE_1930 = 'Pre-1930',
  ERA_1930_1980 = '1930-1980',
  ERA_1980_2000 = '1980-2000',
  ERA_2000_2015 = '2000-2015',
  POST_2015 = '2015+',
}

export enum HeatingSource {
  GAS_BOILER = 'Gas Boiler',
  HEAT_PUMP = 'Air Source Heat Pump',
  OIL_BOILER = 'Oil Boiler',
  ELECTRIC = 'Electric Resistance',
}

export enum EmitterType {
  RADIATORS = 'Radiators',
  UNDERFLOOR = 'Underfloor Heating',
}

export enum StrategyType {
  ALWAYS_ON = 'Constant (24/7)',
  SETBACK = 'Setback Schedule',
  TIMED = 'Timed On/Off',
}

export enum WeatherPreset {
  MILD = 'Mild Winter (8°C)',
  COLD = 'Typical Winter (4°C)',
  FREEZING = 'Cold Snap (-2°C)',
}

export interface HouseConfig {
  type: HouseType;
  sizeMultiplier: number; // 0.8 (small) to 1.5 (large)
  era: BuildEra;
  draughtiness: number; // 0 (airtight) to 1 (leaky)
  thermalMass: number; // 0 (light) to 1 (heavy)
}

export interface SystemConfig {
  source: HeatingSource;
  emitter: EmitterType;
  maxPower: number; // kW (Output Capacity)
}

export interface StrategyConfig {
  type: StrategyType;
  comfortTemp: number;
  setbackTemp: number; // Used for Setback strategy
  activeHours: { start: number; end: number }[]; // For Setback/Timed. e.g. 06:00-09:00, 16:00-23:00
}

export interface SimulationStep {
  time: string; // HH:MM
  minutes: number;
  outdoorTemp: number;
  indoorTemp: number;
  targetTemp: number;
  powerInput: number; // kW
  energyConsumed: number; // kWh (cumulative)
  isHeating: boolean;
}

export interface SimulationResult {
  steps: SimulationStep[];
  totalEnergy: number; // kWh
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  hoursBelowComfort: number;
  recoveryTimeMinutes: number; // Approx time to reach comfort in morning
}
