import './std-js/shims.js';
import './std-js/deprefixer.js';
import '../components/current-year.js';
import '../components/login-button.js';
import '../components/logout-button.js';
import '../components/timecard-table/timecard-table.js';
import '../components/login-form/login-form.js';
import '../components/clock-io/clock-io.js';
import {registerServiceWorker, loaded} from './std-js/functions.js';
import User from './User.js';
window.User = User;

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.documentElement.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);

loaded().then(async () => {
	document.addEventListener('login', event => {
		if (User.hasKeys(event.detail)) {
			const user = new User(event.detail);
			user.save();
		}
	});

	document.addEventListener('logout', () => User.logOut());

	if (User.loggedIn) {
		document.dispatchEvent(new CustomEvent('login'));
	}
});
