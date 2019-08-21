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
	if (emailToAcronymMap[email]) {
		return emailToAcronymMap[email]
	}

	const emailName = email.split('@')[0]
	const [firstWord, secondWord] = _.words(emailName)
	if (secondWord) {
		return (firstWord.charAt(0) + secondWord.charAt(0)).toUpperCase()
	}

	const nonVowel = /[^aeiou_\-\.]/ig
	const firstChar = /^[aeiou]/i.test(firstWord)
		? firstWord.charAt(0)
		: _.get(firstWord.match(nonVowel), '0', firstWord.charAt(0))
	const secondChar = _.get(firstWord.match(nonVowel), '1', firstWord.charAt(1) || '')
	return (firstChar + secondChar).toUpperCase()
}