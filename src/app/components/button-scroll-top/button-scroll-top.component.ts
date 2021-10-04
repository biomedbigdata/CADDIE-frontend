import { Component, ElementRef, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';

@Component({
  selector: 'app-button-scroll-top',
  templateUrl: './button-scroll-top.component.html',
  styleUrls: ['./button-scroll-top.component.scss']
})
export class ButtonScrollTopComponent implements OnInit, OnDestroy {

  @Input() buttonText: string;
  @Output() callbackFun = new EventEmitter<boolean>();
  private fun = undefined;  // binding function

  constructor(public elementRef: ElementRef) {}


  ngOnInit(): void {
    this.fun = this.scrollCheck.bind(this);
    this.elementRef.nativeElement.parentElement.addEventListener('scroll', this.fun);
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.parentElement.removeEventListener('scroll', this.fun);
  }

  public close() {
    this.callbackFun.emit(false);
  }

  public scrollCheck() {
    // remove button when element is scrolled to top
    if (this.elementRef.nativeElement.parentElement.scrollTop === 0) {
      // deactivate button
      this.close();
    }
  }

  public scrollTop() {
    this.elementRef.nativeElement.parentElement.scroll({
      top: 0, // scroll to the bottom of the element
      behavior: 'smooth' // auto, smooth, initial, inherit
    });
    this.close();
  }

}
