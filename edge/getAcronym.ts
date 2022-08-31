import { words, get } from 'lodash-es'

const predefinedEmailToAcronymMap: Record<string, string | undefined> = {
	'anantachai.s@taskworld.com': 'MT',
}

export function getAcronym(email: string): string {
	const predefinedAcronym = predefinedEmailToAcronymMap[email]
	if (predefinedAcronym) {
		return predefinedAcronym
	}

	const emailName = email.split('@')[0]
	const [firstWord, secondWord] = words(emailName)
	if (secondWord) {
		return (firstWord.charAt(0) + secondWord.charAt(0)).toUpperCase()
	}

	const nonVowel = /[^aeiou_\-\.]/ig
	const firstChar = /^[aeiou]/i.test(firstWord)
		? firstWord.charAt(0)
		: get(firstWord.match(nonVowel), '0', firstWord.charAt(0))
	const secondChar = get(firstWord.match(nonVowel), '1', firstWord.charAt(1) || '')
	return (firstChar + secondChar).toUpperCase()
}