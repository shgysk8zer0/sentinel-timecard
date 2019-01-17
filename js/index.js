import './std-js/shims.js';
import './std-js/deprefixer.js';
import '../components/current-year.js';
import '../components/login-button.js';
import '../components/logout-button.js';
import '../components/timecard-table/timecard-table.js';
import '../components/login-form/login-form.js';
import {registerServiceWorker, loaded} from './std-js/functions.js';

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.documentElement.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);

loaded().then(async () => {
	document.addEventListener('login', event => {
		if (event.detail !== null && ['token', 'driversname'].every(key => event.detail.hasOwnProperty(key))) {
			const {token, driversname, tracking = 1} = event.detail;
			sessionStorage.setItem('token', token);
			sessionStorage.setItem('driversname', driversname);
			sessionStorage.setItem('tracking', tracking);
		}
	});
	document.addEventListener('logout', () => sessionStorage.clear());

	if (['token', 'driversname'].every(key => sessionStorage.hasOwnProperty(key))) {
		document.dispatchEvent(new CustomEvent('login'));
	}
});
