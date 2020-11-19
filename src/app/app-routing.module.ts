import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {CitationPageComponent} from './pages/citation-page/citation-page.component';
import {DownloadPageComponent} from './pages/download-page/download-page.component';
import {DrugLookupPageComponent} from './pages/drug-lookup-page/drug-lookup-page.component';

export const routes: Routes = [
  {path: '', component: HomePageComponent},
  {path: 'explorer', component: ExplorerPageComponent},
  {path: 'explorer/:protein', component: ExplorerPageComponent},
  {path: 'drug-lookup', component: DrugLookupPageComponent},
  {path: 'cite', component: CitationPageComponent},
  {path: 'about', component: AboutPageComponent},
  {path: 'download', component: DownloadPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
