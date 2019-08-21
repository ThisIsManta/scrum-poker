import * as React from 'react'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

import './Lobby.less'

export default function Lobby(props: {
	session: string
	onSubmit?: (session: string) => void
}) {
	const [session, setSession] = React.useState(props.session)

	return (
		<div className='lobby'>
			<Container maxWidth='sm'>
				<Grid container direction='column' spacing={2}>
					<Grid item>
						<TextField
							type='text'
							label='Session'
							variant='outlined'
							fullWidth
							value={session}
							onChange={e => {
								setSession(e.target.value.toLowerCase())
							}}
							autoFocus={session === ''}
						/>
					</Grid>
					<Grid item className='lobby__button'>
						<Button
							size='large'
							variant='outlined'
							onClick={() => {
								props.onSubmit(session)
							}}
							disabled={!session.trim() || !props.onSubmit}
						>
							Join
						</Button>
					</Grid>
				</Grid>
			</Container>
		</div>
	)
}