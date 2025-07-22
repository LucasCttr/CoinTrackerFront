import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../../features/auth/components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-global-header',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatToolbarModule, MatIconModule],
  templateUrl: './global-header.component.html',
  styleUrl: './global-header.component.css'
})
export class GlobalHeaderComponent {

  constructor(private dialog: MatDialog) {}

  openAuthModal(): void {
    const dialogRef = this.dialog.open(AuthModalComponent, {
      width: '420px', 
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      panelClass: 'crypto-modal' // Clase para estilos personalizados
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Modal cerrado con resultado:', result);
      }
    });
  }
}