import React, { useState } from 'react'
import { kebabCase } from 'lodash-es'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import './Lobby.less'
import FlexBox from './FlexBox'

export default function Lobby(props: {
	sessionName: string
	onSubmit?: (sessionName: string) => void
}) {
	const [session, setSession] = useState(props.sessionName)

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
								setSession(kebabCase(value) + (/\W$/.test(value) ? '-' : ''))
							}}
							onKeyUp={e => {
								if (e.key === 'Enter' && session && props.onSubmit) {
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
								props.onSubmit?.(session)
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