import React, { useCallback, useEffect, useRef, useState } from 'react'
import Popper, { PopperProps } from '@mui/material/Popper'
import Paper from '@mui/material/Paper'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { noop } from 'lodash-es'

import './PopupTutorial.less'

const lightTheme = createTheme({ palette: { mode: 'light' } })

export default function PopupTutorial(props: PopperProps & { children: React.ReactNode }) {
	return (
		<ThemeProvider theme={lightTheme}>
			<Popper
				{...props}
				className='popup-tutorial'
			>
				<Paper className='popup-tutorial__content' elevation={12}>
					{props.children}
				</Paper>
			</Popper>
		</ThemeProvider>
	)
}

export function useTutorial(
	startMilliseconds: number | undefined,
	delayMilliseconds: number,
	elementQuery: string,
	placement: PopperProps['placement'],
	content: React.ReactNode,
): [React.ReactElement | null, () => void] {
	const persistentStorageKey = 'tutorial(' + elementQuery + ')'

	const timeoutID = useRef<number>()
	const [visible, setVisible] = useState(false)
	const [dismissed, setDismissed] = useState(!!window.localStorage.getItem(persistentStorageKey))

	useEffect(() => {
		if (startMilliseconds) {
			if (dismissed) {
				return
			}

			const countdownMilliseconds = Math.max(0, startMilliseconds + delayMilliseconds - Date.now())
			if (countdownMilliseconds > 1000) {
				setVisible(false)
			}
			timeoutID.current = window.setTimeout(() => {
				timeoutID.current = undefined
				setVisible(true)
			}, countdownMilliseconds)

			return () => {
				if (timeoutID.current) {
					window.clearTimeout(timeoutID.current)
				}
			}

		} else {
			window.clearTimeout(timeoutID.current)
			setVisible(false)
		}
	}, [startMilliseconds, dismissed])

	const anchorEl = useCallback(() => document.querySelector(elementQuery)!, [elementQuery])

	const dismiss = useCallback(() => {
		setDismissed(true)

		window.localStorage.setItem(persistentStorageKey, new Date().toISOString())
	}, [])

	if (dismissed) {
		return [null, noop]
	}

	const element = (
		<PopupTutorial
			open={visible}
			anchorEl={anchorEl}
			placement={placement}
			onClick={dismiss}
		>
			{content}
		</PopupTutorial>
	)

	return [element, dismiss]
}