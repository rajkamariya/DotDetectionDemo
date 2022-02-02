import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxOpenCVModule, OpenCVConfig } from 'ngx-opencv';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

const openCVConfig: OpenCVConfig = {
  openCVDirPath: '/assets/opencv'  
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxOpenCVModule.forRoot(openCVConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
