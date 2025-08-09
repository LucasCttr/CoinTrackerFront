import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {
  CoinResponse,
  PaginatedCoins,
  FormattedCoin,
  CoinSearchParams,
  ApiResponse,
  InfiniteScrollResponse
} from '../interfaces/crypto.interface';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  
  private readonly API_URL = 'http://localhost:5004/api/coins';
  
  // ESTADO TIPADO
  private allCoinsSubject = new BehaviorSubject<CoinResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Observables públicos tipados
  public allCoins$: Observable<CoinResponse[]> = this.allCoinsSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

    // 🔥 MÉTODO PARA PAGINACIÓN INFINITA
    loadCoinsWithCursor(limit: number = 20, cursor: string | null = null): Observable<InfiniteScrollResponse<CoinResponse>> {
      this.setLoading(true);
      this.clearError();
      let httpParams = new HttpParams()
        .set('limit', limit.toString());
      if (cursor) {
        httpParams = httpParams.set('cursor', cursor);
      }
      return this.http.get<InfiniteScrollResponse<CoinResponse>>(this.API_URL, { params: httpParams })
        .pipe(
          tap(response => {
            // No actualiza el BehaviorSubject, solo retorna los datos
            console.log('🔍 InfiniteScroll response:', response);
          }),
          catchError(error => this.handleError(error)),
          tap(() => this.setLoading(false))
        );
    }

  // MÉTODO PRINCIPAL TIPADO
  loadInitialCoins(pageSize: number = 30): Observable<ApiResponse> {
    console.log('🔄 Cargando página inicial...');
    
    this.setLoading(true);
    this.clearError();
    
    let httpParams = new HttpParams()
      .set('page', '1')
      .set('pageSize', pageSize.toString());
    
    return this.http.get<ApiResponse>(this.API_URL, { params: httpParams })
      .pipe(
        tap(response => {
          console.log('🔍 Respuesta del servidor:', response);
          
          // VALIDAR ESTRUCTURA CON TYPESCRIPT
          if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Formato de respuesta inválido: falta data array');
          }
          
          const coins: CoinResponse[] = response.data;
          console.log(`✅ ${coins.length} coins cargadas`);
          
          // Actualizar estado
          this.allCoinsSubject.next(coins);
        }),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  // FORMATEO TIPADO
  getFormattedCoins(): Observable<FormattedCoin[]> {
    return this.allCoins$.pipe(
      map((coins: CoinResponse[]) => {
        console.log('🔄 Formateando', coins.length, 'coins...');
        
        if (coins.length === 0) {
          return [];
        }
        
        const formatted: FormattedCoin[] = coins.map((coin, index) => {
          // LOG DE LA PRIMERA COIN
          if (index === 0) {
            console.log('🔍 Primera coin RAW:', coin);
            console.log('🔍 current_price:', coin.current_price);
            console.log('🔍 price_change_percentage_24h:', coin.price_change_percentage_24h);
          }
          
          // USAR LOS CAMPOS CORRECTOS (snake_case del backend)
          const price = coin.current_price ?? 0;
          const priceChange = coin.price_change_percentage_24h ?? 0;
          
          const formattedCoin: FormattedCoin = {
            // MAPEO EXPLÍCITO DE CAMPOS
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            currentPrice: price,                           // snake_case -> camelCase
            priceChangePercentage24h: priceChange,         // snake_case -> camelCase
            marketCapRank: coin.market_cap_rank ?? (index + 1), // snake_case -> camelCase
            
            // CAMPOS FORMATEADOS
            formattedPrice: this.formatCurrency(price),
            formattedPercentage: this.formatPercentage(priceChange),
            priceChangeClass: priceChange >= 0 ? 'positive' : 'negative',
            symbolUppercase: coin.symbol.toUpperCase(),
            
            // CAMPOS ADICIONALES MAPEADOS
            marketCap: coin.market_cap ?? 0,
            totalVolume: coin.total_volume ?? 0,
            high24h: coin.high_24h ?? 0,
            low24h: coin.low_24h ?? 0,
            priceChange24h: coin.price_change_24h ?? 0
          };
          
          // Log de la primera coin formateada
          if (index === 0) {
            console.log('🔍 Primera coin FORMATEADA:', formattedCoin);
          }
          
          return formattedCoin;
        });
        
        console.log('✅ Formateado completado');
        return formatted;
      })
    );
  }

  // GETTERS TIPADOS
  get allCoins(): CoinResponse[] {
    return this.allCoinsSubject.value;
  }
  
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
  
  get totalCoinsLoaded(): number {
    return this.allCoins.length;
  }

  // MÉTODOS PRIVADOS TIPADOS
  private formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: value >= 1 ? 2 : 6
      }).format(value);
    } catch (error) {
      console.warn('⚠️ Error formateando moneda:', error);
      return `$${value.toFixed(2)}`;
    }
  }

  private formatPercentage(value: number): string {
    if (!value && value !== 0) return '0.00%';
    
    try {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    } catch (error) {
      console.warn('⚠️ Error formateando porcentaje:', error);
      return '0.00%';
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400: errorMessage = 'Parámetros inválidos'; break;
        case 404: errorMessage = 'No se encontraron más datos'; break;
        case 500: errorMessage = 'Error del servidor'; break;
        default: errorMessage = `Error ${error.status}`;
      }
    }
    
    console.error('❌ Error en CryptoService:', errorMessage);
    this.errorSubject.next(errorMessage);
    this.setLoading(false);
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }
}
