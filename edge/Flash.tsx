import * as React from 'react'

import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'

import './Flash.less'

export default function Flash(props: {
	children: (setMessage: (message: string) => void) => React.ReactNode
}) {
	const [message, setMessage] = React.useState<string>(null)

	const onClose = () => { setMessage(null) }

	return (
		<React.Fragment>
			<Snackbar
				open={!!message}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={onClose}
			>
				<SnackbarContent
					color='error'
					className='flash'
					message={message}
					action={
						<IconButton
							key='close'
							aria-label='close'
							color='inherit'
							onClick={onClose}
						>
							<Icon>close</Icon>
						</IconButton>
					}
				/>
			</Snackbar>
			{props.children(setMessage)}
		</React.Fragment>
	)
}