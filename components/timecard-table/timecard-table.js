import './edit-entry.js';
import {importLink} from '../../js/std-js/functions.js';

const DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
];

function dow(dNum) {
  if (dNum instanceof Date) {
    dNum = dNum.getDay();
  } else if (typeof dNum === 'string') {
    dNum = parseInt(dNum);
  }
  return DAYS[dNum];
}

export default class HTMLTimeCardTableElement extends HTMLElement {
  constructor({uid = NaN} = {}) {
    super();
    this.attachShadow({mode: 'open'});
    importLink('timecard-table-template').then(async tmp => {
      tmp = tmp.cloneNode(true);
      this.shadowRoot.append(...tmp.head.children, ...tmp.body.children);
      if (! Number.isNaN(uid)) {
        this.uid = uid;
      }
      this.dispatchEvent(new Event('load'));
    }).catch(console.error);
  }

  toJSON() {
    return this.entries;
  }

  get dataSrc() {
    if (this.hasAttribute('datasrc')) {
      return new URL(this.getAttribute('datasrc'), document.baseURI);
    } else {
      return null;
    }
  }

  set dataSrc(url) {
    this.setAttribute('datasrc', url);
  }

  get entries() {
    return [...this.tBody.rows].map(row => this.getRowData(row));
  }

  set entries(entries) {
    entries.forEach(entry => {
      if (typeof entry.datetime === 'string') {
        entry.datetime = new Date(entry.datetime);
      }
      this.createRow(entry);
    });
  }

  get border() {
    return this.getAttribute('border');
  }

  set border(border) {
    this.setAttribute('border', border);
  }

  get table() {
    return this.shadowRoot.querySelector('table');
  }

  get tHead() {
    return this.table.tHead;
  }

  get tFoot() {
    return this.table.tFoot;
  }

  get tBody() {
    return this.tBodies.item(0);
  }

  get tBodies() {
    return this.table.tBodies;
  }

  get rows() {
    return this.table.rows;
  }

  get caption() {
    return this.table.caption;
  }

  set caption(caption) {
    if (caption instanceof HTMLElement) {
      caption.slot = 'caption';
      this.removeSlotNodes('caption');
      this.append(caption);
    } else {
      const el = document.createElement('span');
      el.textContent = caption;
      this.replaceSlotNodes('caption', el);
    }
  }

  getRowData(row) {
    if (typeof row === 'number') {
      row = this.tBody.rows.item(num);
    }

    if (row instanceof HTMLTableRowElement) {
      return Object.fromEntries([...row.querySelectorAll('[data-field]')].map(cell => {
        const prop = cell.dataset.field;
        switch(prop) {
        case 'datetime':
          console.log({cell, dateTime: cell.dateTime, date: new Date(cell.dateTime)});
          return [prop, cell instanceof HTMLTimeElement ? cell.dateTime || cell.textContent : cell.textContent];
        case 'hours':
          return [prop, parseFloat(cell.textContent)];
        default:
          return [prop, cell.textContent];
        }
      }));
    } else {
      throw new Error('Requested row does not exist');
    }
  }

  getSlot(name) {
    return this.shadowRoot.querySelector(`slot[name="${name}"]`);
  }

  getSlotNodes(name) {
    const slot = this.getSlot(name);
    if (slot instanceof HTMLSlotElement) {
      return slot.assignedNodes();
    } else {
      return [];
    }
  }

  removeSlotNodes(name) {
    const nodes = this.getSlotNodes(name);
    const length = nodes.length;
    nodes.forEach(el => el.remove());
    return length;
  }

  replaceSlotNodes(name, ...els) {
    const replaced = this.removeSlotNodes(name);
    els.forEach(el => el.slot = name);
    this.append(...els);
    return replaced;
  }

  async ready() {
    if (! (this.shadowRoot instanceof ShadowRoot) || this.shadowRoot.childElementCount === 0) {
      await new Promise(resolve => this.addEventListener('load', () => resolve()));
    }
  }

  createRow(props = {}) {
    const template = this.shadowRoot.getElementById('row-template').content;
    const row = template.cloneNode(true);
    row.querySelectorAll('[data-field]').forEach(el => {
      if (props.hasOwnProperty(el.dataset.field)) {
        let value = props[el.dataset.field];
        if (el.dataset.field === 'datetime' || value instanceof Date) {
          value = value instanceof Date ? value : new Date(value);
          el.textContent = `${dow(value)}., ${value.toLocaleString()}`;
          if (el instanceof HTMLTimeElement) {
            el.dateTime = value.toISOString();
          }
        } else {
          el.textContent = value;
        }
      }
    });

    row.querySelectorAll('[data-click]').forEach(btn => {
      switch(btn.dataset.click) {
      case 'edit':
        btn.addEventListener('click', async event => {
          const tr = event.target.closest('tr');
          if (tr instanceof HTMLTableRowElement) {
            await customElements.whenDefined('edit-entry');
            const data = this.getRowData(tr);
            data.uid = this.uid;
            const HTMLEditEntryElement = customElements.get('edit-entry');
            const dialog = new HTMLEditEntryElement(data);
            await dialog.ready();
            dialog.dialog.addEventListener('close', () => {
              dialog.remove();
            });
            document.body.append(dialog);
            dialog.showModal();
          }
        });
      }
    });

    row.querySelector('[data-click="edit"]').toggleAttribute('disabled', props.changeRequested === true);
    this.tBody.append(row);
    return row;
  }

  get uid() {
    return parseInt(this.getAttribute('uid'));
  }

  set uid(uid) {
    if (typeof uid === 'string') {
      uid = parseInt(uid);
    }

    if (typeof uid !== 'number' || Number.isNaN(uid)) {
      throw new Error('Invalid UID');
    } else {
      this.setAttribute('uid', uid);
    }
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    await this.ready();
    switch(name.toLowerCase()) {
    case 'border':
      this.table.border = newValue;
      break;
    case 'uid':
      console.info('Changing UID will eventually update date displayed with an API fetch');
      break;
    case 'datasrc':
      await this.ready();
      const resp = await fetch(this.dataSrc);
      const details = await resp.json();
      [...this.tBody.rows].forEach(r => r.remove());
      this.entries = details;
      this.dispatchEvent(new CustomEvent('populated', {details}));
      break;
    default:
      throw new Error(`Unhandled attribute change: "${name}"`);
    }
  }

  static get observedAttributes() {
    return [
      'border',
      'uid',
      'datasrc',
    ];
  }
}

customElements.define('timecard-table', HTMLTimeCardTableElement);
