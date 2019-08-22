import * as React from 'react'
import { render } from 'react-dom'
import 'firebase/auth'
import 'firebase/firestore'
import { BrowserRouter, Route, RouteComponentProps } from 'react-router-dom'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'

import './index.less'
import Root from './Root'
import Flash from './Flash'

render((
	<MuiThemeProvider theme={createMuiTheme({ palette: { type: 'dark', primary: { main: '#ffffff' } } })}>
		<BrowserRouter>
			<Route path='/:session' >
				{({ match, history }: RouteComponentProps<{ session: string }>) => (
					<Flash>
						{showFlashMessage => (
							<Root
								session={match && match.params && match.params.session || ''}
								history={history}
								showFlashMessage={showFlashMessage}
							/>

						)}
					</Flash>
				)}
			</Route>
		</BrowserRouter>
	</MuiThemeProvider>
), document.getElementById('root'))