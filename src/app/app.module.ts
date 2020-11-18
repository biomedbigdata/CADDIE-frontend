import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgSelectModule} from '@ng-select/ng-select';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TableModule} from 'primeng/table';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {AboutPageComponent} from './pages/about-page/about-page.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {QueryTileComponent} from './components/query-tile/query-tile.component';
import {LaunchAnalysisComponent} from './dialogs/launch-analysis/launch-analysis.component';
import {DatasetTileComponent} from './components/dataset-tile/dataset-tile.component';
import {AnalysisPanelComponent} from './components/analysis-panel/analysis-panel.component';
import {TaskListComponent} from './components/task-list/task-list.component';
import {ToggleComponent} from './components/toggle/toggle.component';
import {InfoTileComponent} from './components/info-tile/info-tile.component';
import {CustomGenesComponent} from './dialogs/custom-proteins/custom-genes.component';

import {AnalysisService} from './services/analysis/analysis.service';
import { CitationPageComponent } from './pages/citation-page/citation-page.component';
import { AddExpressedProteinsComponent } from './dialogs/add-expressed-proteins/add-expressed-proteins.component';
import { CancertypeTileComponent } from './components/cancertype-tile/cancertype-tile.component';
import { DataLevelToggleComponent } from './components/data-level-toggle/data-level-toggle.component';
import { ButtonComponent } from './components/button/button.component';
import { FilterTileComponent } from './components/filter-tile/filter-tile.component';
import { InteractionDatasetTileComponent } from './components/interaction-dataset-tile/interaction-dataset-tile.component';
import { CancertypeComorbiditiesTileComponent } from './components/cancertype-comorbidities-tile/cancertype-comorbidities-tile.component';
import { DownloadPageComponent } from './pages/download-page/download-page.component';


// @ts-ignore
import { PlotlyViaCDNModule } from 'angular-plotly.js';
import { DiseaseRelatedGenesComponent } from './dialogs/disease-related-genes/disease-related-genes.component';
import { CategorySelectorComponent } from './components/category-selector/category-selector.component';

PlotlyViaCDNModule.plotlyVersion = '1.41.0';

@NgModule({
  declarations: [
    AppComponent,
    ExplorerPageComponent,
    AboutPageComponent,
    HomePageComponent,
    QueryTileComponent,
    LaunchAnalysisComponent,
    DatasetTileComponent,
    AnalysisPanelComponent,
    TaskListComponent,
    ToggleComponent,
    InfoTileComponent,
    CustomGenesComponent,
    CitationPageComponent,
    AddExpressedProteinsComponent,
    CancertypeTileComponent,
    DataLevelToggleComponent,
    ButtonComponent,
    FilterTileComponent,
    InteractionDatasetTileComponent,
    CancertypeComorbiditiesTileComponent,
    DownloadPageComponent,
    DiseaseRelatedGenesComponent,
    CategorySelectorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TableModule,
    PlotlyViaCDNModule
  ],
  providers: [AnalysisService],
  bootstrap: [AppComponent],
})
export class AppModule {
}
