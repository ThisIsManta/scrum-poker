import React, { useMemo } from 'react'
import { isError, isObject } from 'lodash-es'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { useSnackbar } from 'notistack'

export default function useFlashMessage() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()

	return useMemo(() => ({
		showSuccessMessage(message: React.ReactNode) {
			enqueueSnackbar(message, {
				variant: 'success',
				preventDuplicate: true,
			})
		},
		showErrorMessage(error: React.ReactNode | Error | unknown) {
			console.error(error)

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
