import { useEffect, useState, useRef, useCallback } from 'react'
import { getFirestore, collection, doc, deleteDoc, updateDoc, arrayRemove, deleteField, onSnapshot, CollectionReference, DocumentReference, FieldPath, serverTimestamp, runTransaction } from 'firebase/firestore'
import { isError, noop, mapValues } from 'lodash-es'

import useFlashMessage from './useFlashMessage'

interface Vote {
	firstScore: string
	lastScore: string
	timestamp: string
}

export interface SessionData {
	master: string
	players: { [email: string]: Vote } // TODO: rename this field to "votes"
	scores: string[]
}

export enum PredefinedScore {
	P0 = '0',
	P1 = '1',
	P2 = '2',
	P3 = '3',
	P5 = '5',
	P8 = '8',
	P13 = '13',
	P21 = '21',
	Infinity = '∞',
	NonDeterminable = '?',
}

function createNoVote(): Vote {
	return {
		firstScore: '',
		lastScore: '',
		timestamp: serverTimestamp() as any as string
	}
}

export type Session = NonNullable<ReturnType<typeof useSession>>

export default function useSession(name: string, currentUserEmail: string | null | undefined) {
	const sessionReference = useRef<DocumentReference<SessionData>>()
	const [data, setData] = useState<SessionData | null>(null)
	const { showErrorMessage } = useFlashMessage()

	useEffect(() => {
		let unsubscribe = noop
		let unmounted = false

		if (name && currentUserEmail) {
			(async () => {
				sessionReference.current = doc(collection(getFirestore(), 'planning') as CollectionReference<SessionData>, name)

				try {
					await runTransaction(getFirestore(), async transaction => {
						const snap = await transaction.get(sessionReference.current!)
						let data = snap.data()

						if (data === undefined) {
							data = {
								master: currentUserEmail,
								players: {},
								scores: Object.values(PredefinedScore),
							}
							transaction.set(sessionReference.current!, data)
						}

						if (data.master !== currentUserEmail && data.players[currentUserEmail] === undefined) {
							data = {
								...data,
								players: {
									...data.players,
									[currentUserEmail]: createNoVote(),
								}
							}
							transaction.update(sessionReference.current!, new FieldPath('players', currentUserEmail), data.players[currentUserEmail])
						}
					})

					if (unmounted) {
						return
					}

					unsubscribe = onSnapshot(sessionReference.current, snap => {
						const data = snap.data()

						if (!data || data.players[currentUserEmail] === undefined && data.master !== currentUserEmail) {
							showErrorMessage('You have been removed from the session')
							setData(null)
							return
						}

						setData(data)
					})

				} catch (error) {
					if (typeof error === 'object' && error && (error as any).code === 'permission-denied') {
						showErrorMessage('Remote database permission denied.')
					} else {
						showErrorMessage(isError(error) ? error.message : String(error))
					}
				}
			})()


		} else {
			setData(null)
		}

		return () => {
			unmounted = true
			unsubscribe()
		}
	}, [name, currentUserEmail])

	const castVote = useCallback(async (score: string) => {
		if (!sessionReference.current || !currentUserEmail) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('players', currentUserEmail),
			{
				...(!data?.players[currentUserEmail].firstScore ? { firstScore: score } : {}),
				lastScore: score,
				timestamp: serverTimestamp(),
			}
		)
	}, [data])

	const clearVote = useCallback(async (email: string) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('players', email),
			createNoVote()
		)
	}, [data])

	const clearAllVotes = useCallback(async () => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			{
				players: mapValues(data?.players || {}, player => createNoVote()),
			}
		)
	}, [data])

	const removePlayer = useCallback(async (email: string) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('players', email),
			deleteField()
		)
	}, [data])

	const transferScrumMasterRole = useCallback(async (email: string) => {
		if (!sessionReference.current) {
			return
		}

		await Promise.all([
			updateDoc(
				sessionReference.current,
				'master',
				email
			),
			currentUserEmail && !data?.players[currentUserEmail] && clearVote(currentUserEmail),
		])
	}, [data])

	const setSelectableScores = useCallback(async (scores: Array<string>) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('scores'),
			scores,
		)
	}, [data])

	const removeScore = useCallback(async (score: string) => {
		if (!sessionReference.current || !data) {
			return
		}

		// Remove the select score from the players who voted
		const updates = Object.entries(data.players)
			.filter(([email, player]) => player.firstScore === score || player.lastScore === score)
			.flatMap(([email, player]) => [
				new FieldPath('players', email),
				{
					...player,
					firstScore: '',
					lastScore: '',
					timestamp: serverTimestamp(),
				}
			])

		await updateDoc(
			sessionReference.current,
			new FieldPath('scores'),
			arrayRemove(score),
			...updates
		)
	}, [data])

	const destroy = useCallback(async () => {
		if (!sessionReference.current) {
			return
		}

		await deleteDoc(sessionReference.current)
	}, [data])

	if (!data) {
		return null
	}

	return {
		data,
		castVote,
		clearVote,
		clearAllVotes,
		removePlayer,
		transferScrumMasterRole,
		setSelectableScores,
		removeScore,
		destroy,
	}
}