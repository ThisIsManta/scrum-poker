import React, { useEffect, useState } from 'react'
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
import QrCodeIcon from '@mui/icons-material/QrCodeScanner'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import ClearIcon from '@mui/icons-material/Clear'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import { isEmpty, isError, some, every, sortBy, orderBy, partition } from 'lodash-es'
import FlipMove from 'react-flip-move'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import FlexBox from './FlexBox'
import { Session, SessionData } from './useSession'
import useFlashMessage from './useFlashMessage'
import { User } from './useUser'
import UserListItem from './UserListItem'
import { useTutorial } from './PopupTutorial'

// Bypass the issue when using FlipMove with React v18
// See https://github.com/joshwcomeau/react-flip-move/issues/273
const FlipMoveHack = FlipMove as any as React.ComponentType<{ className: string, children: React.ReactNode }>

export default function Planning(props: {
	currentUser: User
	session: Session
}) {
	const [speedDialMenuVisible, setSpeedDialMenuVisible] = useState(false)
	const [personVoterDialogVisible, setVoterRemovalDialogVisible] = useState(false)
	const [scoreSelectionDialogVisible, setScoreSelectionDialogVisible] = useState(false)
	const [invitationQRCode, setInvitationQRCode] = useState<string | null>(null)
	const [customScore, setCustomScore] = useState('')
	const { showSuccessMessage } = useFlashMessage()

	const openQRCodeDialog = async () => {
		const QRCode = await import('qrcode')
		QRCode.toDataURL(window.location.href, { width: 600 }, (error, url) => {
			if (error) {
				window.alert(isError(error) ? error.message : String(error))
				return
			}

			setInvitationQRCode(url)
		})
	}

	const currentUserCanVote = !!props.session.data.votes[props.currentUser.id]

	const someoneIsVoted = some(props.session.data.votes, vote => vote.lastScore !== '')
	const everyoneIsVoted = isEmpty(props.session.data.votes) === false &&
		every(props.session.data.votes, vote => vote.lastScore !== '')

	const voterIDs = Object.keys(props.session.data.votes)

	const myScore = currentUserCanVote ? props.session.data.votes[props.currentUser.id].lastScore : ''

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
			voterIDs: sortBy(
				Object.entries(props.session.data.votes).filter(([, vote]) => vote.lastScore === score),
				([, vote]) => vote.timestamp?.toMillis()
			).map(([userID]) => userID),
		}))

	const alterScore = currentUserCanVote ? finalResults.find(({ score }) => score !== myScore)?.score : undefined

	const [resultVisibleTimestamp, setResultVisibleTimestamp] = useState<number>()
	useEffect(() => {
		if (everyoneIsVoted) {
			setResultVisibleTimestamp(Date.now())
		} else {
			setResultVisibleTimestamp(undefined)
		}
	}, [everyoneIsVoted])

	const [alterCardTutorial, dismissAlterCardTutorial] = useTutorial(
		alterScore ? resultVisibleTimestamp : undefined,
		15000,
		'.planning__alter-score',
		'left',
		<span>Change your mind?<br />Pick a new card right away!</span>
	)

	const renderMainContent = () => {
		if (everyoneIsVoted) {
			return (
				<React.Fragment>
					<Container className='planning__results' maxWidth='sm'>
						<Slide direction='up' in timeout={900}>
							<Grid container direction='column' spacing={2}>
								{finalResults.map(({ score, voterIDs }) => (
									<Grid item key={score}>
										<Grid container direction='row' spacing={2}>
											<Grid item>
												<Card
													className={score === alterScore ? 'planning__alter-score' : ''}
													selected={currentUserCanVote ? score === myScore : false}
													onClick={currentUserCanVote ? (() => {
														if (score === myScore) {
															return
														}

														props.session.castVote(score)

														// Do not show the tutorial again when it has been fulfilled
														dismissAlterCardTutorial()
													}) : undefined}
												>
													{score}
												</Card>
											</Grid>
											<Grid item className='planning__flex-full'>
												<FlipMoveHack className='planning__players --left'>
													{voterIDs.map(userID => (
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
					{alterCardTutorial}
				</React.Fragment>
			)
		}

		if (currentUserCanVote) {
			return (
				<React.Fragment>
					<PeerProgress votes={props.session.data.votes} />
					<div className='planning__table'>
						<div className='planning__table-hint'>
							Pick your card <ArrowDownIcon className='planning__table-hint-icon' />
						</div>
						<div className='planning__table-deck'>
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
					</div>
				</React.Fragment>
			)
		}

		if (isEmpty(props.session.data.votes)) {
			return (
				<FlexBox>
					<span className='planning__empty-room-hint'>
						Waiting for others to join by <a href={window.location.href} onClick={async (e) => { e.preventDefault(); await window.navigator.clipboard.writeText(window.location.href); showSuccessMessage('The URL has been copied.') }}>this URL</a> or <a onClick={openQRCodeDialog}>the QR code</a>.
					</span>
				</FlexBox>
			)
		}

		return (
			<FlexBox>
				<PeerProgress votes={props.session.data.votes} large />
			</FlexBox>
		)
	}

	const renderFloatingButtons = () => (
		<div className='planning__buttons'>
			{currentUserCanVote ?
				someoneIsVoted && (
					<Fab
						classes={{ root: 'planning__primary-button' }}
						color='primary'
						variant='extended'
						size='large'
						onClick={() => {
							props.session.clearAllVotes()
						}}
					>
						<RefreshIcon className='planning__primary-button-text' />Restart
					</Fab>
				) : (
					<Fab
						classes={{ root: 'planning__primary-button' }}
						color='primary'
						variant='extended'
						size='large'
						onClick={() => {
							props.session.clearVote(props.currentUser.id)
						}}
					>
						<AddCircleIcon className='planning__primary-button-text' />Join
					</Fab>
				)
			}

			<SpeedDial
				ariaLabel='SpeedDial'
				open={speedDialMenuVisible}
				icon={<MenuIcon />}
				onClick={() => {
					setSpeedDialMenuVisible(value => !value)
				}}
			>
				<SpeedDialAction
					icon={<QrCodeIcon />}
					tooltipTitle='Let others join by QRCode'
					tooltipOpen
					onClick={openQRCodeDialog}
				/>
				<SpeedDialAction
					icon={<DashboardCustomizeIcon />}
					tooltipTitle='Edit score cards'
					tooltipOpen
					onClick={() => {
						setScoreSelectionDialogVisible(true)
					}}
				/>
				{voterIDs.length > 0 && (
					<SpeedDialAction
						icon={<RemoveCircleIcon />}
						tooltipTitle='Remove a voter'
						tooltipOpen
						onClick={() => {
							setVoterRemovalDialogVisible(true)
						}}
					/>
				)}
				<SpeedDialAction
					icon={currentUserCanVote ? <CancelIcon /> : <AddCircleIcon />}
					tooltipTitle={currentUserCanVote ? 'Leave the vote' : 'Join the vote'}
					tooltipOpen
					onClick={() => {
						if (currentUserCanVote) {
							props.session.removePlayer(props.currentUser.id)
						} else {
							props.session.clearVote(props.currentUser.id)
						}
					}}
				/>
			</SpeedDial>

			<Dialog open={!!invitationQRCode} onClose={() => { setInvitationQRCode(null) }}>
				{invitationQRCode && (
					<img
						className='planning__qr-code'
						src={invitationQRCode!}
						style={{ width: '100%', height: '100%' }}
						onClick={() => {
							setInvitationQRCode(null)
						}}
					/>
				)}
			</Dialog>

			<Dialog open={personVoterDialogVisible} onClose={() => { setVoterRemovalDialogVisible(false) }}>
				<DialogTitle>Remove a voter</DialogTitle>
				<List>
					{voterIDs.map(userID => (
						<UserListItem key={userID} userID={userID} onClick={() => {
							props.session.removePlayer(userID)
							setVoterRemovalDialogVisible(false)
						}} />
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
									props.session.removeSelectableScore(score)
								}}>
									<ClearIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))}
					<ListItem>
						<form onSubmit={(e) => {
							e.preventDefault()

							if (customScore === '' || props.session.data.scores.includes(customScore)) {
								return
							}

							props.session.addSelectableScore(customScore)

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
									<CheckIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</form>
					</ListItem>
				</List>
			</Dialog>
		</div>
	)

	return (
		<React.Fragment>
			{!currentUserCanVote && (
				<div className='planning__observer'>
					You are an observer. If you want to vote, <a onClick={() => { props.session.clearVote(props.currentUser.id) }}>click here to join</a>.
				</div>
			)}
			{renderMainContent()}
			{renderFloatingButtons()}
		</React.Fragment>
	)
}

function PeerProgress(props: {
	votes: SessionData['votes']
	large?: boolean
}) {
	const unsortedVotes = Object.entries(props.votes).map(([userID, vote]) => ({ ...vote, userID }))
	const sortedVotes = sortBy(unsortedVotes, vote => vote.timestamp?.toMillis())
	const [castedVotes, pendingVotes] = partition(sortedVotes, vote => vote.lastScore !== '')

	const oldestTimestamp = sortedVotes[0]?.timestamp?.toMillis()
	const [tutorial] = useTutorial(
		oldestTimestamp,
		10000,
		'.planning__pending-vote-avatar',
		'bottom-start',
		'Waiting to pick a card...'
	)

	const size = props.large ? 120 : 36

	return (
		<React.Fragment>
			<FlipMoveHack className='planning__players --free'>
				{castedVotes.map(({ userID }) =>
					<div key={userID}>
						<Avatar userID={userID} size={size} />
					</div>
				)}
				{castedVotes.length > 0 && pendingVotes.length > 0 && <ArrowBackIcon className='planning__player-arrow' style={{ height: size }} />}
				{pendingVotes.map(({ userID }) => (
					<div key={userID}>
						<Avatar
							userID={userID}
							size={size}
							faded
							className={pendingVotes[0].userID === userID ? 'planning__pending-vote-avatar' : undefined}
						/>
					</div>
				))}
			</FlipMoveHack>
			{tutorial}
		</React.Fragment>
	)
}
