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
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'auth-modal-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Auth result:', result);
        // Manejar el resultado del login/register
      }
    });
  }
}