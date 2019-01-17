import {importLink} from '../../js/std-js/functions.js';

const VALID_IO = ['in', 'out'];

export default class HTMLEditEntryElement extends HTMLElement {
	constructor({io, datetime, uid = NaN, notes} = {}) {
		super();
		console.info({io, datetime, uid, notes});
		if (typeof uid === 'string') {
			uid = parseInt(uid);
		}
		if (typeof datetime === 'string') {
			datetime = new Date(datetime);
		}
		console.log({io, datetime, uid, notes});
		this.attachShadow({mode: 'open'});
		importLink('edit-entry-template').then(async temp => {
			temp = temp.cloneNode(true);
			const container = document.createElement('div');
			container.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
			container.append(...temp.head.children);
			container.append(...temp.body.children);
			this.shadowRoot.append(container);
			if (datetime instanceof Date && ! Number.isNaN(Date.parse(datetime))) {
				this.datetime = datetime;
			}
			if (! Number.isNaN(uid)) {
				this.uid = uid;
			}

			if (typeof notes === 'string') {
				this.notes = notes;
			}

			if (typeof io === 'string' && VALID_IO.includes(io.toLowerCase())) {
				this.io = io;
			}
			this.form.addEventListener('submit', async event => {
				event.preventDefault();
				const formData = new FormData(event.target);
				const data = Object.fromEntries(formData.entries());
				data.datetime = `${data.date}T${data.time}`;
				delete data.date;
				delete data.time;
				console.log(data);
				this.reset();
			});
			this.form.addEventListener('reset', () => this.close());
			this.dispatchEvent(new Event('load'));
		});
	}

	get dialog() {
		return this.shadowRoot.querySelector('dialog');
	}

	get form() {
		return this.dialog.querySelector('form');
	}

	reset() {
		this.form.reset();
	}

	show() {
		this.dialog.show();
	}

	showModal() {
		this.dialog.showModal();
	}

	close() {
		this.dialog.close();
	}

	get action() {
		return this.getAttribute('action');
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

	set uid(uid) {
		this.form.querySelector('[name="uid"]').value = uid;
	}

	set io(io) {
		if (VALID_IO.includes(io.toLowerCase())) {
			const radios = this.form.querySelectorAll('[name="io"]');
			radios.forEach(radio => radio.checked = radio.value = io.toLowerCase());
		}
	}

	set datetime(datetime) {
		if (typeof datetime === 'string') {
			datetime = new Date(datetime);
		}

		if (datetime instanceof Date && ! Number.isNaN(Date.parse(datetime))) {
			let [date] = datetime.toISOString().split('T');
			this.date = date;
			this.time = `${datetime.getHours().toString().padStart(2, '0')}:${datetime.getMinutes().toString().padStart(2, '0')}`;
		} else {
			throw new TypeError('Expected date to be a valid date');
		}
	}

	set date(date) {
		this.form.querySelector('[name="date"]').value = date;
	}

	set time(time) {
		console.log(time);
		this.form.querySelector('[name="time"]').value = time;
	}

	set notes(notes) {
		this.form.querySelector('[name="notes"]').value = notes.trim();
	}

	async ready() {
		if (this.shadowRoot.childElementCount === 0) {
			await new Promise(resolve => this.addEventListener('load', () => resolve(), {once: true}));
		}
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		await this.ready();
		switch(name.toLowerCase()) {
		case 'action':
		case 'method':
			this.form[name.toLowerCase()] = newValue;
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
