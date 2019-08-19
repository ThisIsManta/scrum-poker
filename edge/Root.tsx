import * as Firebase from 'firebase'
import * as React from 'react'
import { BrowserRouter, Route, RouteComponentProps } from 'react-router-dom'

import Lobby from './Lobby'
import Planning from './Planning'

export default function Root(props: { database: Firebase.firestore.Firestore }) {
	return (
		<BrowserRouter>
			<Route exact path='/'>
				{() => <Lobby />}
			</Route>
			<Route path='/:session' >
				{(props: RouteComponentProps<{ session: string }> & { database: Firebase.firestore.Firestore }) => (
					<Planning session={props.match.params.session} database={props.database} />
				)}
			</Route>
		</BrowserRouter>
	)
}