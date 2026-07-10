export interface Country {
  id: number;
  countryCode: string;
  sourceNameCommon: string;
  cca2: string;
  cca3: string;
  ccn3: string;
  callingCode: string;
  nameCommon: string;
  nameOfficial: string;
  region: string;
  subregion: string;
  capital: string[];
  population: number;
  area: number;
  flagEmoji: string;
  flagPng: string;
  currencies: Record<string, unknown>;
  languages: Record<string, string>;
  independent: boolean;
  unMember: boolean;
  updatedAt: string;
}

export interface CountryListResponse {
  code: number;
  message: string;
  data: Country[];
  total: number;
}

export interface CountrySyncSummary {
  reason: string;
  startedAt: string;
  finishedAt: string;
  inserted: number;
  updated: number;
  unchanged: number;
  removed: number;
  totalRemote: number;
  success: boolean;
  error?: string;
}

export interface CountrySyncResponse {
  code: number;
  message: string;
  data: CountrySyncSummary;
}

export interface CountrySyncRunsResponse {
  code: number;
  message: string;
  data: CountrySyncSummary[];
}

export interface CountryUpdateDisplayNameResponse {
  code: number;
  message: string;
  data: Country;
}
