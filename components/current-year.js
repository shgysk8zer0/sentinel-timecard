function update(time) {
  const date = time.date;
  time.textContent = date.getFullYear();
  time.title = date.toLocaleString();
}

export default class HTMLCurrentYearElement extends HTMLTimeElement {
  constructor() {
    super();
    if (this.dateTime === '') {
      update(this);
    } else {
      this.dateTime = this.date.toISOString();
    }
  }

  get date() {
    return this.dateTime === '' ? new Date() : new Date(this.dateTime);
  }

  set date(date) {
    if (! date instanceof Date) {
      date = new Date(date);
    }
    this.dateTime = date.toISOString();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log({name, oldValue, newValue});
    switch (name.toLowerCase()) {
    case 'datetime':
      update(this);
      break;
    default:
      throw new Error(`Invalid attribute change: "${name}"`);
    }
  }

  static get observedAttributes() {
    return [
      'datetime',
      'dateTime',
    ];
  }
}

customElements.define('current-year', HTMLCurrentYearElement, {extends: 'time'});
