import Firebase from 'firebase/app'
import React, { useState, useEffect } from 'react'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Input from '@mui/material/Input'
import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import Slide from '@mui/material/Slide'
import TuneIcon from '@mui/icons-material/Tune'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import QrCodeIcon from '@mui/icons-material/QrCode2'
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import EjectIcon from '@mui/icons-material/Eject'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import CallMissedOutgoingIcon from '@mui/icons-material/CallMissedOutgoing'
import ClearIcon from '@mui/icons-material/Clear'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { noop, mapValues, isEmpty, isError, every, compact, without, sortBy, orderBy } from 'lodash-es'
import FlipMove from 'react-flip-move'
import * as QRCode from 'qrcode'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import FlexBox from './FlexBox'
import Timer from './Timer'
import { getAcronym } from './getAcronym'
import useFlashMessage from './useFlashMessage'

// Bypass the issue when using FlipMove with React v18
// See https://github.com/joshwcomeau/react-flip-move/issues/273
const FlipMoveHack = FlipMove as any as React.ComponentType<{ className: string, children: React.ReactNode }>

export enum PredefinedScore {
	P0 = '0',
	P1 = '1',
	P2 = '2',
	P3 = '3',
	P5 = '5',
	P8 = '8',
	P13 = '13',
	P21 = '21',
	Infinity = '∞',
	NonDeterminable = '?',
}

interface ISession {
	master: string
	players: { [email: string]: { firstScore: string, lastScore: string, timestamp: string } }
	scores: string[]
}

const basisPlayerScore = {
	firstScore: '',
	lastScore: '',
	timestamp: new Date().toISOString(),
}

