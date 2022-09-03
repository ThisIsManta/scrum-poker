import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth'
import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'

import './Root.less'
import Lobby from './Lobby'
import Planning from './Planning'
import FlexBox from './FlexBox'
import useSession from './useSession'
import useUser, { syncUserProfile } from './useUser'

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
	signInWithRedirect(getAuth(), authProvider)
}

export default function Root() {
	const [currentUserID, setCurrentUserID] = useState<string>()
	const currentUser = useUser(currentUserID)

	const [searchParams, setSearchParams] = useSearchParams()
	const sessionName = searchParams.toString().replace(/=*$/, '')
	const session = useSession(sessionName, currentUserID)
	const prevSession = useRef(session)

	useEffect(() => {
		if (!sessionName) {
			return
		}

		return onAuthStateChanged(getAuth(), async (user) => {
			if (user && user.emailVerified) {
				await syncUserProfile(user)
				setCurrentUserID(user.uid)

			} else if (sessionName) {
				signIn()

			} else {
				setCurrentUserID(undefined)
				setSearchParams('')
			}
		})
	}, [])

	useEffect(() => {
		// Go back to the lobby when the current session is destroyed
		if (prevSession.current && !session) {
			setSearchParams('')
		}

		prevSession.current = session
	}, [session])

	if (!sessionName) {
		return (
			<Lobby
				sessionName={window.sessionStorage.getItem('session') || ''}
				onSubmit={sessionName => {
					window.sessionStorage.setItem('session', sessionName)

					setSearchParams(sessionName)
					signIn()
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