import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingOverlayService {

  constructor() { }

  html_string = `<button class="button is-loading loadingOverlay">Loading</button>`

  public addTo(element_id: string) {

    /**
     * Convert a template string into HTML DOM nodes
     * @param  {String} str The template string
     * @return {Node}       The template HTML
     */
    const stringToHTML = function (str) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(str, 'text/html');
      return doc.body;
    };

    const element = document.getElementById(element_id);
    // convert template string to node, get first child since result is wrapped in "body" tag
    const node = stringToHTML(this.html_string).firstChild
    // append html
    element.appendChild(node)

  }

  public removeFrom(element_id: string) {
    const element = document.querySelector(`#${element_id}`);
    const loadingOverlay = element.querySelector(`.loadingOverlay`);
    element.removeChild(loadingOverlay)
  }

}
