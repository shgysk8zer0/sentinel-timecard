const KEYS = [
	'token',
	'driversname',
	'driversCode',
	'currentStatus',
];

function get(key) {
	return sessionStorage.getItem(key);
}

function set(key, value) {
	return sessionStorage.setItem(key, value);
}

function getAll(...keys) {
	return keys.reduce((data, key) => {
		data[key] = get(key);
		return data;
	}, {});
}

function setAll(props = {}) {
	return Object.entries(props).map(([key, value]) => set(key, value));
}


function has(...keys) {
	return keys.every(key => sessionStorage.hasOwnProperty(key));
}

function remove(...keys) {
	return keys.map(key => sessionStorage.removeItem(key));
}

export default class User {
	constructor({
		driversCode    = null,
		driversname   = null,
		token         = null,
		currentStatus = undefined,
	} = {}) {
		this.id = driversCode;
		this.name = driversname;
		this.token = token;
		this.currentStatus = currentStatus;
	}

	toJSON() {
		const {id, name, token, currentStatus} = this;
		return {id, name, token, currentStatus};
	}

	toString() {
		return this.name;
	}

	get isValid() {
		return [
			this.id,
			this.name,
			this.token,
			this.currentStatus,
		].every(prop => typeof prop === 'string' && prop.length !== 0);
	}

	save() {
		if (this.isValid) {
			setAll({
				token: this.token,
				driversname: this.name,
				driversCode: this.id,
				currentStatus: this.currentStatus,
			});
			return true;
		} else {
			return false;
		}
	}

	static load() {
		return new User(getAll(...KEYS));
	}

	static logOut() {
		if (User.loggedIn) {
			remove(...KEYS);
			return true;
		} else {
			return true;
		}
	}

	static get loggedIn() {
		return has(...KEYS);
	}

	static get KEYS() {
		return KEYS;
	}

	static hasKeys(data = {}) {
		return data !== null && typeof data === 'object' && KEYS.every(key => data.hasOwnProperty(key));
	}

	static async whenLoggedIn() {
		await new Promise(resolve => {
			if (User.loggedIn) {
				resolve(User.load());
			} else {
				document.addEventListener('login', event => resolve(new User(event.detail)), {once: true});
			}
		});
	}
}
