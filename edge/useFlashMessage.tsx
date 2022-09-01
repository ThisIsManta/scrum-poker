import React, { useMemo } from 'react'
import { isError, isObject } from 'lodash-es'
import IconButton from '@mui/material/IconButton'
import ErrorIcon from '@mui/icons-material/Error'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar, SnackbarProvider } from 'notistack'

import './useFlashMessage.less'

export default function useFlashMessage() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()

	return useMemo(() => ({
		showSuccessMessage(message: React.ReactNode) {
			enqueueSnackbar(message, {
				variant: 'success',
				preventDuplicate: true,
			})
		},
		showAlertMessage(message: React.ReactNode) {
			enqueueSnackbar(message, {
				variant: 'warning',
				preventDuplicate: true,
				persist: true,
				action: (key: string | number) => (
					<IconButton
						key="close"
						color="inherit"
						size="small"
						onClick={() => {
							closeSnackbar(key)
						}}
					>
						<CloseIcon />
					</IconButton>
				),
			})
		},
		showErrorMessage(error: React.ReactNode | Error | unknown) {
			const message: React.ReactNode = (() => {
				if (isError(error)) {
					return error.message
				}

				if (typeof error === 'string') {
					return error
				}

				if (isObject(error) && React.isValidElement(error)) {
					return error
				}

				return String(error) || 'Unknown error occurred'
			})()

			enqueueSnackbar(message, {
				variant: 'error',
				preventDuplicate: true,
				persist: true,
				action: (key: string | number) => (
					<IconButton
						key="close"
						color="inherit"
						size="small"
						onClick={() => {
							closeSnackbar(key)
						}}
					>
						<CloseIcon />
					</IconButton>
				),
			})
		},
		hideMessages() {
			closeSnackbar()
		},
	}), [])
}

export function FlashMessageProvider(props: { children: React.ReactNode }) {
	return (
		<SnackbarProvider
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'center',
			}}
			iconVariant={{
				success: <CheckCircleIcon />,
				warning: null,
				error: <ErrorIcon />,
			}}
		>
			{props.children}
		</SnackbarProvider>
	)
}
