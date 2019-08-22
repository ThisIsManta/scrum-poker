import * as Firebase from 'firebase/app'
import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as _ from 'lodash'
import CircularProgress from '@material-ui/core/CircularProgress'

import './Root.less'
import Lobby from './Lobby'
import Planning from './Planning'
import FlexBox from './FlexBox'

const authProvider = new Firebase.auth.GoogleAuthProvider()
authProvider.setCustomParameters({ prompt: 'select_account' })

export default function Root(props: {
	session: string
	history: RouteComponentProps['history']
	database: Firebase.firestore.Firestore
	showFlashMessage: (message: string) => void
}) {
	const session = props.session || window.sessionStorage.getItem('session') || ''
	const [loading, setLoading] = React.useState(!!session)
	const [currentUser, setCurrentUser] = React.useState<Firebase.User>(null)

	const getDocument = _.memoize((session: string) => props.database.collection('planning').doc(session.toLowerCase()))

	React.useEffect(() => {
		window.location.hash = '' // Use "loading" state instead

		return Firebase.auth().onAuthStateChanged(user => {
			if (user && user.emailVerified) {
				getDocument(session).get().then(() => {
					setCurrentUser(user)
					props.history.push('/' + session)
				}).catch(error => {
					if (error.code === 'permission-denied') {
						props.showFlashMessage(`Your email ${user.email} is denied. Only @taskworld.com emails are allowed to access this service.`)
						Firebase.auth().signOut()
					} else {
						props.showFlashMessage(_.isString(error) ? error : error.message)
					}
				}).finally(() => {
					setLoading(false)
				})

			} else {
				setCurrentUser(null)
				props.history.replace('/')
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

	if (!props.session || !currentUser) {
		return (
			<Lobby
				session={session}
				onSubmit={session => {
					session = session.toLowerCase()
					window.sessionStorage.setItem('session', session)

					Firebase.auth().signInWithRedirect(authProvider)
				}}
			/>
		)
	}

	return (
		<Planning
			currentUser={currentUser}
			document={getDocument(props.session)}
			onSessionDeleted={() => {
				props.history.replace('/')
			}}
			showFlashMessage={props.showFlashMessage}
		/>
	)
}