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
  InfiniteScrollResponse,
} from '../interfaces/crypto.interface';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private readonly API_URL = 'http://localhost:5004/api/coins';

  
  // Observables públicos tipados
  public loadedCoins$ = new BehaviorSubject<FormattedCoin[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // MÉTODO PARA PAGINACIÓN INFINITA
  loadCoinsWithCursor(
    limit: number = 25,
    cursor: string | null = null
  ): Observable<InfiniteScrollResponse<CoinResponse>> {
    this.setLoading(true);
    this.clearError();
    let httpParams = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      httpParams = httpParams.set('cursor', cursor);
    }
    return this.http
      .get<InfiniteScrollResponse<CoinResponse>>(this.API_URL, {
        params: httpParams,
      })
      .pipe(
        tap((response) => {
          console.log('Respuesta del servidor (infinite scroll):', response);
          const nuevos = response.data.map((c) => this.formatCoin(c));
          const actuales = this.loadedCoins$.getValue();
          this.loadedCoins$.next([...actuales, ...nuevos]);
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  // FORMATEO TIPADO
  private formatCoin(coin: CoinResponse): FormattedCoin {
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price ?? 0,
      priceChangePercentage24h: coin.price_change_percentage_24h ?? 0,
      marketCapRank: coin.market_cap_rank ?? 0,
      formattedPrice: this.formatCurrency(coin.current_price ?? 0),
      formattedPercentage: this.formatPercentage(
        coin.price_change_percentage_24h ?? 0
      ),
      priceChangeClass:
        (coin.price_change_percentage_24h ?? 0) >= 0 ? 'positive' : 'negative',
      symbolUppercase: coin.symbol?.toUpperCase() ?? '',
      marketCap: coin.market_cap ?? 0,
      totalVolume: coin.total_volume ?? 0,
      high24h: coin.high_24h ?? 0,
      low24h: coin.low_24h ?? 0,
      priceChange24h: coin.price_change_24h ?? 0,
    };
  }

  // MÉTODOS PRIVADOS TIPADOS
  private formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: value >= 1 ? 2 : 6,
      }).format(value);
    } catch (error) {
      console.warn('Error formateando moneda:', error);
      return `$${value.toFixed(2)}`;
    }
  }

  private formatPercentage(value: number): string {
    if (!value && value !== 0) return '0.00%';

    try {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    } catch (error) {
      console.warn('Error formateando porcentaje:', error);
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
        case 400:
          errorMessage = 'Parámetros inválidos';
          break;
        case 404:
          errorMessage = 'No se encontraron más datos';
          break;
        case 500:
          errorMessage = 'Error del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}`;
      }
    }
    this.errorSubject.next(errorMessage);
    console.error('rror en CryptoService:', errorMessage);
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