export default function Planning(props: {
	currentUserEmail: string
	document: Firebase.firestore.DocumentReference
	onSessionDeleted: () => void
}) {
	const [data, setData] = useState<ISession>()
	const [speedDialMenuVisible, setSpeedDialMenuVisible] = useState(false)
	const [personRemovalDialogVisible, setRemovalPersonDialogVisible] = useState(false)
	const [scrumMasterTransferDialogVisible, setScrumMasterTransferDialogVisible] = useState(false)
	const [scoreSelectionDialogVisible, setScoreSelectionDialogVisible] = useState(false)
	const [invitationQRCode, setInvitationQRCode] = useState<string | null>(null)
	const [customScore, setCustomScore] = useState('')
	const [beginning, setBeginning] = useState(Date.now())
	const { showErrorMessage } = useFlashMessage()

	useEffect(() => {
		let unsubscribe = noop;
		let unmounted = false;

		(async () => {
			let { exists } = await props.document.get()
			if (!exists) {
				const session: ISession = {
					master: props.currentUserEmail,
					players: {},
					scores: Object.values(PredefinedScore),
				}
				await props.document.set(session)
			}

			const session = (await props.document.get()).data() as ISession
			if (session.master !== props.currentUserEmail && session.players[props.currentUserEmail] === undefined) {
				await props.document.update(
					new Firebase.firestore.FieldPath('players', props.currentUserEmail),
					basisPlayerScore
				)
			}

			if (unmounted) {
				return
			}

			unsubscribe = props.document.onSnapshot(snapshot => {
				const session = snapshot.data() as ISession

				if (!session || session.players[props.currentUserEmail] === undefined && session.master !== props.currentUserEmail) {
					showErrorMessage('You have been removed from the session')
					props.onSessionDeleted()
					return
				}

				setData(session)
			})
		})()

		return () => {
			unmounted = true
			unsubscribe()
		}
	}, [])

	const onSessionReset = () => {
		props.document.update({
			players: mapValues(data?.players || {}, player => ({
				...player,
				firstScore: '',
				lastScore: '',
			})),
		})

		setBeginning(Date.now())
	}

	const onPersonRemoved = (email: string) => {
		props.document.update(
			new Firebase.firestore.FieldPath('players', email),
			Firebase.firestore.FieldValue.delete()
		)
	}

	if (!data) {
		return null
	}

	const currentUserIsScrumMaster = data.master === props.currentUserEmail
	const currentUserCanVote = !!data.players[props.currentUserEmail]

	const everyoneIsVoted = isEmpty(data.players) === false &&
		every(data.players, player => player.lastScore !== '')

	const otherPlayerEmails = sortBy(without(Object.keys(data.players), props.currentUserEmail))

	const floatingButtons = (
		<div className='planning__buttons'>
			{currentUserIsScrumMaster && everyoneIsVoted && (
				<Fab color='primary' onClick={onSessionReset}>
					<AutorenewIcon />
				</Fab>
			)}

			<SpeedDial
				ariaLabel='SpeedDial'
				open={speedDialMenuVisible}
				icon={<TuneIcon />}
				onClick={() => {
					setSpeedDialMenuVisible(value => !value)
				}}
			>
				{currentUserIsScrumMaster && (<SpeedDialAction
					className='planning__speed-dial'
					icon={<QrCodeIcon />}
					tooltipTitle='Show QRCode'
					tooltipOpen
					onClick={() => {
						QRCode.toDataURL(window.location.href, { width: 600 }, (error, url) => {
							if (error) {
								window.alert(isError(error) ? error.message : String(error))
								return
							}

							setInvitationQRCode(url)
						})
						setSpeedDialMenuVisible(false)
					}}
				/>)}
				{currentUserIsScrumMaster && <SpeedDialAction
					className='planning__speed-dial'
					icon={currentUserCanVote ? <IndeterminateCheckBoxIcon /> : <CheckBoxIcon />}
					tooltipTitle={currentUserCanVote ? 'Leave the voting' : 'Join the voting'}
					tooltipOpen
					onClick={() => {
						props.document.update(
							new Firebase.firestore.FieldPath('players', data.master),
							currentUserCanVote ? Firebase.firestore.FieldValue.delete() : basisPlayerScore,
						)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster && <SpeedDialAction
					className='planning__speed-dial'
					icon={<DashboardCustomizeIcon />}
					tooltipTitle='Edit scores'
					tooltipOpen
					onClick={() => {
						setScoreSelectionDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster && otherPlayerEmails.length > 0 && <SpeedDialAction
					className='planning__speed-dial'
					icon={<RemoveCircleOutlineIcon />}
					tooltipTitle='Remove a person'
					tooltipOpen
					onClick={() => {
						setRemovalPersonDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster && otherPlayerEmails.length > 0 && <SpeedDialAction
					className='planning__speed-dial'
					icon={<EjectIcon />}
					tooltipTitle='Transfer scrum master role'
					tooltipOpen
					onClick={() => {
						setRemovalPersonDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster ? (<SpeedDialAction
					className='planning__speed-dial'
					icon={<DeleteForeverIcon />}
					tooltipTitle='Delete this session'
					tooltipOpen
					onClick={() => {
						props.document.delete()
					}}
				/>) : (<SpeedDialAction
					className='planning__speed-dial'
					icon={<CallMissedOutgoingIcon />}
					tooltipTitle='Leave this session'
					tooltipOpen
					onClick={() => {
						onPersonRemoved(props.currentUserEmail)
					}}
				/>)}
			</SpeedDial>

			<Dialog open={!!invitationQRCode} onClose={() => { setInvitationQRCode(null) }}>
				<img src={invitationQRCode!} style={{ width: '100%', height: '100%' }} />
			</Dialog>

			<Dialog open={personRemovalDialogVisible} onClose={() => { setRemovalPersonDialogVisible(false) }}>
				<DialogTitle>Remove a person</DialogTitle>
				<List>
					{otherPlayerEmails.map(email => (
						<ListItem button key={email} onClick={() => {
							onPersonRemoved(email)
							setRemovalPersonDialogVisible(false)
						}}>
							{getAcronym(email)} ({email})
						</ListItem>
					))}
				</List>
			</Dialog>

			<Dialog open={scrumMasterTransferDialogVisible} onClose={() => { setScrumMasterTransferDialogVisible(false) }}>
				<DialogTitle>Transfer scrum master role</DialogTitle>
				<List>
					{otherPlayerEmails.map(email => (
						<ListItem button key={email} onClick={() => {
							props.document.update({
								master: email,
							})
							if (!currentUserCanVote) {
								props.document.update(
									new Firebase.firestore.FieldPath('players', props.currentUserEmail),
									basisPlayerScore,
								)
							}
							setScrumMasterTransferDialogVisible(false)
						}}>
							{getAcronym(email)} ({email})
						</ListItem>
					))}
				</List>
			</Dialog>

			<Dialog open={scoreSelectionDialogVisible} onClose={() => { setScoreSelectionDialogVisible(false) }}>
				<DialogTitle>Edit scores</DialogTitle>
				<List>
					{data.scores.map(score => (
						<ListItem key={score}>
							{score}
							<ListItemSecondaryAction>
								<IconButton edge="end" aria-label="delete" onClick={() => {
									props.document.update(
										new Firebase.firestore.FieldPath('scores'),
										Firebase.firestore.FieldValue.arrayRemove(score),
										// Remove the select score from the players who voted
										...Object.entries(data.players)
											.filter(([email, player]) => player.firstScore === score || player.lastScore === score)
											.flatMap(([email, player]) => [
												new Firebase.firestore.FieldPath('players', email),
												{
													...player,
													firstScore: '',
													lastScore: '',
													timestamp: new Date().toISOString()
												}
											])
									)
								}}>
									<ClearIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))}
					<ListItem>
						<form onSubmit={(e) => {
							e.preventDefault()

							if (customScore === '' || data.scores.includes(customScore)) {
								return
							}

							props.document.update(
								new Firebase.firestore.FieldPath('scores'),
								sortBy(
									[...data.scores, customScore],
									score => score === '?' ? 1 : 0,
									score => /[¼½¾]/.test(score) ? '0' : score,
								)
							)

							setCustomScore('')
						}}>
							<Input
								type="text"
								placeholder="Custom score"
								fullWidth
								value={customScore}
								onChange={e => {
									setCustomScore(e.target.value.trim())
								}}
							/>
							<ListItemSecondaryAction>
								<IconButton type="submit" edge="end" aria-label="add">
									<AddCircleIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</form>
					</ListItem>
				</List>
			</Dialog>
		</div >
	)

	const timer = currentUserIsScrumMaster && isEmpty(data.players) === false && (
		<div className='planning__timer'>
			<Timer beginning={beginning} />
		</div>
	)

	const myScore = currentUserCanVote ? data.players[props.currentUserEmail].lastScore : ''

	if (everyoneIsVoted) {
		const sortedScores = orderBy(
			data.scores.map(score => ({
				score,
				count: Object.entries(data.players).filter(([email, player]) => player.firstScore === score).length,
			})),
			result => result.count, 'desc'
		).map(result => result.score)

		const finalResults = sortedScores
			.map(score => ({
				score,
				voters: sortBy(
					Object.entries(data.players).filter(([, player]) => player.lastScore === score),
					([, player]) => player.timestamp
				)
			}))

		return (
			<React.Fragment>
				{timer}
				<Container className='planning__results' maxWidth='sm'>
					<Slide direction='up' in timeout={900}>
						<Grid container direction='column' spacing={2}>
							{finalResults.map(({ score, voters }) => (
								<Grid item key={score}>
									<Grid container direction='row' spacing={2}>
										<Grid item>
											<Card
												selected={currentUserCanVote ? score === myScore : false}
												onClick={currentUserCanVote ? (() => {
													if (score === myScore) {
														return
													}

													props.document.update(
														new Firebase.firestore.FieldPath('players', props.currentUserEmail),
														{
															...data.players[props.currentUserEmail],
															lastScore: score,
															timestamp: new Date().toISOString(),
														}
													)
												}) : undefined}
											>
												{score}
											</Card>
										</Grid>
										<Grid item className='planning__flex-full'>
											<FlipMoveHack className='planning__players --left'>
												{voters.map(([email]) => (
													<div key={email}>
														<Avatar email={email} />
													</div>
												))}
											</FlipMoveHack>
										</Grid>
									</Grid>
								</Grid>
							))}
						</Grid>
					</Slide>
				</Container>
				{floatingButtons}
			</React.Fragment>
		)
	}

	if (currentUserIsScrumMaster && !currentUserCanVote) {
		return (
			<React.Fragment>
				{timer}
				<FlexBox>
					{isEmpty(data.players)
						? <span className='planning__hint'>You are the scrum master — waiting for others to join this session.</span>
						: <PeerProgress players={data.players} grand />}
				</FlexBox>
				{floatingButtons}
			</React.Fragment>
		)
	}

	return (
		<React.Fragment>
			<PeerProgress players={data.players} />
			<div className='planning__cards'>
				{data.scores.map(score => (
					<Card
						key={score}
						selected={score === myScore}
						onClick={() => {
							props.document.update(
								new Firebase.firestore.FieldPath('players', props.currentUserEmail),
								{
									...data.players[props.currentUserEmail],
									firstScore: score,
									lastScore: score,
									timestamp: new Date().toISOString(),
								}
							)
						}}
					>
						{score}
					</Card>
				))}
			</div>
			{floatingButtons}
		</React.Fragment>
	)
}

function PeerProgress(props: {
	players: ISession['players']
	grand?: boolean
}) {
	const sortedPlayers = sortBy(
		Object.entries(props.players).map(([email, player]) => ({ ...player, email })),
		player => player.lastScore === '' ? 1 : 0,
		player => player.timestamp
	)

	return (
		<FlipMoveHack className={compact(['planning__players', '--free', props.grand && '--tall']).join(' ')}>
			{sortedPlayers.map(({ email, lastScore }) =>
				<div key={email}>
					<Avatar email={email} faded={lastScore === ''} size={props.grand ? 120 : 36} />
				</div>
			)}
		</FlipMoveHack>
	)
}