import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableModule } from 'primeng/table';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ExplorerPageComponent } from './pages/explorer-page/explorer-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { QueryTileComponent } from './pages/explorer-page/components/sidebar/components/query-tile/query-tile.component';
import { LaunchAnalysisComponent } from './pages/explorer-page/components/sidebar/dialogs/launch-analysis/launch-analysis.component';
import { DatasetTileComponent } from './pages/explorer-page/components/sidebar/components/dataset-tile/dataset-tile.component';
import { AnalysisPanelComponent } from './pages/explorer-page/components/analysis-panel/analysis-panel.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { ToggleComponent } from './components/toggle/toggle.component';
import { InfoTileComponent } from './pages/explorer-page/components/sidebar/components/info-tile/info-tile.component';
import { CustomGenesComponent } from './pages/explorer-page/components/sidebar/dialogs/custom-genes/custom-genes.component';

import { AnalysisService } from './services/analysis/analysis.service';
import { CitationPageComponent } from './pages/citation-page/citation-page.component';
import {
  AddExpressedProteinsComponent
} from './pages/explorer-page/components/sidebar/dialogs/add-expressed-proteins/add-expressed-proteins.component';
import { CancertypeTileComponent } from './pages/explorer-page/components/sidebar/components/cancertype-tile/cancertype-tile.component';
import { DataLevelToggleComponent } from './components/data-level-toggle/data-level-toggle.component';
import { ButtonComponent } from './components/button/button.component';
import { FilterTileComponent } from './pages/explorer-page/components/sidebar/components/filter-tile/filter-tile.component';
import {
  InteractionDatasetTileComponent
} from './pages/explorer-page/components/sidebar/components/interaction-dataset-tile/interaction-dataset-tile.component';
import {
  CancertypeComorbiditiesTileComponent
} from './pages/explorer-page/components/sidebar/components/cancertype-comorbidities-tile/cancertype-comorbidities-tile.component';
import { DownloadPageComponent } from './pages/download-page/download-page.component';
import {
  DiseaseRelatedGenesComponent
} from './pages/explorer-page/components/sidebar/dialogs/disease-related-genes/disease-related-genes.component';
import { CategorySelectorComponent } from './components/category-selector/category-selector.component';
import { DrugLookupPageComponent } from './pages/drug-lookup-page/drug-lookup-page.component';
import { VcfInputComponent } from './pages/explorer-page/components/sidebar/dialogs/vcf-input/vcf-input.component';
// @ts-ignore
import { LaunchAnalysisCategoryDropdownComponent } from './pages/explorer-page/components/sidebar/dialogs/launch-analysis/launch-analysis-category-dropdown/launch-analysis-category-dropdown.component';
import {
  AddCancerExpressedGenesComponent
} from './pages/explorer-page/components/sidebar/dialogs/add-cancer-expressed-genes/add-cancer-expressed-genes.component';
import { GProfilerComponent } from './pages/explorer-page/components/sidebar/components/g-profiler/g-profiler.component';

// @ts-ignore
import { PlotlyViaCDNModule, PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { SurvivalPlotComponent } from './pages/explorer-page/components/sidebar/components/survival-plot/survival-plot.component';
import {
  ButtonScrollTopComponent
} from './pages/explorer-page/components/sidebar/components/button-scroll-top/button-scroll-top.component';
import { SidebarComponent } from './pages/explorer-page/components/sidebar/sidebar.component';
import { NetworkComponent } from './pages/explorer-page/components/network/network.component';
import { GeneLookupPageComponent } from './pages/gene-lookup-page/gene-lookup-page.component';
import { AddMutatedGenesComponent } from './pages/explorer-page/components/sidebar/dialogs/add-mutated-genes/add-mutated-genes.component';
import {
  NetworkMenuDialogComponent
} from './pages/explorer-page/components/sidebar/dialogs/network-menu-dialog/network-menu-dialog.component';
import {
  TaskSummarizeDialogComponent
} from './pages/explorer-page/components/sidebar/dialogs/task-summmarize-dialog/task-summarize-dialog.component';
import { CookieDisclaimerComponent } from './components/cookie-disclaimer/cookie-disclaimer.component';
import { DocumentationPageComponent } from './pages/documentation-page/documentation-page.component';
import { PythonPageComponent } from './pages/python-page/python-page.component';
import { AnalysisParametersWindowComponent } from './pages/explorer-page/components/analysis-panel/analysis-parameters-window/analysis-parameters-window.component';
import { ExplorerNetworkInformationComponent } from './pages/explorer-page/components/explorer-network-information/explorer-network-information.component';
import { ExplorerPageTutorialComponent } from './pages/explorer-page/components/explorer-page-tutorial/explorer-page-tutorial.component';
import { CancernetPanelComponent } from './components/cancernet-panel/cancernet-panel.component';
import { SimpleExplorerPageComponent } from './pages/simple-explorer-page/simple-explorer-page.component';

PlotlyModule.plotlyjs = PlotlyJS;

PlotlyViaCDNModule.plotlyVersion = '2.6.4';  // https://github.com/plotly/plotly.js/releases
PlotlyViaCDNModule.plotlyBundle = 'basic';

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
    DrugLookupPageComponent,
    VcfInputComponent,
    LaunchAnalysisCategoryDropdownComponent,
    AddCancerExpressedGenesComponent,
    SurvivalPlotComponent,
    ButtonScrollTopComponent,
    SidebarComponent,
    NetworkComponent,
    GProfilerComponent,
    GeneLookupPageComponent,
    AddMutatedGenesComponent,
    NetworkMenuDialogComponent,
    TaskSummarizeDialogComponent,
    CookieDisclaimerComponent,
    DocumentationPageComponent,
    PythonPageComponent,
    AnalysisParametersWindowComponent,
    ExplorerNetworkInformationComponent,
    ExplorerPageTutorialComponent,
    CancernetPanelComponent,
    SimpleExplorerPageComponent,
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
    PlotlyViaCDNModule,
    // PlotlyModule
  ],
  providers: [AnalysisService],
  bootstrap: [AppComponent],
})
export class AppModule {
}
