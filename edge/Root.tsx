import * as Firebase from 'firebase/app'
import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as _ from 'lodash'
import CircularProgress from '@material-ui/core/CircularProgress'

import './Root.less'
import Lobby from './Lobby'
import Planning from './Planning'
import FlexBox from './FlexBox'

function signIn() {
	const authProvider = new Firebase.auth.GoogleAuthProvider()
	authProvider.setCustomParameters({ prompt: 'select_account' })
	Firebase.auth().signInWithRedirect(authProvider)
}

export default function Root(props: {
	session: string
	navigateTo: (session: string) => void
	showFlashMessage: (message: string) => void
}) {
	const [loading, setLoading] = React.useState(true)
	const [currentUser, setCurrentUser] = React.useState<Firebase.User>(null)

	const getDocument = _.memoize((session: string) => Firebase.firestore().collection('planning').doc(session.toLowerCase()))

	React.useEffect(() => {
		Firebase.initializeApp({
			apiKey: "AIzaSyBpIZCRRZC-FpsnilNZRCsUTbyw2eLc1xY",
			authDomain: "scrum-poker-3108b.firebaseapp.com",
			databaseURL: "https://scrum-poker-3108b.firebaseio.com",
			projectId: "scrum-poker-3108b",
			storageBucket: "scrum-poker-3108b.appspot.com",
			messagingSenderId: "657180291314",
			appId: "1:657180291314:web:d521e4de69812513"
		})

		if (!props.session) {
			setLoading(false)
			return
		}

		return Firebase.auth().onAuthStateChanged(user => {
			if (user && user.emailVerified) {
				getDocument(props.session).get().then(() => {
					setCurrentUser(user)
				}).catch(error => {
					if (error.code === 'permission-denied') {
						props.showFlashMessage(`Your email ${user.email} is denied. Only @taskworld.com emails are allowed to access this service.`)
					} else {
						props.showFlashMessage(_.isString(error) ? error : error.message)
					}
					props.navigateTo('')
				}).finally(() => {
					setLoading(false)
				})

			} else if (props.session) {
				signIn()

			} else {
				setCurrentUser(null)
				props.navigateTo('')
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
				session={window.sessionStorage.getItem('session') || ''}
				onSubmit={session => {
					session = session.toLowerCase()
					window.sessionStorage.setItem('session', session)

					props.navigateTo(session)
					signIn()
				}}
			/>
		)
	}

	return (
		<Planning
			currentUser={currentUser}
			document={getDocument(props.session)}
			onSessionDeleted={() => {
				props.navigateTo('')
			}}
			showFlashMessage={props.showFlashMessage}
		/>
	)
}