import User from '../../js/User.js';
import {API} from '../../js/consts.js';
import {importLink} from '../../js/std-js/functions.js';

export default class HTMLClockIOELement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({mode: 'open'});
		this.hidden = ! User.loggedIn;
		document.addEventListener('login', () => {
			this.hidden = false;
			this.update();
		});
		document.addEventListener('logout', () => {
			this.hidden = true;
			this.token = '';
			this.clockedIn = false;
			this.notes = '';
		});

		importLink('clock-io-template').then(async temp => {
			temp = temp.cloneNode(true);
			// this.shadowRoot.append(...temp.head.children, ...temp.body.children);
			const supportsDialog = document.createElement('dialog') instanceof HTMLUnknownElement;
			[...temp.body.children].forEach(child => child.classList.toggle('no-dialog', supportsDialog));
			[...temp.querySelectorAll('[data-click]')].forEach(btn => {
				switch(btn.dataset.click.toLowerCase()) {
				case 'show-notes':
					btn.addEventListener('click', () => this.shadowRoot.getElementById('notes-dialog').showModal());
					break;
				case 'close-notes':
					btn.addEventListener('click', () => this.shadowRoot.getElementById('notes-dialog').close());
					break;
				}
			});
			temp.querySelector('form').addEventListener('submit', async event => {
				event.preventDefault();
				const url = new URL('m_clockinout', API);
				const headers = new Headers();
				const body = JSON.stringify(this);
				const datetime = new Date();
				headers.set('Accept', 'application/json');
				headers.set('Content-Type', 'application/json');

				const resp = await fetch(url, {headers, body, mode: 'cors', method: 'POST'});
				if (resp.ok) {
					const json = await resp.json();
					if ('error' in json) {
						throw new Error(`${json.message} [${json.error}]`);
					} else {
						this.clockedIn = ! this.clockedIn;
						const entry = {
							datetime,
							io: this.status,
							location: json.location,
							hours: parseFloat(json.hours),
						};
						sessionStorage.setItem('currentStatus', entry.io.toUpperCase());
						this.notes = '';
						// const io = this.status;
						// const location = json.location;
						// const hours = parseFloat(json.hours);
						// {datetime, io, location, hours}
						const row = document.querySelector('timecard-table').createRow(entry);
						if (row instanceof HTMLTableRowElement) {
							row.scrollIntoView({block: 'end', behavior: 'smooth'});
						}
					}
				} else {
					throw new Error(`${resp.url} [${resp.status} ${resp.statusText}]`);
				}
			});
			this.shadowRoot.append(...temp.head.children, ...temp.body.children);
			this.update();
		});
	}

	toJSON() {
		const data = Object.fromEntries(new FormData(this.shadowRoot.querySelector('form')).entries());
		data.status = this.clockedIn ? 'OUT' : 'IN';
		return [data];
	}

	async update() {
		await this.ready();
		if (User.loggedIn) {
			this.token = sessionStorage.getItem('token');
			this.clockedIn = sessionStorage.getItem('currentStatus').toUpperCase() === 'IN';
		}
	}

	async ready() {
		await new Promise(resolve => {
			if (this.shadowRoot.childElementCount === 0) {
				this.addEventListener('load', () => resolve(), {once: true});
			} else {
				resolve();
			}
		});
	}

	set token(token) {
		this.ready().then(() => this.shadowRoot.querySelector('input[name="token"]').value = token);
	}

	set notes(txt) {
		this.ready().then(() => this.shadowRoot.querySelector('textarea[name="notes"]').value = txt);
	}

	set clockedIn(status = true) {
		this.toggleAttribute('clockedin', status);
		this.status = status ? 'Out' : 'In';
	}

	get clockedIn() {
		return this.hasAttribute('clockedin');
	}

	set status(txt) {
		const el = document.createElement('span');
		el.slot = 'status';
		el.textContent = txt;
		this.ready().then(() => {
			this.shadowRoot.querySelector('slot[name="status"]').assignedNodes().forEach(el => el.remove());
			this.append(el);
		});
	}

	get status() {
		return this.clockedIn ? 'In' : 'Out';
	}
}

customElements.define('clock-io', HTMLClockIOELement);
