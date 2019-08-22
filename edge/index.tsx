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
				<Route path={['/scrum-poker/:session', '/scrum-poker' /* Do not re-arrange this as "session" might always be an empty string */]} >
					{({ match, history, location }: RouteComponentProps<{ session: string }>) => (
						<Flash>
							{showFlashMessage => (
								<Root
									session={match && match.params && match.params.session || ''}
									navigateTo={session => {
										const newPath = '/scrum-poker/' + _.trim(session, '/')
										const oldPath = _.trimEnd(location.pathname, '/')
										if (newPath !== oldPath) {
											history.push(newPath)
										}
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