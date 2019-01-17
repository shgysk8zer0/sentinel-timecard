class HTMLLoginButtonElement extends HTMLButtonElement {
	constructor() {
		super();
		this.hidden = sessionStorage.hasOwnProperty('token');
		this.disabled = ! navigator.onLine;
		this.addEventListener('click', async () =>  this.form.showModal());
		document.addEventListener('login', () => this.hidden = true);
		document.addEventListener('logout', () => this.hidden = false);
		window.addEventListener('online', () => this.disabled = false);
		window.addEventListener('offline', () => this.disabled = true);
	}

	get form() {
		return document.querySelector('login-form');
	}
}

customElements.define('login-button', HTMLLoginButtonElement, {extends: 'button'});
