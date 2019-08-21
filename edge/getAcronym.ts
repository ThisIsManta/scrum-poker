import * as _ from 'lodash'

const emailToAcronymMap = {
	'anantachai.s@taskworld.com': 'MT',
	'chaiyapon.o@taskworld.com': 'NS',
	'kunanan.t@taskworld.com': 'OL',
	'sawit.r@taskworld.com': 'GR',
	'totsawat.m@taskworld.com': 'MX',
	'thanarat.j@taskworld.com': 'AN',
	'marek@taskworld.com': 'MR',
	'phakamas.j@taskworld.com': 'JN',
}

export function getAcronym(email: string) {
	return emailToAcronymMap[email] || _.chain(_.words(email.split('@')[0]))
		.take(2)
		.map(name => name.substring(0, 1).toUpperCase())
		.value()
		.join('')
}