import {confirm} from '../js/std-js/asyncDialog.js';
import User from '../js/User.js';

class HTMLLogoutButtonElement extends HTMLButtonElement {
	constructor() {
		super();
		this.hidden = ! User.loggedIn;
		document.addEventListener('login', () => this.hidden = false);
		document.addEventListener('logout', () => this.hidden = true);
		this.addEventListener('click', async () => {
			if (await confirm('Are you sure you want to logout?')) {
				document.dispatchEvent(new CustomEvent('logout'));
			}
		});
	}
}

customElements.define('logout-button', HTMLLogoutButtonElement, {extends: 'button'});
