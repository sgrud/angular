import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injector, ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadInterceptor } from './load/interceptor';
import { ModelService } from './model/service';
import { SgrudConfig } from './sgrud-config';
import './sgrud-polyfills';

@NgModule({
  imports: [
    RouterModule.forRoot([])
  ],
  exports: [
    RouterModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadInterceptor,
      multi: true
    }
  ]
})

export class SgrudModule {

  public static forRoot(
    sgrudConfig: SgrudConfig
  ): ModuleWithProviders<SgrudModule> {
    return {
      ngModule: SgrudModule,
      providers: [
        {
          provide: SgrudConfig,
          useValue: sgrudConfig
        }
      ]
    };
  }

  public constructor(
    private readonly injector: Injector
  ) {
    this.injector.get(ModelService);
  }

}
