import * as React from 'react'
import { render } from 'react-dom'
import * as Firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { BrowserRouter, Route, RouteComponentProps } from 'react-router-dom'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'

import './index.less'
import Root from './Root'

const firebase = Firebase.initializeApp({
	apiKey: "AIzaSyBpIZCRRZC-FpsnilNZRCsUTbyw2eLc1xY",
	authDomain: "scrum-poker-3108b.firebaseapp.com",
	databaseURL: "https://scrum-poker-3108b.firebaseio.com",
	projectId: "scrum-poker-3108b",
	storageBucket: "scrum-poker-3108b.appspot.com",
	messagingSenderId: "657180291314",
	appId: "1:657180291314:web:d521e4de69812513"
})
const database = firebase.firestore()

render((
	<MuiThemeProvider theme={createMuiTheme({ palette: { type: 'dark' } })}>
		<BrowserRouter>
			<Route path='/:session' >
				{({ match, history }: RouteComponentProps<{ session: string }>) => (
					<Root
						session={match && match.params && match.params.session || ''}
						history={history}
						database={database}
					/>
				)}
			</Route>
		</BrowserRouter>
	</MuiThemeProvider>
), document.getElementById('root'))