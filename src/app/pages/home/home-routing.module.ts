import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinanceComponent } from 'src/app/components/finance/finance.component';
import { ServiciosComponent } from 'src/app/components/servicios/servicios.component';
import { HomePage } from './home.page';
import { ProfilePage } from 'src/app/pages/profile/profile.page';
import { ProfileStudentComponent } from 'src/app/components/profile-student/profile-student.component';
import { UserConfigurationComponent } from 'src/app/components/user-configuration/user-configuration.component';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'finance',
        component: FinanceComponent
      },
      {
        path: 'profile',
        component: ProfilePage,
        children: [
          {
            path: 'student/:id',
            component: ProfileStudentComponent,
          },
        ]
      },
      {
        path: 'service',
        component: ServiciosComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule { }