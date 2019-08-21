import * as Firebase from 'firebase/app'
import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as _ from 'lodash'

import Lobby from './Lobby'
import Planning from './Planning'
import Flash from './Flash'

export default function Root(props: {
	session: string
	history: RouteComponentProps['history']
	database: Firebase.firestore.Firestore
}) {
	const session = props.session || window.sessionStorage.getItem('session') || ''
	const [currentUser, setCurrentUser] = React.useState<Firebase.User>(null)
	const [message, setMessage] = React.useState<string>(null)

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

	const flashMessage = (
		<Flash onClose={() => { setMessage(null) }}>{message}</Flash>
	)

	if (!props.session) {
		return (
			<React.Fragment>
				<Lobby
					session={session}
					onSubmit={session => {
						session = session.toLowerCase()
						window.sessionStorage.setItem('session', session)

						const authProvider = new Firebase.auth.GoogleAuthProvider()
						Firebase.auth().signInWithRedirect(authProvider)
					}}
				/>
				{flashMessage}
			</React.Fragment>
		)
	}

	if (!currentUser) {
		return null
	}

	return (
		<React.Fragment>
			<Planning
				currentUser={currentUser}
				document={getDocument(props.session.toLowerCase())}
				navigateToLobby={() => {
					props.history.replace('/')
				}}
				showFlashMessage={message => {
					setMessage(message)
				}}
			/>
			{flashMessage}
		</React.Fragment>
	)
}