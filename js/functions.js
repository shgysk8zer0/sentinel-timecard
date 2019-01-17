import {API} from './consts.js';

export async function getOwnerInfo({userid, token}) {
	const url = new URL(`owners/${userid}/${token}`, API);
	const resp = await fetch(url);
	const data = await resp.json();
	return data[0];
}
