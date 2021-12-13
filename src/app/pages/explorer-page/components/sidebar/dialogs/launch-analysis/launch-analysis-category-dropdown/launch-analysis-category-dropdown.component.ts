import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MutationCancerType, ExpressionCancerType} from '../../../../../../../interfaces';

@Component({
  selector: 'app-launch-analysis-category-dropdown',
  templateUrl: './launch-analysis-category-dropdown.component.html',
  styleUrls: ['./launch-analysis-category-dropdown.component.scss']
})
export class LaunchAnalysisCategoryDropdownComponent implements OnInit {

  @Input() selectedCategory: MutationCancerType | ExpressionCancerType;
  @Output() selectedCategoryChange: EventEmitter<any> = new EventEmitter();

  @Input() categories: MutationCancerType[] |ExpressionCancerType[];

  constructor() { }

  ngOnInit(): void {
  }

  public select(selectionItem) {
    this.selectedCategory = selectionItem;
    this.selectedCategoryChange.emit(selectionItem);
  }
}
