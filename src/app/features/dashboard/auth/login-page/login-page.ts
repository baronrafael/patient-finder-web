import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';

import { AuthService } from '../../../../core/auth/auth.service';
import { DASHBOARD_PATHS } from '../../../../core/routing/dashboard.paths';
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
      await this.router.navigate([DASHBOARD_PATHS.patients]);
    } catch {
      this.errorMessage.set('Credenciales incorrectas. Verifica tu email y contraseña.');
    }
  }
}
