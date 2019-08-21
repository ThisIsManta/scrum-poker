import * as React from 'react'

import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'

import './Flash.less'

export default function Flash(props: {
	children: React.ReactNode
	onClose: () => void
}) {
	return (
		<Snackbar
			open={!!props.children}
			anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			onClose={props.onClose}
		>
			<SnackbarContent
				className='flash'
				message={props.children}
				action={
					<IconButton
						key="close"
						aria-label="close"
						color="inherit"
						onClick={props.onClose}
					>
						<Icon>close</Icon>
					</IconButton>
				}
			/>
		</Snackbar>
	)
}