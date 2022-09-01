import React from 'react'
import { createRoot } from 'react-dom/client'
import 'firebase/auth'
import 'firebase/firestore'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import './index.less'
import Root from './Root'
import { FlashMessageProvider } from './useFlashMessage'
import packageJSON from '../package.json'

const repositoryName = packageJSON.repository.url.match(/\/([\w-]+?)\.git$/)![1]
const landingPath = '/' + repositoryName

const theme = createTheme({
	palette: {
		mode: 'dark',
		primary: {
			main: '#ffffff'
		},
	},
})

const root = createRoot(document.getElementById('root')!)
root.render(
	<ThemeProvider theme={theme}>
		<FlashMessageProvider>
			<BrowserRouter>
				<Routes >
					<Route path={landingPath} element={<Root />} />

					{/* Because of GitHub Pages, the path name must start with the name of the repository */}
					<Route path='/' element={<Navigate to={landingPath} />}>
					</Route>
				</Routes>
			</BrowserRouter>
		</FlashMessageProvider>
	</ThemeProvider>
)
