import User from '../js/User.js';

class HTMLLoginButtonElement extends HTMLButtonElement {
	constructor() {
		super();
		this.hidden = User.loggedIn;
		this.disabled = ! navigator.onLine;
		this.addEventListener('click', async () =>  this.form.showModal());
		document.addEventListener('login', () => this.hidden = true);
		document.addEventListener('logout', () => this.hidden = false);
		window.addEventListener('online', () => this.disabled = false);
		window.addEventListener('offline', () => this.disabled = true);
	}

	get form() {
		return document.querySelector(this.selector);
	}

	get selector() {
		return this.getAttribute('selector') || 'login-form';
	}

	set selector(selector) {
		this.setAttribute('selector', selector);
	}
}

customElements.define('login-button', HTMLLoginButtonElement, {extends: 'button'});
