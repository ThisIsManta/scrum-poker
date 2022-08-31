import Firebase from 'firebase/app'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { memoize, isError } from 'lodash-es'
import CircularProgress from '@mui/material/CircularProgress'

import './Root.less'
import Lobby from './Lobby'
import Planning from './Planning'
import FlexBox from './FlexBox'
import useFlashMessage from './useFlashMessage'

function signIn() {
	const authProvider = new Firebase.auth.GoogleAuthProvider()
	authProvider.setCustomParameters({ prompt: 'select_account' })
	Firebase.auth().signInWithRedirect(authProvider)
}

export default function Root() {
	const [loading, setLoading] = useState(true)
	const [currentUser, setCurrentUser] = useState<Firebase.User | null>(null)
	const { showErrorMessage } = useFlashMessage()
	const [searchParams, setSearchParams] = useSearchParams()
	const sessionName = searchParams.toString()

	const getDocument = memoize((session: string) => Firebase.firestore().collection('planning').doc(session.toLowerCase()))

	useEffect(() => {
		Firebase.initializeApp({
			apiKey: "AIzaSyBpIZCRRZC-FpsnilNZRCsUTbyw2eLc1xY",
			authDomain: "scrum-poker-3108b.firebaseapp.com",
			databaseURL: "https://scrum-poker-3108b.firebaseio.com",
			projectId: "scrum-poker-3108b",
			storageBucket: "scrum-poker-3108b.appspot.com",
			messagingSenderId: "657180291314",
			appId: "1:657180291314:web:d521e4de69812513"
		})

		if (!sessionName) {
			setLoading(false)
			return
		}

		return Firebase.auth().onAuthStateChanged(user => {
			if (user && user.emailVerified) {
				getDocument(sessionName).get().then(() => {
					setCurrentUser(user)
				}).catch(error => {
					if ('code' in error && error.code === 'permission-denied') {
						showErrorMessage('Access denied.')
					} else {
						showErrorMessage(isError(error) ? error.message : String(error))
					}
					setSearchParams('')
				}).finally(() => {
					setLoading(false)
				})

			} else if (sessionName) {
				signIn()

			} else {
				setCurrentUser(null)
				setSearchParams('')
			}
		})
	}, [])

	if (loading) {
		return (
			<FlexBox>
				<CircularProgress color='primary' />
			</FlexBox>
		)
	}

	if (!sessionName || !currentUser?.email) {
		return (
			<Lobby
				sessionName={window.sessionStorage.getItem('session') || ''}
				onSubmit={session => {
					session = session.toLowerCase()
					window.sessionStorage.setItem('session', session)

					setSearchParams(session)
					signIn()
				}}
			/>
		)
	}

	return (
		<Planning
			currentUserEmail={currentUser.email}
			document={getDocument(sessionName)}
			onSessionDeleted={() => {
				setSearchParams('')
			}}
		/>
	)
}