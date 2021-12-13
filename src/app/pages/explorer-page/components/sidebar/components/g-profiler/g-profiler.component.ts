import { Component, OnInit } from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';

@Component({
  selector: 'app-g-profiler',
  templateUrl: './g-profiler.component.html',
  styleUrls: ['./g-profiler.component.scss']
})
export class GProfilerComponent implements OnInit {

  constructor(public analysis: AnalysisService) { }

  ngOnInit(): void {
  }

  gProfilerLink(): string {
    /**
     * Creates and returns link for Profiler (http://biit.cs.ut.ee/gprofiler/gost)
     * uses collected analysis data (getSelection())
     */
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.type === 'Node' || wrapper.type === 'CancerNode')
      .map(wrapper => wrapper.data.entrezId)
      .join('%0A');
    return 'http://biit.cs.ut.ee/gprofiler/gost?' +
      'organism=hsapiens&' +
      `query=${queryString}&` +
      'ordered=false&' +
      'all_results=false&' +
      'no_iea=false&' +
      'combined=false&' +
      'measure_underrepresentation=false&' +
      'domain_scope=annotated&' +
      'significance_threshold_method=g_SCS&' +
      'user_threshold=0.05&' +
      'numeric_namespace=ENTREZGENE_ACC&' +
      'sources=GO:MF,GO:CC,GO:BP,KEGG,TF,REAC,MIRNA,HPA,CORUM,HP,WP&' +
      'background=';
  }

}
