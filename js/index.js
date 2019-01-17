import './std-js/shims.js';
import './std-js/deprefixer.js';
import '../components/current-year.js';
import '../components/timecard-table/timecard-table.js';
import {registerServiceWorker} from './std-js/functions.js';

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.documentElement.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
