import * as _ from 'lodash'
import * as React from 'react'
import { render } from 'react-dom'
import 'firebase/auth'
import 'firebase/firestore'
import { BrowserRouter, Switch, Route, Redirect, RouteComponentProps } from 'react-router-dom'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'

import './index.less'
import Root from './Root'
import Flash from './Flash'

render((
	<MuiThemeProvider theme={createMuiTheme({ palette: { type: 'dark', primary: { main: '#ffffff' } } })}>
		<BrowserRouter>
			<Switch>
				<Route path='/scrum-poker' >
					{({ history, location }: RouteComponentProps<{ session: string }>) => (
						<Flash>
							{showFlashMessage => (
								<Root
									session={location.search.replace(/^\?/, '')}
									navigateTo={session => {
										history.push('/scrum-poker' + (session ? '?' + session : ''))
									}}
									showFlashMessage={showFlashMessage}
								/>

							)}
						</Flash>
					)}
				</Route>
				<Route>
					{/* Because of GitHub Pages, the path name must start with "/scrum-poker" */}
					<Redirect to='/scrum-poker' />
				</Route>
			</Switch>
		</BrowserRouter>
	</MuiThemeProvider>
), document.getElementById('root'))