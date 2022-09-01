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
							label='Session'
							variant='outlined'
							helperText='Create a new session and become a scrum master or join an existing one by its name. Share the session name to your colleagues.'
							InputLabelProps={{ shrink: true }}
							fullWidth
							value={sessionName}
							onChange={e => {
								const value = e.target.value.trim()
								setSessionName(urlFriendlyCase(value))
							}}
							onKeyUp={e => {
								if (e.key === 'Enter' && sessionName && props.onSubmit) {
									props.onSubmit(sessionName)
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
								props.onSubmit(sessionName)
							}}
							disabled={!sessionName}
						>
							Join
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
