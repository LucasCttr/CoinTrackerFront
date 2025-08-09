import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// 🔥 IMPORTS DE ANGULAR MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CryptoService } from './services/crypto-api.service';
import { FormattedCoin } from './interfaces/crypto.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true, // 🔥 Esto hace que sea standalone
  imports: [
    // 🔥 AQUÍ VAN TODOS LOS MÓDULOS QUE NECESITAS
    CommonModule,           // Para *ngIf, *ngFor, pipes, etc.
    MatIconModule,          // Para <mat-icon>
    MatButtonModule,        // Para mat-button, mat-icon-button
    MatCardModule,          // Para <mat-card>
    MatProgressSpinnerModule, // Para <mat-spinner>
    MatTooltipModule        // Para matTooltip
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  // 🔥 PROPIEDADES TIPADAS
  coins: FormattedCoin[] = [];
  isLoading = false;
  error: string | null = null;
  nextCursor: string | null = null;
  hasMore: boolean = true;
  private destroy$ = new Subject<void>();
  private readonly PAGE_SIZE = 10;

  constructor(private cryptoService: CryptoService) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard inicializando...');
    this.loadInitialCoins();
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll, true);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll, true);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CARGAR DATOS INICIALES
  loadInitialCoins(): void {
    this.isLoading = true;
    this.cryptoService.loadCoinsWithCursor(this.PAGE_SIZE, null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.coins = response.data.map(c => this.formatCoin(c));
          this.nextCursor = response.nextCursor ?? null;
          this.hasMore = response.hasMore;
          this.isLoading = false;
          this.error = null;
        },
        error: (error) => {
          this.error = error.message || 'Error cargando datos';
          this.isLoading = false;
        }
      });
  }

  // CARGAR MÁS DATOS (SCROLL INFINITO)
  loadMoreCoins(): void {
    if (!this.hasMore || this.isLoading || !this.nextCursor) return;
    this.isLoading = true;
    this.cryptoService.loadCoinsWithCursor(this.PAGE_SIZE, this.nextCursor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const nuevos = response.data.map(c => this.formatCoin(c));
          this.coins = [...this.coins, ...nuevos];
          this.nextCursor = response.nextCursor ?? null;
          this.hasMore = response.hasMore;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message || 'Error cargando datos';
          this.isLoading = false;
        }
      });
  }

  // DETECTAR SCROLL AL FINAL DE LA VENTANA
  onWindowScroll = (): void => {
    if (!this.hasMore || this.isLoading) return;
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= docHeight - 100) {
      this.loadMoreCoins();
    }
  };

  // FORMATEAR COIN RAW A FormattedCoin
  private formatCoin(coin: any): FormattedCoin {
    // Puedes usar el mismo mapeo que tienes en getFormattedCoins del servicio
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price ?? 0,
      priceChangePercentage24h: coin.price_change_percentage_24h ?? 0,
      marketCapRank: coin.market_cap_rank ?? 0,
      formattedPrice: this.formatCurrency(coin.current_price ?? 0),
      formattedPercentage: this.formatPercentage(coin.price_change_percentage_24h ?? 0),
      priceChangeClass: (coin.price_change_percentage_24h ?? 0) >= 0 ? 'positive' : 'negative',
      symbolUppercase: coin.symbol?.toUpperCase() ?? '',
      marketCap: coin.market_cap ?? 0,
      totalVolume: coin.total_volume ?? 0,
      high24h: coin.high_24h ?? 0,
      low24h: coin.low_24h ?? 0,
      priceChange24h: coin.price_change_24h ?? 0
    };
  }

  private formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: value >= 1 ? 2 : 6
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  }

  private formatPercentage(value: number): string {
    if (!value && value !== 0) return '0.00%';
    try {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    } catch {
      return '0.00%';
    }
  }

  // SUSCRIBIRSE A DATOS FORMATEADOS
  private subscribeToFormattedCoins(): void {
    this.cryptoService.getFormattedCoins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (formattedCoins) => {
          console.log('✅ Datos formateados recibidos:', formattedCoins.length);
          this.coins = formattedCoins;
          this.error = null;
        },
        error: (error) => {
          console.error('❌ Error en datos formateados:', error);
          this.error = 'Error procesando datos';
        }
      });

    // Suscribirse al estado de loading
    this.cryptoService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Suscribirse a errores
    this.cryptoService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
      });
  }

  // TRACK BY FUNCTION PARA PERFORMANCE
  trackByCoinId(index: number, coin: FormattedCoin): string {
    return coin.id;
  }

  // EVENTO HANDLERS
  onRefresh(): void {
    console.log('🔄 Refrescando datos...');
    this.coins = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.loadInitialCoins();
  }

  onCoinClick(coin: FormattedCoin): void {
    console.log('🔍 Coin seleccionada:', coin);
    // TODO: Navegar a detalle de la coin
  }
}

