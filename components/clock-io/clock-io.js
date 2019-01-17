import User from '../../js/User.js';
import {API} from '../../js/consts.js';
import {importLink} from '../../js/std-js/functions.js';

export default class HTMLClockIOELement extends HTMLElement {
	constructor() {
		super();
		this.hidden = ! User.loggedIn;
		document.addEventListener('login', () => this.hidden = false);
		document.addEventListener('logout', () => this.hidden = true);
		this.attachShadow({mode: 'open'});

		importLink('clock-io-template').then(async temp => {
			temp = temp.cloneNode(true);
			this.shadowRoot.append(...temp.head.children, ...temp.body.children);
			this.token = sessionStorage.getItem('token');
			this.clockedIn = sessionStorage.getItem('currentStatus').toUpperCase() === 'IN';
			this.shadowRoot.querySelector('form').addEventListener('submit', async event => {
				event.preventDefault();
				const url = new URL('m_clockinout', API);
				const headers = new Headers();
				const body = JSON.stringify(this);
				headers.set('Accept', 'application/json');
				headers.set('Content-Type', 'application/json');

				// const resp = await fetch(url, {headers, body, mode: 'cors', method: 'POST'});
				// if (resp.ok) {
				// 	const json = await resp.json();
				// 	if ('error' in json) {
				// 		throw new Error(`${json.message} [${json.error}]`);
				// 	} else {
				// 		this.checkedIn = ! this.checkedIn;
				// 	}
				// } else {
				// 	throw new Error(`${resp.url} [${resp.status} ${resp.statusText}]`);
				// }
				console.log({url, headers: Object.fromEntries(headers.entries()), body});
				this.clockedIn = ! this.clockedIn;
			});
		});
	}

	toJSON() {
		const data = Object.fromEntries(new FormData(this.shadowRoot.querySelector('form')).entries());
		data.clockedinout = this.clockedIn ? 'In' : 'Out';
		return [data];
	}

	set token(token) {
		this.shadowRoot.querySelector('input[name="token"]').value = token;
	}

	set clockedIn(status = true) {
		this.toggleAttribute('clockedin', status);
		this.status = status ? 'In' : 'Out';
	}

	get clockedIn() {
		return this.hasAttribute('clockedin');
	}

	set status(txt) {
		this.shadowRoot.querySelector('slot[name="status"]').assignedNodes().forEach(el => el.remove());
		const el = document.createElement('span');
		el.slot = 'status';
		el.textContent = txt;
		this.append(el);
	}
}

customElements.define('clock-io', HTMLClockIOELement);
