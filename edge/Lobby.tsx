import * as React from 'react'
import * as _ from 'lodash'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

import './Lobby.less'
import FlexBox from './FlexBox'

export default function Lobby(props: {
	session: string
	onSubmit?: (session: string) => void
}) {
	const [session, setSession] = React.useState(props.session)

	return (
		<FlexBox>
			<Container maxWidth='sm'>
				<Grid container direction='column' spacing={2}>
					<Grid item>
						<div className='lobby__title'>
							{'Scrum Poker'.split('')
								.map((char, rank) => char === ' ' ? ' ' : <span key={rank}>{char}</span>)}
						</div>
					</Grid>
					<Grid item>
						<TextField
							type='text'
							label='Session'
							variant='outlined'
							helperText='Create a new session and become a scrum master or join an existing one by its name. Share the session name to your colleagues.'
							InputLabelProps={{ shrink: true }}
							fullWidth
							value={session}
							onChange={e => {
								const value = e.target.value
								setSession(_.kebabCase(value) + (/\W$/.test(value) ? '-' : ''))
							}}
							onKeyUp={e => {
								if (e.key === 'Enter' && session) {
									props.onSubmit(session)
								}
							}}
							autoFocus
						/>
					</Grid>
					<Grid item className='lobby__button'>
						<Button
							size='large'
							variant='outlined'
							onClick={() => {
								props.onSubmit(session)
							}}
							disabled={!session || !props.onSubmit}
						>
							Join
						</Button>
					</Grid>
				</Grid>
			</Container>
		</FlexBox>
	)
}