import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider'; 
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service'; 
import { User } from '../../../shared/models/user.interface'; 
import { AuthModalComponent } from '../../../features/auth/components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-global-header',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule, 
    CommonModule
  ],
  templateUrl: './global-header.component.html',
  styleUrls: ['./global-header.component.css']
})
export class GlobalHeaderComponent implements OnInit, OnDestroy {
  
  // ========================================
  // PROPIEDADES REACTIVAS
  // ========================================
  
  currentUser: User | null = null;
  isAuthenticated = false;
  isLoading = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService 
  ) {}
  
  ngOnInit(): void {
    this.subscribeToAuthState();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ========================================
  // SUSCRIPCIÓN AL ESTADO DE AUTH
  // ========================================
  
  private subscribeToAuthState(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        console.log('🔍 Usuario actual en header:', user);
      });
    

    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        console.log('🔍 Estado de autenticación:', isAuth);
      });
    
    this.authService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }
  
  // ========================================
  // MÉTODOS DE NAVEGACIÓN
  // ========================================
  
  navigateHome(): void {
    this.router.navigate(['/']);
  }
  
  navigateToPortfolio(): void {
    this.router.navigate(['/portfolio']);
  }
  
  navigateToMarket(): void {
    this.router.navigate(['/market']);
  }
  
  // ========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ========================================
  
  openAuthModal(): void {
    const dialogRef = this.dialog.open(AuthModalComponent, {
      width: '400px',
      panelClass: 'crypto-modal',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log(' Usuario autenticado exitosamente');
        // No necesitas hacer nada más, los observables se actualizarán automáticamente
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
    console.log(' Usuario deslogueado');
  }
  
  // ========================================
  // GETTERS PARA EL TEMPLATE
  // ========================================
  
  get userName(): string {
    return this.currentUser?.name || this.currentUser?.email?.split('@')[0] || 'Usuario';
  }
  
  get userEmail(): string {
    return this.currentUser?.email || '';
  }
}