import React from 'react'
import { createRoot } from 'react-dom/client'
import 'firebase/auth'
import 'firebase/firestore'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'

import './index.less'
import Root from './Root'
import packageJSON from '../package.json'

const repositoryName = packageJSON.repository.url.match(/\/([\w-]+?)\.git$/)![1]
const landingPath = '/' + repositoryName

const root = createRoot(document.getElementById('root')!)
root.render(
	<ThemeProvider theme={createTheme({ palette: { mode: 'dark', primary: { main: '#ffffff' } } })}>
		<SnackbarProvider
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'center',
			}}
		>
			<BrowserRouter>
				<Routes >
					<Route path={landingPath} element={<Root />} />
					<Route>
						{/* Because of GitHub Pages, the path name must start with the name of the repository */}
						<Navigate to={landingPath} />
					</Route>
				</Routes>
			</BrowserRouter>
		</SnackbarProvider>
	</ThemeProvider>
)
