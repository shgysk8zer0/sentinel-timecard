import {importLink} from '../../js/std-js/functions.js';
import {API} from '../../js/consts.js';

const VALID_IO = ['in', 'out'];

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

export default class HTMLEditEntryElement extends HTMLElement {
	constructor({io, datetime, token = sessionStorage.getItem('token'), notes} = {}) {
		super();
		if (typeof datetime === 'string') {
			datetime = new Date(datetime);
		}

		this.attachShadow({mode: 'open'});
		importLink('edit-entry-template').then(async temp => {
			temp = temp.cloneNode(true);
			const container = document.createElement('div');
			container.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
			container.append(...temp.head.children, ...temp.body.children);
			this.shadowRoot.append(container);
			this.action = new URL('m_editpunch', API);
			this.method = 'POST';

			if (datetime instanceof Date && ! Number.isNaN(Date.parse(datetime))) {
				this.datetime = datetime;
			}

			if (typeof notes === 'string') {
				this.notes = notes;
			}

			if (typeof io === 'string' && VALID_IO.includes(io.toLowerCase())) {
				this.io = io;
			}

			this.token = token;
			if (typeof datetime === 'string') {
				datetime = new Date(datetime);
			}

			this.form.addEventListener('submit', async event => {
				event.preventDefault();
				try {
					const headers = new Headers();
					const controller = new AbortController();
					headers.set('Accept', 'application/json');
					headers.set('Content-Type', 'application/json');

					const req = new Request(this.action, {
						method: this.method,
						mode: 'cors',
						body: JSON.stringify(this),
						signal: controller.signal,
						headers,
					});

					// controller.abort();

					if (req.signal.aborted) {
						console.info({
							req,
							url: new URL(req.url),
							headers: Object.fromEntries(req.headers.entries()),
							body: JSON.parse(JSON.stringify(this)),
						});
					} else {
						const resp = await fetch(req);
						console.info(resp);

						if (resp.ok) {
							const json = await resp.json();
							if ('error' in json) {
								throw new Error(`${json.message} [${json.error}]`);
							} else {
								this.reset();
							}
						} else {
							throw new Error(`${resp.url} [${resp.status} ${resp.statusText}]`);
						}
					}
				} catch(err) {
					console.trace();
					console.error(err);
				}
			});

			this.form.addEventListener('reset', () => this.close());
			this.dispatchEvent(new Event('load'));
		});
	}

	toJSON() {
		if (this.populated) {
			// @TODO Ensure proper datetime (timezone)
			return [Object.fromEntries(new FormData(this.form).entries())];
		} else {
			return {};
		}
	}

	get populated() {
		return this.shadowRoot.childElementCount !== 0;
	}

	get dialog() {
		if (this.populated) {
			return this.shadowRoot.querySelector('dialog');
		} else {
			throw new Error(`<${this.tagName}> is not yet created.`);
		}
	}

	get form() {
		return this.dialog.querySelector('form');
	}

	get action() {
		return new URL(this.getAttribute('action') || 'm_editpunch', API);
	}

	set action(action) {
		this.setAttribute('action', action);
	}

	get method() {
		return this.getAttribute('method') || 'POST';
	}

	set method(method) {
		this.setAttribute('method', method);
	}

	set token(token) {
		this.form.querySelector('input[name="token"]').value = token;
	}

	set io(io) {
		if (VALID_IO.includes(io.toLowerCase())) {
			const state = document.createElement('b');
			state.slot = 'io';
			state.textContent = io;
			this.form.querySelector('slot[name="io"]').assignedNodes().forEach(el => el.remove());
			this.append(state);
		}
	}

	set datetime(datetime) {
		if (typeof datetime === 'string') {
			datetime = new Date(datetime);
		}

		if (datetime instanceof Date && ! Number.isNaN(Date.parse(datetime))) {
			this.date = datetime.toLocaleDateString();
			this.time = datetime.toLocaleTimeString();
			this.day = datetime;
			this.form.querySelector('time.pretty-date').dateTime = datetime.toISOString();
			this.form.querySelector('input[name="clockdttm"]').value = datetime.toISOString();
		} else {
			throw new TypeError('Expected date to be a valid date');
		}
	}

	set date(date) {
		const el = document.createElement('span');
		el.slot = 'date';
		el.textContent = date;
		this.form.querySelector('slot[name="date"]').assignedNodes().forEach(el => el.remove());
		this.append(el);
	}

	set time(time) {
		const el = document.createElement('time');
		el.slot = 'time';
		el.textContent = time;
		this.form.querySelector('slot[name="time"]').assignedNodes().forEach(el => el.remove());
		this.append(el);
	}

	set day(day) {
		const el = document.createElement('span');
		el.textContent = dow(day);
		el.slot = 'day';
		this.form.querySelector('slot[name="day"]').assignedNodes().forEach(el => el.remove());
		this.append(el);
	}

	set notes(notes) {
		this.form.querySelector('[name="notes"]').value = notes.trim();
	}

	async ready() {
		if (! this.populated) {
			await new Promise(resolve => this.addEventListener('load', () => resolve(), {once: true}));
		}
	}

	reset() {
		this.form.reset();
	}

	async show() {
		await this.ready();
		this.dialog.show();
	}

	async showModal() {
		await this.ready();
		this.dialog.showModal();
	}

	async close() {
		await this.ready();
		this.dialog.close();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		await this.ready();
		switch(name.toLowerCase()) {
		case 'action':
			this.form.action = newValue;
			break;
		case 'method':
			this.form.method = newValue;
			break;
		default:
			throw new Error(`Invalid attribute change handler: "${name}"`);
		}
	}

	static get observedAttributes() {
		return [
			'action',
			'method',
		];
	}
}

customElements.define('edit-entry', HTMLEditEntryElement);
