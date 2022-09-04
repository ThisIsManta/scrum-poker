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

export async function syncUserProfile(firebaseUser: FirebaseUser) {
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

	await setDoc(userReference, user)

	userStore.set(store => store.set(user.id, user))
}
