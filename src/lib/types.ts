export interface ApartmentConfig {
  name: string;
  complexNo: number;
  /** 표시용 짧은 이름 */
  shortName: string;
}

export interface Listing {
  articleNo: string;
  dealOrWarrantPrc: string;
  areaName: string;
  area1: number; // 공급면적
  area2: number; // 전용면적
  floorInfo: string;
  articleConfirmYmd: string;
  articleName: string;
  tradeTypeName: string;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
  totalCount: number;
  minPrice: number; // 만원 단위
  maxPrice: number;
  avgPrice: number;
  listings: Pick<Listing, 'dealOrWarrantPrc' | 'area2' | 'floorInfo'>[];
}

export interface ApartmentData {
  complexNo: number;
  name: string;
  snapshots: DailySnapshot[];
}

export interface ListingsData {
  lastUpdated: string;
  apartments: ApartmentData[];
}
