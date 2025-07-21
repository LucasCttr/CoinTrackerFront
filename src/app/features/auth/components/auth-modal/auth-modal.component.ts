import { Component, OnInit } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-auth-modal',
  imports: [ MatDialogModule, MatTabsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIcon ],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AuthModalComponent>
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

  onLogin(): void {
    if (this.loginForm.valid) {
      console.log('Login data:', this.loginForm.value);
      // Aquí irá tu lógica de login
      this.dialogRef.close({ action: 'login', data: this.loginForm.value });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      console.log('Register data:', this.registerForm.value);
      // Aquí irá tu lógica de registro
      this.dialogRef.close({ action: 'register', data: this.registerForm.value });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}