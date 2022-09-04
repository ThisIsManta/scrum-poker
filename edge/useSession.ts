import { useEffect, useState, useRef, useCallback } from 'react'
import { getFirestore, collection, doc, deleteDoc, updateDoc, arrayRemove, deleteField, onSnapshot, CollectionReference, DocumentReference, FieldPath, serverTimestamp, runTransaction } from 'firebase/firestore'
import { isError, noop, mapValues, sortBy, union } from 'lodash-es'

import useFlashMessage from './useFlashMessage'
import { User } from './useUser'

interface Vote {
	firstScore: string
	lastScore: string
	timestamp: string | { nanoseconds: number } | null
}

export interface SessionData {
	master: string
	votes: { [userID: User['id']]: Vote }
	scores: string[]
}

export enum PredefinedScore {
	P0 = '0',
	P1 = '1',
	P2 = '2',
	P3 = '3',
	P5 = '5',
	P8 = '8',
	NonDeterminable = '?',
}

function createNoVote(): Vote {
	return {
		firstScore: '',
		lastScore: '',
		timestamp: null,
	}
}

export type Session = NonNullable<ReturnType<typeof useSession>>

export default function useSession(name: string, currentUserID: User['id'] | undefined) {
	const sessionReference = useRef<DocumentReference<SessionData>>()
	const [data, setData] = useState<SessionData | null>(null)
	const { showAlertMessage, showErrorMessage } = useFlashMessage()

	useEffect(() => {
		let unsubscribe = noop
		let unmounted = false

		if (name && currentUserID) {
			(async () => {
				sessionReference.current = doc(collection(getFirestore(), 'planning') as CollectionReference<SessionData>, name)

				try {
					await runTransaction(getFirestore(), async transaction => {
						const snap = await transaction.get(sessionReference.current!)
						let data = snap.data()

						if (data === undefined) {
							data = {
								master: currentUserID,
								votes: {},
								scores: Object.values(PredefinedScore),
							}
							transaction.set(sessionReference.current!, data)
						}

						if (data.master !== currentUserID && data.votes[currentUserID] === undefined) {
							data = {
								...data,
								votes: {
									...data.votes,
									[currentUserID]: createNoVote(),
								}
							}
							transaction.update(sessionReference.current!, new FieldPath('votes', currentUserID), data.votes[currentUserID])
						}
					})

					if (unmounted) {
						return
					}

					unsubscribe = onSnapshot(sessionReference.current, snap => {
						const data = snap.data()

						if (!data) {
							showAlertMessage('The session has ended.')
							setData(null)
							return
						}

						if (data.votes[currentUserID] === undefined && data.master !== currentUserID) {
							showAlertMessage('You have been removed from the session.')
							setData(null)
							return
						}

						if (data.votes[currentUserID]?.lastScore && data.scores.includes(data.votes[currentUserID].lastScore) === false) {
							clearVote(currentUserID)
						}

						setData(data)
					})

				} catch (error) {
					if (typeof error === 'object' && error && (error as any).code === 'permission-denied') {
						console.error(error)
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
	}, [name, currentUserID])

	const castVote = useCallback(async (score: string) => {
		if (!sessionReference.current || !currentUserID || !data) {
			return
		}

		const { firstScore, lastScore } = data.votes[currentUserID] || {}
		if (!firstScore) {
			await updateDoc(
				sessionReference.current,
				new FieldPath('votes', currentUserID),
				{
					firstScore: score,
					lastScore: score,
					timestamp: serverTimestamp(),
				}
			)
		} else if (lastScore !== score) {
			await updateDoc(
				sessionReference.current,
				new FieldPath('votes', currentUserID, 'lastScore'),
				score,
				new FieldPath('votes', currentUserID, 'timestamp'),
				serverTimestamp(),
			)
		}
	}, [name, data?.votes, currentUserID])

	const clearVote = useCallback(async (userID: string) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('votes', userID),
			createNoVote()
		)
	}, [name])

	const clearAllVotes = useCallback(async () => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('votes'),
			mapValues(data?.votes || {}, () => createNoVote()),
		)
	}, [name, data?.votes])

	const removePlayer = useCallback(async (userID: string) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('votes', userID),
			deleteField()
		)
	}, [name])

	const transferScrumMasterRole = useCallback(async (userID: string) => {
		if (!sessionReference.current) {
			return
		}

		await updateDoc(
			sessionReference.current,
			'master',
			userID
		)

		// Do not move this action as the scrum master role must be transferred first
		if (currentUserID && !data?.votes[currentUserID]) {
			await clearVote(currentUserID)
		}
	}, [name, data?.votes, currentUserID])

	const addSelectableScore = useCallback(async (...scores: Array<string>) => {
		if (!sessionReference.current || !data) {
			return
		}

		const newScores = sortBy(
			union(data.scores, scores),
			score => score === '?' ? 1 : 0,
			score => {
				if (score === '¼') {
					return 0.25
				}
				if (score === '½') {
					return 0.5
				}
				if (score === '¾') {
					return 0.75
				}
				if (isFinite(parseFloat(score))) {
					return parseFloat(score)
				}
				return score
			}
		)

		await updateDoc(
			sessionReference.current,
			new FieldPath('scores'),
			newScores,
		)
	}, [name, data?.scores])

	const removeSelectableScore = useCallback(async (score: string) => {
		if (!sessionReference.current || !data) {
			return
		}

		await updateDoc(
			sessionReference.current,
			new FieldPath('scores'),
			arrayRemove(score),
		)
	}, [name, data?.votes])

	const destroy = useCallback(async () => {
		if (!sessionReference.current) {
			return
		}

		await deleteDoc(sessionReference.current)
	}, [name])

	useEffect(() => {
		const leave = () => {
			if (currentUserID) {
				removePlayer(currentUserID)
			}
		}

		window.addEventListener('beforeunload', leave)

		return () => {
			window.removeEventListener('beforeunload', leave)
		}
	}, [removePlayer, currentUserID])

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
		addSelectableScore,
		removeSelectableScore,
		destroy,
	}
}