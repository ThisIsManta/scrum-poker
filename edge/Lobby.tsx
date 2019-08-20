import * as React from 'react'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

import './Lobby.less'

export default function Lobby(props: {
	session: string
	acronym: string
	onSubmit: (session: string, acronym: string) => void
}) {
	const [session, setSession] = React.useState(props.session)
	const [acronym, setAcronym] = React.useState(props.acronym)

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
								setSession(e.target.value)
							}}
							autoFocus={session === ''}
						/>
					</Grid>
					<Grid item>
						<TextField
							type='text'
							label='Acronym'
							variant='outlined'
							fullWidth
							value={acronym}
							onChange={e => {
								setAcronym(e.target.value)
							}}
							inputProps={{ minLength: 2, maxLength: 2 }}
						/>
					</Grid>
					<Grid item className='lobby__button'>
						<Button
							size='large'
							variant='outlined'
							onClick={() => {
								props.onSubmit(session, acronym)
							}}
							disabled={!session.trim() || !acronym.trim()}
						>
							Join
						</Button>
					</Grid>
				</Grid>
			</Container>
		</div>
	)
}