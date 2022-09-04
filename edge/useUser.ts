import { useEffect, useRef } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { collection, doc, DocumentReference, getDoc, setDoc, getFirestore, onSnapshot } from 'firebase/firestore'
import { Map } from 'immutable'
import { hookstate as createStore, useHookstate as useStore } from '@hookstate/core'

import useFlashMessage from './useFlashMessage'
import getAcronym from './getAcronym'

export interface User {
	id: string
	email: string
	fullName: string | null
	codeName: string
	photo: string | null
}

const userStore = createStore(Map<User['id'], User>())

export default function useUser(userID: User['id'] | undefined) {
	const users = useStore(userStore)
	const user = userID ? users.get().get(userID) : undefined

	const userReference = useRef<DocumentReference<User>>()
	const { showErrorMessage } = useFlashMessage()

	useEffect(() => {
		if (!userID) {
			return
		}

		userReference.current = doc<User>(collection(getFirestore(), 'users') as any, userID)

		return onSnapshot(userReference.current, snap => {
			const data = snap.data()

			if (!data) {
				showErrorMessage(`The user profile with the ID of "${userID}" could not be loaded.`)
				return
			}

			userStore.set(store => store.set(userID, data))
		})
	}, [userID])

	return user
}

export async function setUser(firebaseUser: FirebaseUser) {
	const cachedUserKey = `user(${firebaseUser.uid})`
	const cachedUserSerialized = window.localStorage.getItem(cachedUserKey)
	if (cachedUserSerialized) {
		try {
			const user = JSON.parse(cachedUserSerialized)

			const schema: Record<keyof User, (value: unknown) => boolean> = {
				id: (value) => typeof value === 'string',
				email: (value) => typeof value === 'string',
				fullName: (value) => typeof value === 'string' || value === undefined,
				codeName: (value) => typeof value === 'string',
				photo: (value) => typeof value === 'string' || value === undefined,
			}
			for (const [field, check] of Object.entries(schema)) {
				if (check(user[field]) !== true) {
					throw new Error(`The field "${field}" is not compatible with type User.`)
				}
			}

			userStore.set(store => store.set(user.id, user))
		} catch (error) {
			console.error(error)

			window.localStorage.removeItem(cachedUserKey)
		}
	}

	const userReference = doc<User>(collection(getFirestore(), 'users') as any, firebaseUser.uid)
	const snap = await getDoc(userReference)
	const data = snap.data()

	const user: User = {
		id: firebaseUser.uid,
		email: firebaseUser.email!,
		fullName: firebaseUser.providerData[0]?.displayName || firebaseUser.displayName,
		codeName: data?.codeName ?? getAcronym(firebaseUser),
		photo: firebaseUser.photoURL,
	}

	// Do not wait for this as Firestore has optimistic updates
	await setDoc(userReference, user)

	userStore.set(store => store.set(user.id, user))

	window.localStorage.setItem(cachedUserKey, JSON.stringify(user))
}
