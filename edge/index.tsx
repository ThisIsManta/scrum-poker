import React from 'react'
import { createRoot } from 'react-dom/client'
import 'firebase/auth'
import 'firebase/firestore'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import './index.less'
import Root from './Root'
import { FlashMessageProvider } from './useFlashMessage'

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
			<Root />
		</FlashMessageProvider>
	</ThemeProvider>
)
