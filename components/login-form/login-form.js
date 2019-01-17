import {$, notify} from '../../js/std-js/functions.js';
import {API} from '../../js/consts.js';

export default class LoginForm extends HTMLElement {
	constructor() {
		super();
		const template = document.getElementById('login-form-template');
		this.attachShadow({mode: 'open'}).append(document.importNode(template.content, true));

		this.form.addEventListener('reset', () => {
			this.close();
		});

		this.form.addEventListener('submit', async event => {
			event.preventDefault();
			try {
				const form = new FormData(this.form);
				const data = Object.fromEntries(form.entries());
				this.login({
					driver_code: data.driver_code,
					driver_pin: data.driver_pin,
				});
			} catch(err) {
				console.error(err);
				notify('Error logging in', {
					body: err.message,
					icon: new URL('/img/octicons/alert.svg', document.baseURI)
				});
			}
		});

		$('.dialog-container', this.shadowRoot).pickClass('no-dialog', 'dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
	}

	async loginWithCreds() {
		if ('credentials' in navigator && window.PasswordCredential instanceof Function) {
			const creds = await navigator.credentials.get({
				password: true,
				mediation: 'required',
			});
			if (creds instanceof PasswordCredential) {
				return this.login({
					driver_code: creds.id,
					driver_pin: creds.password,
					store: false,
				});
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	async login({driver_code, driver_pin, store = true}) {
		const headers = new Headers();
		const body = JSON.stringify([{driver_code, driver_pin, clock: 1}]);
		headers.set('Content-Type', 'application/json');
		headers.set('Accept', 'application/json');

		const resp = await fetch(this.action, {
			mode: 'cors',
			method: this.method,
			headers,
			body,
		});

		if (resp.ok) {
			const json = await resp.json();
			if ('error' in json) {
				throw new Error(`"${json.message}" [${json.error}]`);
			}
			json.driversCode = driver_code;
			json.currentStatus = json.current_status;
			delete json.current_status;

			document.dispatchEvent(new CustomEvent('login', {detail: json}));

			if (store && window.PasswordCredential instanceof Function) {
				const creds = new PasswordCredential({
					id: driver_code,
					name: json.driversname,
					password: driver_pin,
					iconURL: new URL('/img/adwaita-icons/status/avatar-default.svg', document.baseURI),
				});
				await navigator.credentials.store(creds);
			}

			this.reset();
			return true;
		} else {
			return false;
		}
	}

	get method() {
		return 'POST';
	}

	get action() {
		return new URL(`${API}driver_signin`);
	}

	get dialog() {
		return this.shadowRoot.querySelector('dialog');
	}

	get form() {
		return this.shadowRoot.querySelector('form');
	}

	async showModal() {
		if ('credentials' in navigator && window.PasswordCredential instanceof Function) {
			const creds = await navigator.credentials.get({
				password: true,
				mediation: 'required',
			});
			if (creds instanceof PasswordCredential) {
				this.login({
					driver_code: creds.id,
					driver_pin: creds.password,
					store: false,
				});
			} else {
				this.dialog.showModal();
			}
		} else {
			this.dialog.showModal();
		}
	}

	close() {
		this.dialog.close();
	}

	reset() {
		this.form.reset();
	}
}

$('link[name="LoginForm"]').import('template').then(frag => {
	document.body.append(frag);
	customElements.define('login-form', LoginForm);
});
