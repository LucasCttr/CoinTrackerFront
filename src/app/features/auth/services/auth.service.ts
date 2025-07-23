import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Importaciones de interfaces
import { User } from '../../../shared/models/user.interface';
import { LoginRequest, RegisterRequest, AuthResponse, ApiError } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // ========================================
  // CONFIGURACIÓN
  // ========================================
  
  private readonly API_URL = 'http://localhost:5004/api/auth';
  private readonly TOKEN_KEY = 'crypto_tracker_token';
  private readonly REFRESH_TOKEN_KEY = 'crypto_tracker_refresh_token';
  private readonly USER_KEY = 'crypto_tracker_user';
  
  // ========================================
  // ESTADO REACTIVO (actualizado)
  // ========================================
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private isInitializedSubject = new BehaviorSubject<boolean>(false); // 🔥 NUEVO

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public isInitialized$ = this.isInitializedSubject.asObservable(); // 🔥 NUEVO
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // 🔥 INICIALIZACIÓN INMEDIATA Y SÍNCRONA
    this.initializeAuthSync();
  }
  
  // ========================================
  // GETTERS
  // ========================================
  
  get isInitialized(): boolean {
    return this.isInitializedSubject.value;
  }
  
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
  
  get token(): string | null {
    // 🔥 VERIFICACIÓN DE BROWSER
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }
  
  // ========================================
  // MÉTODOS HELPER PARA LOCALSTORAGE
  // ========================================
  
  private getFromStorage(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
      }
    }
    return null;
  }
  
  private setToStorage(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }
  
  private removeFromStorage(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  }
  
  private clearStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  }
  
  // ========================================
  // MÉTODOS PÚBLICOS
  // ========================================
  
  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.setLoading(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }
  
  /**
   * Registro de usuario
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.setLoading(true);
    
    if (userData.password !== userData.confirmPassword) {
      this.setLoading(false);
      return throwError(() => ({ message: 'Las contraseñas no coinciden' }));
    }
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }
  
  /**
   * Logout de usuario
   */
  logout(): void {
    // Opcional: notificar al servidor
    if (this.token) {
      this.http.post(`${this.API_URL}/logout`, {}).subscribe({
        error: (error) => console.log('Error en logout:', error)
      });
    }
    
    this.clearAuthData();
    this.router.navigate(['/']);
  }
  
  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================
  
  /**
   * Inicializa el estado de autenticación desde localStorage
   */
  private initializeAuth(): void {
    // 🔥 VERIFICACIÓN DE BROWSER ANTES DE ACCEDER A LOCALSTORAGE
    if (typeof window === 'undefined') {
      console.log('🔍 Window no disponible (probablemente SSR)');
      return;
    }
    
    console.log('🔄 Inicializando autenticación...');
    
    const token = this.token;
    const userData = this.getFromStorage(this.USER_KEY);
    
    console.log('🔍 Token encontrado:', !!token);
    console.log('🔍 UserData raw:', userData);
    
    // 🔥 VALIDACIÓN ESTRICTA ANTES DE JSON.parse
    if (token && userData && 
        userData !== 'undefined' && 
        userData !== 'null' && 
        userData !== null && 
        userData.trim() !== '' &&
        userData.startsWith('{')) { // 🔥 DEBE SER UN OBJETO JSON
      
      try {
        const user = JSON.parse(userData);
        
        // 🔥 VERIFICA QUE EL OBJETO PARSEADO SEA VÁLIDO
        if (user && typeof user === 'object' && user.email) {
          console.log('✅ Restaurando usuario:', user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          console.log('✅ Usuario restaurado exitosamente');
        } else {
          console.warn('⚠️ Objeto de usuario inválido:', user);
          this.clearAuthData();
        }
      } catch (error) {
        console.error('❌ Error al parsear datos de usuario:', error);
        console.error('❌ Datos problemáticos:', userData);
        console.warn('🧹 Limpiando localStorage corrupto...');
        this.clearAuthData();
      }
    } else {
      console.log('📝 No hay datos de autenticación válidos');
      console.log('📝 Razones: token=' + !!token + ', userData=' + userData);
      
      // 🔥 LIMPIAR DATOS CORRUPTOS
      if (userData === 'undefined' || userData === 'null' || userData === null) {
        console.warn('⚠️ Datos corruptos detectados, limpiando...');
        this.clearAuthData();
      }
    }
    
    // 🔥 LOG FINAL DEL ESTADO
    console.log('🏁 Estado final:', {
      isAuthenticated: this.isAuthenticated,
      hasUser: !!this.currentUser,
      hasToken: !!this.token
    });
  }
  
  /**
   * 🔥 Inicialización síncrona del estado de auth
   */
  private initializeAuthSync(): void {
    // Verificación de browser
    if (typeof window === 'undefined') {
      console.log('🔍 SSR detectado, marcando como inicializado sin datos');
      this.isInitializedSubject.next(true);
      return;
    }

    console.log('🚀 Inicializando AuthService síncronamente...');
    
    try {
      const token = this.token;
      const userData = this.getFromStorage(this.USER_KEY);
      
      console.log('🔍 Token:', !!token);
      console.log('🔍 UserData:', userData ? 'existe' : 'no existe');
      
      // Validación y restauración síncrona
      if (token && userData && 
          userData !== 'undefined' && 
          userData !== 'null' && 
          userData.trim() !== '' &&
          userData.startsWith('{')) {
        
        try {
          const user = JSON.parse(userData);
          
          if (user && typeof user === 'object' && user.email) {
            console.log('✅ Restaurando estado de auth...');
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
            console.log('✅ Estado restaurado inmediatamente');
          }
        } catch (parseError) {
          console.warn('⚠️ Error al parsear usuario, limpiando...');
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
    } finally {
      // 🔥 MARCAR COMO INICIALIZADO SIEMPRE
      this.isInitializedSubject.next(true);
      console.log('✅ AuthService inicializado');
    }
  }
  
  /**
   * Maneja la respuesta de autenticación exitosa
   */
  private handleAuthResponse(response: AuthResponse): void {
    console.log('🔄 === MANEJANDO RESPUESTA DE AUTH ===');
    console.log('🔍 Respuesta completa:', response);
    console.log('🔍 response.token:', response.token);
    console.log('🔍 response.email:', response.email);
    console.log('🔍 response.name:', response.name);
    console.log('🔍 response.expiresAt:', response.expiresAt);
    
    // Guardar token
    if (response.token) {
      console.log('💾 Guardando token...');
      this.setToStorage(this.TOKEN_KEY, response.token);
    }
    
    if (response.refreshToken) {
      console.log('💾 Guardando refresh token...');
      this.setToStorage(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    
    // 🔥 CREAR OBJETO USER A PARTIR DE LAS PROPIEDADES INDIVIDUALES
    if (response.email && response.name) {
      console.log('👤 Creando usuario a partir de los datos de la respuesta...');
      
      const user: User = {
        id: '0', // Tu API no devuelve ID, usa 0 por defecto
        email: response.email,
        name: response.name,
        // Agrega otras propiedades que necesites con valores por defecto
      };
      
      console.log('👤 Usuario creado:', user);
      this.updateUser(user);
    } else {
      console.error('❌ Email o Name faltantes en la respuesta');
    }
    
    console.log('🔄 === FIN MANEJO DE RESPUESTA ===');
  }
  
  /**
   * Actualiza el usuario actual
   */
  private updateUser(user: User): void {
    this.setToStorage(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
  
  /**
   * Limpia todos los datos de autenticación
   */
  private clearAuthData(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
  
  /**
   * Maneja errores de las peticiones HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    console.error('🔍 Error completo:', error);
    console.error('🔍 Error.error:', error.error);
    
    // 🔥 ERROR 400 - BAD REQUEST
    if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
      }
    }
    // Error de conexión
    else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que tu API esté corriendo en http://localhost:5004';
    }
    // Otros errores
    else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status) {
      switch (error.status) {
        case 401: errorMessage = 'Credenciales inválidas'; break;
        case 404: errorMessage = 'Endpoint no encontrado'; break;
        case 409: errorMessage = 'El email ya está registrado'; break;
        case 422: errorMessage = 'Datos inválidos'; break;
        case 500: errorMessage = 'Error interno del servidor'; break;
        default: errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('❌ Error en AuthService:', errorMessage);
    this.setLoading(false);
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
  
  /**
   * Actualiza el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }
}