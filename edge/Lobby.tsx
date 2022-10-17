import React, { useState } from 'react'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import './Lobby.less'
import FlexBox from './FlexBox'

export default function Lobby(props: {
	sessionName: string
	onSubmit: (sessionName: string) => void
}) {
	const [sessionName, setSessionName] = useState(props.sessionName)

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
							label='Session name'
							variant='outlined'
							helperText='Use a hard-to-guess session name to prevent unwanted people joining your session.'
							InputLabelProps={{ shrink: true }}
							InputProps={{ className: 'lobby__session-input' }}
							fullWidth
							value={sessionName}
							onChange={e => {
								const value = e.target.value
								setSessionName(urlFriendlyCase(value))
							}}
							onKeyUp={e => {
								if (e.key === 'Enter' && sessionName && props.onSubmit) {
									props.onSubmit(sessionName)
								} else if (e.key === 'Escape') {
									setSessionName('')
								}
							}}
							autoFocus
						/>
					</Grid>
					<Grid item className='lobby__button'>
						<Button
							size='large'
							variant='contained'
							onClick={() => {
								props.onSubmit(sessionName)
							}}
							disabled={!sessionName}
						>
							Enter
						</Button>
					</Grid>
				</Grid>
			</Container>
		</FlexBox>
	)
}

function urlFriendlyCase(text: string) {
	return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-/, '').substring(0, 256)
}
