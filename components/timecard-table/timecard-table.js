import './edit-entry.js';
import User from '../../js/User.js';
import {API} from '../../js/consts.js';
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

function parse(...records) {
	const tz = new Date().toISOString().split('.')[1];
	return records.map(record => {
		return {
			datetime: new Date(`${record.clockdttm.replace(' ', 'T')}.${tz}`),
			io: record.status.toLowerCase(),
			location: record.location,
			hours: parseFloat(record.dutyhours) || '',
		};
	});
}

async function render(table) {
	await table.ready();
	await User.whenLoggedIn();
	const url = new URL(`m_clockinout/${sessionStorage.getItem('token')}`, API);
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	const resp = await fetch(url, {headers, mode: 'cors'});
	if (resp.ok) {
		const json = await resp.json();

		if ('error' in json) {
			throw new Error(`${json.message} [${json.error}]`);
		} else if (! Array.isArray(json[0].details)) {
			throw new TypeError('Expected an array of "details" in response');
		}
		const detail = parse(...json[0].details);
		[...table.tBody.rows].forEach(r => r.remove());
		table.entries = detail;
		table.dispatchEvent(new CustomEvent('populated', {detail}));
		table.totalHours = sum(table.tBody.rows);
		return detail;
	}
}

function sum(rows) {
	return [...rows].filter(row => ! row.hidden).reduce((sum, row) => {
		const hours = parseFloat(row.querySelector('[data-field="hours"]').textContent);
		if (! Number.isNaN(hours)) {
			sum += hours;
		}
		return sum;
	}, 0);
}

export default class HTMLTimeCardTableElement extends HTMLElement {
	constructor({uid = NaN} = {}) {
		super();
		this.hidden = ! User.isLoggedIn;
		document.addEventListener('login', () => {
			this.hidden = false;
			render(this);
		});
		document.addEventListener('logout', () => {
			this.hidden = true;
			[...this.tBody.rows].forEach(row => row.remove());
		});
		this.attachShadow({mode: 'open'});
		importLink('timecard-table-template').then(async tmp => {
			tmp = tmp.cloneNode(true);
			this.shadowRoot.append(...tmp.head.children, ...tmp.body.children);
			if (! Number.isNaN(uid)) {
				this.uid = uid;
			}
			const searchForm = this.shadowRoot.querySelector('form[name="search"]');
			const now = new Date();
			const dstr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
			// const tz = now.toISOString().split('.')[1];
			const startDate = searchForm.querySelector('input[type="date"][name="start"]');
			const endDate = searchForm.querySelector('input[type="date"][name="end"]');
			endDate.value = dstr;
			startDate.max = dstr;
			endDate.max = dstr;
			startDate.addEventListener('change', () => endDate.min = startDate.value);
			endDate.addEventListener('change', () => startDate.max = endDate.value);

			searchForm.addEventListener('submit', async event => {
				event.preventDefault();
				const data = Object.fromEntries(new FormData(event.target).entries());
				let {start, end} = data;
				start = new Date(`${start}T00:00:00.000Z`);
				end = new Date(`${end}T23:59:59.000Z`);

				[...this.tBody.rows].forEach(row => {
					const time = row.querySelector('[data-field="datetime"]');
					const datetime = new Date(time.dateTime);
					row.hidden = datetime <= start || datetime >= end;
					this.totalHours = sum(this.tBody.rows);
				});
			});
			searchForm.addEventListener('reset', () => {
				[...this.tBody.rows].forEach(row => row.hidden = false);
				endDate.value = dstr;
				startDate.max = dstr;
				endDate.max = dstr;
				this.totalHours = this(this.tBody.rows);
			});
			this.dispatchEvent(new Event('load'));
		}).catch(console.error);
	}

	toJSON() {
		return this.entries;
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

	set totalHours(hours) {
		if (typeof hours === 'number' && ! Number.isNaN(hours)) {
			const el = document.createElement('span');
			el.textContent = hours.toFixed(2);
			el.slot = 'total-hours';
			this.ready().then(() => {
				this.shadowRoot.querySelector('slot[name="total-hours"]').assignedNodes().forEach(el => el.remove());
				this.append(el);
			});
		} else {
			throw new TypeError('Expected total hours to be a number');
		}
	}

	get totalHours() {
		try {
			const slot = this.shadowRoot.querySelector('slot[name="total-hours"]');
			if (slot instanceof HTMLSlotElement) {
				const nodes = slot.assignedNodes();
				if (nodes.length === 1) {
					return parseFloat(nodes[0].textContent);
				} else {
					throw new Error('totalHours not set');
				}
			} else {
				throw new Error('Total hours slot not found');
			}
		} catch(err) {
			console.error(err);
			return NaN;
		}
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
			row = this.tBody.rows.item(row);
		}

		if (row instanceof HTMLTableRowElement) {
			return Object.fromEntries([...row.querySelectorAll('[data-field]')].map(cell => {
				const prop = cell.dataset.field;
				switch(prop) {
				case 'datetime':
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

	async populated() {
		await new Promise(async resolve => {
			await this.ready();
			if (this.tBody.rows.length === 0) {
				this.addEventListener('populated', () => resolve(), {once: true});
			} else {
				resolve();
			}
		});
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
		/* eslint no-case-declarations: "off" */
		await this.ready();
		switch(name.toLowerCase()) {
		case 'border':
			this.table.border = newValue;
			break;
		case 'uid':
			console.info('Changing UID will eventually update date displayed with an API fetch');
			break;
		// case 'datasrc':
		// 	render(this);
		// 	break;
		default:
			throw new Error(`Unhandled attribute change: "${name}"`);
		}
	}

	static get observedAttributes() {
		return [
			'border',
			'uid',
			// 'datasrc',
		];
	}
}

customElements.define('timecard-table', HTMLTimeCardTableElement);
