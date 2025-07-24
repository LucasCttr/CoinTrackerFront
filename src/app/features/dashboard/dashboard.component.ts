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
  
  private destroy$ = new Subject<void>();

  constructor(private cryptoService: CryptoService) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard inicializando...');
    this.loadCoins();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔥 CARGAR DATOS
  loadCoins(): void {
    console.log('🔄 Cargando coins...');
    
    this.cryptoService.loadInitialCoins(10)
      .pipe(
        tap(() => console.log('✅ Datos cargados del servidor')),
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error cargando datos:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: () => {
          // Después de cargar, suscribirse a los datos formateados
          this.subscribeToFormattedCoins();
        },
        error: (error) => {
          console.error('❌ Error cargando datos:', error);
          this.error = error.message || 'Error cargando datos';
        }
      });
  }

  // 🔥 SUSCRIBIRSE A DATOS FORMATEADOS
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

  // 🔥 TRACK BY FUNCTION PARA PERFORMANCE
  trackByCoinId(index: number, coin: FormattedCoin): string {
    return coin.id;
  }

  // 🔥 EVENTO HANDLERS
  onRefresh(): void {
    console.log('🔄 Refrescando datos...');
    this.loadCoins();
  }

  onCoinClick(coin: FormattedCoin): void {
    console.log('🔍 Coin seleccionada:', coin);
    // TODO: Navegar a detalle de la coin
  }
}

