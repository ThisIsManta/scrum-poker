import { words, get } from 'lodash-es'
import { UserInfo } from 'firebase/auth'

export default function getAcronym(user: UserInfo): string {
	if (user.displayName) {
		const inParenthesisText = get(user.displayName.match(/\((.+?)\)/), '1', null)
		if (inParenthesisText) {
			return getAcronymInternal(inParenthesisText)
		}

		return getAcronymInternal(user.displayName)
	}

	if (user.email) {
		const emailName = user.email.split('@')[0]
		return getAcronymInternal(emailName)
	}

	return user.uid.substring(0, 2)
}

function getAcronymInternal(text: string): string {
	text = text.trim()
	if (text.length === 1) {
		return text
	}

	const [firstWord, ...restWords] = words(text)

	if (restWords.length > 0) {
		return (firstWord.charAt(0) + restWords[restWords.length - 1].charAt(0)).toUpperCase()
	}

	const nonVowelChars = firstWord.match(/[^aeiou_\-\.]/ig) || firstWord
	const firstChar = /^[aeiou]/i.test(firstWord) ? firstWord.charAt(0) : nonVowelChars[0]
	const secondChar = nonVowelChars[1] || ''
	return (firstChar + secondChar).toUpperCase()
}