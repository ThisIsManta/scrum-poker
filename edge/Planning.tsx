import React, { useState } from 'react'
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
import AutoRenewIcon from '@mui/icons-material/Autorenew'
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
import { isEmpty, isError, every, compact, without, sortBy, orderBy } from 'lodash-es'
import FlipMove from 'react-flip-move'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import FlexBox from './FlexBox'
import Timer from './Timer'
import { getAcronym } from './getAcronym'
import { Session, SessionData } from './useSession'

// Bypass the issue when using FlipMove with React v18
// See https://github.com/joshwcomeau/react-flip-move/issues/273
const FlipMoveHack = FlipMove as any as React.ComponentType<{ className: string, children: React.ReactNode }>

export default function Planning(props: {
	currentUserEmail: string
	session: Session
}) {
	const [speedDialMenuVisible, setSpeedDialMenuVisible] = useState(false)
	const [personRemovalDialogVisible, setRemovalPersonDialogVisible] = useState(false)
	const [scrumMasterTransferDialogVisible, setScrumMasterTransferDialogVisible] = useState(false)
	const [scoreSelectionDialogVisible, setScoreSelectionDialogVisible] = useState(false)
	const [invitationQRCode, setInvitationQRCode] = useState<string | null>(null)
	const [customScore, setCustomScore] = useState('')
	const [beginning, setBeginning] = useState(Date.now())

	const onSessionReset = () => {
		props.session.clearAllVotes()

		setBeginning(Date.now())
	}

	const currentUserIsScrumMaster = props.session.data.master === props.currentUserEmail
	const currentUserCanVote = !!props.session.data.players[props.currentUserEmail]

	const everyoneIsVoted = isEmpty(props.session.data.players) === false &&
		every(props.session.data.players, player => player.lastScore !== '')

	const otherPlayerEmails = sortBy(without(Object.keys(props.session.data.players), props.currentUserEmail))

	const floatingButtons = (
		<div className='planning__buttons'>
			{currentUserIsScrumMaster && everyoneIsVoted && (
				<Fab color='primary' onClick={onSessionReset}>
					<AutoRenewIcon />
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
					onClick={async () => {
						const QRCode = await import('qrcode')
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
						if (currentUserCanVote) {
							props.session.removePlayer(props.currentUserEmail)
						} else {
							props.session.clearVote(props.currentUserEmail)
						}
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
						props.session.destroy()
					}}
				/>) : (<SpeedDialAction
					className='planning__speed-dial'
					icon={<CallMissedOutgoingIcon />}
					tooltipTitle='Leave this session'
					tooltipOpen
					onClick={() => {
						props.session.removePlayer(props.currentUserEmail)
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
							props.session.removePlayer(email)
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
							props.session.transferScrumMasterRole(email)
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
					{props.session.data.scores.map(score => (
						<ListItem key={score}>
							{score}
							<ListItemSecondaryAction>
								<IconButton edge="end" aria-label="delete" onClick={() => {
									props.session.removeScore(score)
								}}>
									<ClearIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))}
					<ListItem>
						<form onSubmit={async (e) => {
							e.preventDefault()

							if (customScore === '' || props.session.data.scores.includes(customScore)) {
								return
							}

							await props.session.setSelectableScores(sortBy(
								[...props.session.data.scores, customScore],
								score => score === '?' ? 1 : 0,
								score => {
									if (score === '¼') {
										return 0.25
									}
									if (score === '½') {
										return 0.5
									}
									if (score === '¾') {
										return 0.75
									}
									if (isFinite(parseFloat(score))) {
										return parseFloat(score)
									}
									return score
								}
							))

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

	const timer = currentUserIsScrumMaster && isEmpty(props.session.data.players) === false && (
		<div className='planning__timer'>
			<Timer beginning={beginning} />
		</div>
	)

	const myScore = currentUserCanVote ? props.session.data.players[props.currentUserEmail].lastScore : ''

	if (everyoneIsVoted) {
		const sortedScores = orderBy(
			props.session.data.scores.map(score => ({
				score,
				count: Object.entries(props.session.data.players).filter(([email, player]) => player.firstScore === score).length,
			})),
			result => result.count, 'desc'
		).map(result => result.score)

		const finalResults = sortedScores
			.map(score => ({
				score,
				voters: sortBy(
					Object.entries(props.session.data.players).filter(([, player]) => player.lastScore === score),
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

													props.session.castVote(score)
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
					{isEmpty(props.session.data.players)
						? <span className='planning__hint'>You are the scrum master — waiting for others to join this session.</span>
						: <PeerProgress players={props.session.data.players} grand />}
				</FlexBox>
				{floatingButtons}
			</React.Fragment>
		)
	}

	return (
		<React.Fragment>
			<PeerProgress players={props.session.data.players} />
			<div className='planning__cards'>
				{props.session.data.scores.map(score => (
					<Card
						key={score}
						selected={score === myScore}
						onClick={() => {
							props.session.castVote(score)
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
	players: SessionData['players']
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