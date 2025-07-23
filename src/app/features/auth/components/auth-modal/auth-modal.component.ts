import { Component, OnInit } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // 🔥 AGREGA ESTO
import { CommonModule } from '@angular/common'; // 🔥 AGREGA ESTO

// Importa el AuthService
import { AuthService } from '../../services/auth.service'; // 🔥 AGREGA ESTO

@Component({
  selector: 'app-auth-modal',
  imports: [ 
    MatDialogModule, 
    MatTabsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule, 
    MatIcon,
    MatButtonModule, // 🔥 AGREGA ESTO
    CommonModule // 🔥 AGREGA ESTO
  ],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  hidePassword = true;
  isLoading = false; // 🔥 AGREGA ESTADO DE CARGA
  errorMessage = ''; // 🔥 AGREGA MANEJO DE ERRORES

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AuthModalComponent>,
    private authService: AuthService // 🔥 INYECTA EL AUTHSERVICE
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  // ========================================
  // MÉTODOS ACTUALIZADOS CON AUTHSERVICE
  // ========================================

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // USA EL AUTHSERVICE PARA LOGIN
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('✅ Login exitoso:', response);
          this.dialogRef.close({ success: true, action: 'login', user: response.name });
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.errorMessage = error.message || 'Error al iniciar sesión';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      // Validación de contraseñas
      if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      
      //  USA EL AUTHSERVICE PARA REGISTRO
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('✅ Registro exitoso:', response);
          this.dialogRef.close({ success: true, action: 'register', user: response.name });
        },
        error: (error) => {
          console.error('❌ Error en registro:', error);
          this.errorMessage = error.message || 'Error al registrar usuario';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }


  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  clearError(): void {
    this.errorMessage = '';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // Método para alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}