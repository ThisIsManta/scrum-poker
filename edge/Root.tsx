import * as Firebase from 'firebase/app'
import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as _ from 'lodash'
import CircularProgress from '@material-ui/core/CircularProgress'

import Lobby from './Lobby'
import Planning from './Planning'
import Box from './Box'

const authProvider = new Firebase.auth.GoogleAuthProvider()
authProvider.setCustomParameters({ prompt: 'select_account' })

export default function Root(props: {
	session: string
	history: RouteComponentProps['history']
	database: Firebase.firestore.Firestore
	showFlashMessage: (message: string) => void
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
				setCurrentUser(null)
				props.history.replace('/')
			}
		})
	}, [])

	if (window.location.hash === '#loading') {
		return (
			<Box>
				<CircularProgress color='primary' />
			</Box>
		)
	}

	if (!props.session || !currentUser) {
		return (
			<Lobby
				session={session}
				onSubmit={session => {
					session = session.toLowerCase()
					window.sessionStorage.setItem('session', session)

					window.location.hash = '#loading'
					Firebase.auth().signInWithRedirect(authProvider)
				}}
			/>
		)
	}

	return (
		<Planning
			currentUser={currentUser}
			document={getDocument(props.session.toLowerCase())}
			navigateToLobby={() => {
				props.history.replace('/')
			}}
			showFlashMessage={props.showFlashMessage}
		/>
	)
}