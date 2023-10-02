import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {CitationPageComponent} from './pages/citation-page/citation-page.component';
import {DownloadPageComponent} from './pages/download-page/download-page.component';
import {DrugLookupPageComponent} from './pages/drug-lookup-page/drug-lookup-page.component';
import { GeneLookupPageComponent } from './pages/gene-lookup-page/gene-lookup-page.component';
import { DocumentationPageComponent } from './pages/documentation-page/documentation-page.component';
import { PythonPageComponent } from './pages/python-page/python-page.component';
import { SimpleExplorerPageComponent } from './pages/simple-explorer-page/simple-explorer-page.component';


export const routes: Routes = [
  {path: '', component: HomePageComponent},
  { path: 'explorer', component: ExplorerPageComponent },
  { path: 'simple', component: SimpleExplorerPageComponent },
  {path: 'explorer/:task', component: ExplorerPageComponent},
  {path: 'drug-lookup', component: DrugLookupPageComponent},
  {path: 'gene-lookup', component: GeneLookupPageComponent},
  {path: 'cite', component: CitationPageComponent},
  {path: 'about', component: AboutPageComponent},
  {path: 'download', component: DownloadPageComponent},
  {path: 'documentation', component: DocumentationPageComponent},
  {path: 'python', component: PythonPageComponent},
  {path: '**', component: HomePageComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
