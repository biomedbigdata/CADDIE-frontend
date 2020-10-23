import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingOverlayService {

  constructor() { }

  htmlString = `<button class="button is-loading loadingOverlay" alt="loading...">Loading</button>`;

  public addTo(elementId: string) {

    const stringToHTML = (str) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(str, 'text/html');
      return doc.body;
    };

    const element = document.getElementById(elementId);
    // convert template string to node, get first child since result is wrapped in "body" tag
    const node = stringToHTML(this.htmlString).firstChild;
    // append html
    element.appendChild(node);
  }

  public removeFrom(elementId: string) {
    const element = document.querySelector(`#${elementId}`);
    const loadingOverlay = element.querySelector(`.loadingOverlay`);
    element.removeChild(loadingOverlay);
  }

}
