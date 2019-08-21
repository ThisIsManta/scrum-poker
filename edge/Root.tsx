import * as Firebase from 'firebase/app'
import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as _ from 'lodash'

import Lobby from './Lobby'
import Planning from './Planning'

export default function Root(props: {
	session: string
	history: RouteComponentProps['history']
	database: Firebase.firestore.Firestore
}) {
	const session = props.session || window.sessionStorage.getItem('session') || ''
	const [currentUser, setCurrentUser] = React.useState<Firebase.User>(null)

	const getDocument = _.memoize((session: string) => props.database.collection('planning').doc(session))

	React.useEffect(() => {
		return Firebase.auth().onAuthStateChanged(user => {
			if (user && user.emailVerified) {
				setCurrentUser(user)
				props.history.push('/' + session)
			} else {
				props.history.replace('/')
			}
		})
	}, [])

	if (!props.session) {
		return (
			<Lobby
				session={session}
				onSubmit={session => {
					session = session.toLowerCase()
					window.sessionStorage.setItem('session', session)

					const authProvider = new Firebase.auth.GoogleAuthProvider()
					Firebase.auth().signInWithRedirect(authProvider)
				}}
			/>
		)
	}

	if (!currentUser) {
		return null
	}

	return (
		<Planning
			currentUser={currentUser}
			document={getDocument(props.session.toLowerCase())}
			onSessionDelete={() => {
				props.history.replace('/')
			}}
		/>
	)
}