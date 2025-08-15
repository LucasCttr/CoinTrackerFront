import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CryptoService } from './services/crypto-api.service';
import { FormattedCoin } from './interfaces/crypto.interface';


@Component({
  selector: 'app-dashboard',
  standalone: true, 
  imports: [
    // 
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
  private refreshIntervalId: any;
  
  // PROPIEDADES TIPADAS

  error: string | null = null;
  nextCursor: string | null = null;
  hasMore: boolean = true;
  coins$: Observable<FormattedCoin[]>;
  isLoadingLocal: boolean = false;  // Estado de carga local para bloquear multiples peticiones
  private destroy$ = new Subject<void>();
  private readonly PAGE_SIZE = 25;

  constructor(private cryptoService: CryptoService) {
    this.coins$ = this.cryptoService.loadedCoins$;
  }

  ngOnInit(): void {
    // Actualización automática cada minuto
    this.refreshIntervalId = setInterval(() => {
    }, 60000);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll, true);
    }
    this.loadMoreCoins();
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll, true);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }


  // CARGAR MÁS DATOS (SCROLL INFINITO)
  loadMoreCoins(): void {
    if (!this.hasMore || this.isLoadingLocal) return;
    this.isLoadingLocal = true;
    this.cryptoService.loadCoinsWithCursor(this.PAGE_SIZE, this.nextCursor).subscribe({
      next: (response) => {
        this.coins$ = this.cryptoService.loadedCoins$;
        this.nextCursor = response.nextCursor || null;
        this.hasMore = response.hasMore || false;
        this.isLoadingLocal = false;
      },
      error: (error) => {
        console.error('Error loading more coins:', error);
        this.isLoadingLocal = false;
      }
    });
  }


  // DETECTAR SCROLL AL FINAL DE LA VENTANA
  onWindowScroll = (): void => {
  if (!this.hasMore) return;
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= docHeight - 100) {
      this.loadMoreCoins();
    }
  };

  // TRACK BY FUNCTION PARA PERFORMANCE
  trackByCoinId(index: number, coin: FormattedCoin): string {
    return coin.id;
  }

  onCoinClick(coin: FormattedCoin): void {
    console.log('🔍 Coin seleccionada:', coin);
    // TODO: Navegar a detalle de la coin
  }

}
