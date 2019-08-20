import * as Firebase from 'firebase'
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
	const session = props.session || window.localStorage.getItem('session') || ''
	const acronym = window.localStorage.getItem('acronym') || ''

	const getDocument = _.memoize((session: string) => props.database.collection('planning').doc(session))

	if (!acronym || !props.session) {
		return (
			<Lobby
				session={session}
				acronym={acronym}
				onSubmit={(session, acronym) => {
					session = session.toLowerCase()
					window.localStorage.setItem('session', session)

					acronym = acronym.toUpperCase()
					window.localStorage.setItem('acronym', acronym)

					props.history.push('/' + session)
				}}
			/>
		)
	}

	return (
		<Planning
			acronym={acronym}
			document={getDocument(session.toLowerCase())}
			onSessionDelete={() => {
				props.history.replace('/')
			}}
		/>
	)
}