import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import React, { useState, useEffect, useRef } from 'react'
import CircularProgress from '@mui/material/CircularProgress'

import './Root.less'
import Lobby from './Lobby'
import Planning from './Planning'
import FlexBox from './FlexBox'
import useSession from './useSession'
import useUser, { setUser } from './useUser'
import useFlashMessage from './useFlashMessage'
import useHash from './useHash'

initializeApp({
	apiKey: "AIzaSyBpIZCRRZC-FpsnilNZRCsUTbyw2eLc1xY",
	authDomain: "scrum-poker-3108b.firebaseapp.com",
	databaseURL: "https://scrum-poker-3108b.firebaseio.com",
	projectId: "scrum-poker-3108b",
	storageBucket: "scrum-poker-3108b.appspot.com",
	messagingSenderId: "657180291314",
	appId: "1:657180291314:web:d521e4de69812513"
})

function signIn() {
	const authProvider = new GoogleAuthProvider()
	authProvider.setCustomParameters({ prompt: 'select_account' })
	return signInWithPopup(getAuth(), authProvider)
}

export default function Root() {
	const [currentUserID, setCurrentUserID] = useState<string>()
	const currentUser = useUser(currentUserID)

	const [sessionName, setSessionName] = useHash()
	const session = useSession(sessionName, currentUserID)
	const prevSession = useRef(session)

	const { showErrorMessage } = useFlashMessage()

	useEffect(() => {
		if (sessionName) {
			window.sessionStorage.setItem('sessionName', sessionName)
		}
	}, [sessionName])

	useEffect(() => {
		return onAuthStateChanged(getAuth(), (user) => {
			if (user?.emailVerified) {
				setCurrentUserID(user.uid)
				setUser(user).catch((error) => {
					showErrorMessage(error)
					setCurrentUserID(undefined)
				})

			} else if (sessionName) {
				signIn().catch(error => {
					if (error.code === 'auth/popup-closed-by-user') {
						// Do nothing

					} else if (error.code === 'auth/popup-blocked') {
						// Do nothing as users will be prompted to unblock the popup when clicking "Enter" button manually

					} else {
						console.error(error)
						showErrorMessage('An error occurred while signing in.')
					}

					// Go back to the lobby
					setSessionName('')
				})

			} else {
				// Signing out
				setSessionName('')
				setCurrentUserID(undefined)
			}
		})
	}, [sessionName])

	useEffect(() => {
		// Go back to the lobby when the current session is destroyed
		if (prevSession.current && !session) {
			setSessionName('')
		}

		prevSession.current = session
	}, [session])

	if (!sessionName) {
		return (
			<Lobby
				sessionName={window.sessionStorage.getItem('sessionName') || ''}
				onSubmit={sessionName => {
					setSessionName(sessionName)
				}}
			/>
		)
	}

	if (!session || !currentUser) {
		return (
			<FlexBox>
				<CircularProgress color='primary' />
			</FlexBox>
		)
	}

	return (
		<Planning
			currentUser={currentUser}
			session={session}
		/>
	)
}