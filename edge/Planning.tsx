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
import MenuIcon from '@mui/icons-material/Menu'
import RefreshIcon from '@mui/icons-material/Refresh'
import QrCodeIcon from '@mui/icons-material/QrCode2'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'
import CancelIcon from '@mui/icons-material/Cancel'
import ClearIcon from '@mui/icons-material/Clear'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EastIcon from '@mui/icons-material/East'
import { isEmpty, isError, every, compact, without, sortBy, orderBy, isFinite } from 'lodash-es'
import FlipMove from 'react-flip-move'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import FlexBox from './FlexBox'
import Timer from './Timer'
import { Session, SessionData } from './useSession'
import { User } from './useUser'

// Bypass the issue when using FlipMove with React v18
// See https://github.com/joshwcomeau/react-flip-move/issues/273
const FlipMoveHack = FlipMove as any as React.ComponentType<{ className: string, children: React.ReactNode }>

export default function Planning(props: {
	currentUser: User
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

	const currentUserIsScrumMaster = props.session.data.master === props.currentUser.id
	const currentUserCanVote = !!props.session.data.votes[props.currentUser.id]

	const everyoneIsVoted = isEmpty(props.session.data.votes) === false &&
		every(props.session.data.votes, player => player.lastScore !== '')

	const otherPlayerIDs = sortBy(without(Object.keys(props.session.data.votes), props.currentUser.id))

	const floatingButtons = (
		<div className='planning__buttons'>
			{currentUserIsScrumMaster && everyoneIsVoted && (
				<Fab color='primary' onClick={onSessionReset}>
					<RefreshIcon />
				</Fab>
			)}

			<SpeedDial
				ariaLabel='SpeedDial'
				open={speedDialMenuVisible}
				icon={<MenuIcon />}
				onClick={() => {
					setSpeedDialMenuVisible(value => !value)
				}}
			>
				{currentUserIsScrumMaster && (
					<SpeedDialAction
						icon={<QrCodeIcon />}
						tooltipTitle='Let others join by QRCode'
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
					/>
				)}
				{currentUserIsScrumMaster && (
					<SpeedDialAction
						icon={<DashboardCustomizeIcon />}
						tooltipTitle='Edit score cards'
						tooltipOpen
						onClick={() => {
							setSpeedDialMenuVisible(false)
							setScoreSelectionDialogVisible(true)
						}}
					/>
				)}
				{currentUserIsScrumMaster && (
					<SpeedDialAction
						icon={currentUserCanVote ? <StopCircleIcon /> : <HowToVoteIcon />}
						tooltipTitle={currentUserCanVote ? 'Leave the voting' : 'Join the voting'}
						tooltipOpen
						onClick={() => {
							if (currentUserCanVote) {
								props.session.removePlayer(props.currentUser.id)
							} else {
								props.session.clearVote(props.currentUser.id)
							}
							setSpeedDialMenuVisible(false)
						}}
					/>
				)}
				{currentUserIsScrumMaster && otherPlayerIDs.length > 0 && (
					<SpeedDialAction
						icon={<LocalPoliceIcon />}
						tooltipTitle='Transfer your scrum master role'
						tooltipOpen
						onClick={() => {
							setRemovalPersonDialogVisible(true)
							setSpeedDialMenuVisible(false)
						}}
					/>
				)}
				{currentUserIsScrumMaster && otherPlayerIDs.length > 0 && (
					<SpeedDialAction
						icon={<RemoveCircleIcon />}
						tooltipTitle='Remove a person'
						tooltipOpen
						onClick={() => {
							setRemovalPersonDialogVisible(true)
							setSpeedDialMenuVisible(false)
						}}
					/>
				)}
				{currentUserIsScrumMaster ? (
					<SpeedDialAction
						icon={<CancelIcon />}
						tooltipTitle='End this session'
						tooltipOpen
						onClick={() => {
							props.session.destroy()
						}}
					/>
				) : (
					<SpeedDialAction
						icon={<EastIcon />}
						tooltipTitle='Leave this session'
						tooltipOpen
						onClick={() => {
							props.session.removePlayer(props.currentUser.id)
						}}
					/>
				)}
			</SpeedDial>

			<Dialog open={!!invitationQRCode} onClose={() => { setInvitationQRCode(null) }}>
				<img className='planning__qr-code' src={invitationQRCode!} style={{ width: '100%', height: '100%' }} />
			</Dialog>

			<Dialog open={personRemovalDialogVisible} onClose={() => { setRemovalPersonDialogVisible(false) }}>
				<DialogTitle>Remove a person</DialogTitle>
				<List>
					{otherPlayerIDs.map(userID => (
						<ListItem button key={userID} onClick={() => {
							props.session.removePlayer(userID)
							setRemovalPersonDialogVisible(false)
						}}>
							{props.currentUser.codeName} ({userID})
						</ListItem>
					))}
				</List>
			</Dialog>

			<Dialog open={scrumMasterTransferDialogVisible} onClose={() => { setScrumMasterTransferDialogVisible(false) }}>
				<DialogTitle>Transfer scrum master role</DialogTitle>
				<List>
					{otherPlayerIDs.map(userID => (
						<ListItem button key={userID} onClick={() => {
							props.session.transferScrumMasterRole(userID)
							setScrumMasterTransferDialogVisible(false)
						}}>
							{props.currentUser.codeName} ({userID})
						</ListItem>
					))}
				</List>
			</Dialog>

			<Dialog open={scoreSelectionDialogVisible} onClose={() => { setScoreSelectionDialogVisible(false) }}>
				<DialogTitle>Edit score cards</DialogTitle>
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
								placeholder="Add custom score"
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

	const timer = currentUserIsScrumMaster && isEmpty(props.session.data.votes) === false && (
		<div className='planning__timer'>
			<Timer beginning={beginning} />
		</div>
	)

	const myScore = currentUserCanVote ? props.session.data.votes[props.currentUser.id].lastScore : ''

	if (everyoneIsVoted) {
		const sortedScores = orderBy(
			props.session.data.scores.map(score => ({
				score,
				count: Object.entries(props.session.data.votes).filter(([userID, player]) => player.firstScore === score).length,
			})),
			result => result.count, 'desc'
		).map(result => result.score)

		const finalResults = sortedScores
			.map(score => ({
				score,
				voters: sortBy(
					Object.entries(props.session.data.votes).filter(([, player]) => player.lastScore === score),
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
												{voters.map(([userID]) => (
													<div key={userID}>
														<Avatar userID={userID} />
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
					{isEmpty(props.session.data.votes)
						? <span className='planning__hint'>You are the scrum master — waiting for others to join this session.</span>
						: <PeerProgress votes={props.session.data.votes} grand />}
				</FlexBox>
				{floatingButtons}
			</React.Fragment>
		)
	}

	return (
		<React.Fragment>
			<PeerProgress votes={props.session.data.votes} />
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
	votes: SessionData['votes']
	grand?: boolean
}) {
	const sortedVotes = sortBy(
		Object.entries(props.votes).map(([userID, player]) => ({ ...player, userID })),
		player => player.lastScore === '' ? 1 : 0,
		player => player.timestamp
	)

	return (
		<FlipMoveHack className={compact(['planning__players', '--free', props.grand && '--tall']).join(' ')}>
			{sortedVotes.map(({ userID, lastScore }) =>
				<div key={userID}>
					<Avatar userID={userID} faded={lastScore === ''} size={props.grand ? 120 : 36} />
				</div>
			)}
		</FlipMoveHack>
	)
}