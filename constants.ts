
import { BuildEra, HouseType, HeatingSource, WeatherPreset } from './types';

// Base Heat Loss Coefficient (Watts per Kelvin) roughly scaled by Era
// Widened range to make simulation differences more obvious
export const ERA_U_VALUES: Record<BuildEra, number> = {
  [BuildEra.PRE_1930]: 420,  // Was 350 - Leaky/Solid walls
  [BuildEra.ERA_1930_1980]: 300, // Was 280
  [BuildEra.ERA_1980_2000]: 200,
  [BuildEra.ERA_2000_2015]: 110, // Was 120
  [BuildEra.POST_2015]: 60,   // Was 80 - Very airtight
};

// Surface Area Multiplier / Form Factor
export const HOUSE_TYPE_FACTOR: Record<HouseType, number> = {
  [HouseType.FLAT]: 0.7,
  [HouseType.TERRACED]: 0.85,
  [HouseType.SEMI_DETACHED]: 1.0,
  [HouseType.DETACHED]: 1.3, // Slightly increased to punish detached more
};

// Thermal Mass Base (Joules per Kelvin)
export const BASE_THERMAL_MASS = 8000000; 

// Heating System Specs (kW Output)
export const HEATING_SYSTEM_SPECS: Record<HeatingSource, { default: number; min: number; max: number }> = {
  [HeatingSource.GAS_BOILER]: { default: 24, min: 8, max: 40 },
  [HeatingSource.OIL_BOILER]: { default: 20, min: 10, max: 35 },
  [HeatingSource.HEAT_PUMP]: { default: 8, min: 3, max: 18 },
  [HeatingSource.ELECTRIC]: { default: 12, min: 3, max: 24 },
};

export const WEATHER_PROFILES: Record<WeatherPreset, { min: number; max: number }> = {
  [WeatherPreset.MILD]: { min: 7, max: 11 },
  [WeatherPreset.COLD]: { min: 1, max: 6 },
  [WeatherPreset.FREEZING]: { min: -5, max: -1 },
};

// Standard Schedule: 06:00-09:00 and 16:00-22:00
export const DEFAULT_SCHEDULE = [
  { start: 6, end: 9 },
  { start: 16, end: 22.5 },
];
