import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'client-approval',
    loadComponent: () =>
      import('./pages/client-approval/client-approval.page').then(
        (m) => m.ClientApprovalPage
      ),
  },
  {
    path: 'high-client',
    loadComponent: () =>
      import('./pages/high/high-client/high-client.page').then(
        (m) => m.HighClientPage
      ),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu.page').then((m) => m.MenuPage),
  },

  {
    path: 'lista-de-espera',
    loadComponent: () =>
      import('./pages/lista-de-espera/lista-de-espera.page').then(
        (m) => m.ListaDeEsperaPage
      ),
  },
  {
    path: 'menu-principal',
    loadComponent: () =>
      import('./pages/menu-principal/menu-principal.page').then(
        (m) => m.MenuPrincipalPage
      ),
  },
  {
    path: 'client-survey',
    loadComponent: () => import('./pages/surveys/client-survey/client-survey.page').then( m => m.ClientSurveyPage)
  },
  {
    path: 'menu-encuesta',
    loadComponent: () => import('./pages/surveys/menu-encuesta/menu-encuesta.page').then( m => m.MenuEncuestaPage)
  },

];
