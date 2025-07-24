// 🔥 1. DATOS RAW DEL BACKEND (snake_case como viene del servidor)
export interface CoinResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;                    // 🔥 snake_case
  price_change_percentage_24h: number;      // 🔥 snake_case
  market_cap_rank: number;                  // 🔥 snake_case
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  fully_diluted_valuation: number | null;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
}

// 🔥 2. RESPUESTA PAGINADA DEL BACKEND (coincide con tu backend)
export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;        // 🔥 Tu backend usa "totalItems" no "totalCount"
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 🔥 3. DATOS FORMATEADOS PARA LA UI (camelCase para frontend)
export interface FormattedCoin {
  // Campos originales mapeados
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;                     // 🔥 Mapeado de current_price
  priceChangePercentage24h: number;         // 🔥 Mapeado de price_change_percentage_24h
  marketCapRank: number;                    // 🔥 Mapeado de market_cap_rank
  
  // Campos formateados para UI
  formattedPrice: string;                   // "$3,636.01"
  formattedPercentage: string;              // "-2.69%"
  priceChangeClass: 'positive' | 'negative'; // Para CSS
  symbolUppercase: string;                  // "ETH"
  
  // Campos adicionales útiles
  marketCap: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
}

// 🔥 4. ALIASES ÚTILES
export type PaginatedCoins = PaginatedResponse<CoinResponse>;
export type CoinList = CoinResponse[];
export type FormattedCoinList = FormattedCoin[];

// 🔥 5. PARÁMETROS DE BÚSQUEDA/FILTRADO
export interface CoinSearchParams {
  page?: number;
  pageSize?: number;
  sortBy?: 'marketCapRank' | 'currentPrice' | 'priceChangePercentage24h' | 'name';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// 🔥 6. RESPUESTA DE LA API (para el HTTP client)
export interface ApiResponse {
  data: CoinResponse[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}