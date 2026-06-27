import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../../core/auth/auth.service';
import { resolveDefaultDashboardPath } from '../../../../core/auth/dashboard-navigation.utils';
import { PermissionService } from '../../../../core/auth/permission.service';
import { TextField } from '../../../../shared/components/text-field/text-field';

@Component({
  selector: 'app-login-page',
  imports: [TextField],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);

  readonly loading = this.auth.loading;
  readonly errorMessage = signal<string | null>(null);

  readonly loginModel = signal({ email: '', password: '' });
  readonly loginForm = form(this.loginModel);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const { email, password } = this.loginModel();
    if (!email.trim() || !password) {
      this.errorMessage.set('Ingresa tu email y contraseña.');
      return;
    }

    this.errorMessage.set(null);

    try {
      await this.auth.login(email.trim(), password);
      await this.router.navigate([resolveDefaultDashboardPath(this.permissions)]);
    } catch (error) {
      this.errorMessage.set(this.resolveLoginError(error));
    }
  }

  private resolveLoginError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      }

      if (error.status === 0) {
        return 'No pudimos conectar con el servidor. Intenta de nuevo.';
      }

      return 'No se pudo completar el inicio de sesión. Intenta de nuevo.';
    }

    return 'No se pudo completar el inicio de sesión. Intenta de nuevo.';
  }
}
