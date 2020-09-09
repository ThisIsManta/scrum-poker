import * as Firebase from 'firebase/app'
import * as React from 'react'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Fab from '@material-ui/core/Fab'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import TextField from '@material-ui/core/TextField'
import Input from '@material-ui/core/Input'
import SpeedDial from '@material-ui/lab/SpeedDial'
import SpeedDialAction from '@material-ui/lab/SpeedDialAction'
import Slide from '@material-ui/core/Slide'
import * as _ from 'lodash'
import FlipMove from 'react-flip-move'
import * as QRCode from 'qrcode'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import FlexBox from './FlexBox'
import Timer from './Timer'
import { getAcronym } from './getAcronym'

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
	currentUser: Firebase.User
	document: Firebase.firestore.DocumentReference
	onSessionDeleted: () => void
	showFlashMessage: (message: string) => void
}) {
	const [data, setData] = React.useState<ISession>()
	const [speedDialMenuVisible, setSpeedDialMenuVisible] = React.useState(false)
	const [personRemovalDialogVisible, setRemovalPersonDialogVisible] = React.useState(false)
	const [scrumMasterTransferDialogVisible, setScrumMasterTransferDialogVisible] = React.useState(false)
	const [scoreSelectionDialogVisible, setScoreSelectionDialogVisible] = React.useState(false)
	const [invitationQRCode, setInvitationQRCode] = React.useState('')
	const [customScore, setCustomScore] = React.useState('')
	const [beginning, setBeginning] = React.useState(Date.now())

	React.useEffect(() => {
		let unsubscribe = _.noop;
		let unmounted = false;

		(async () => {
			let { exists } = await props.document.get()
			if (!exists) {
				const session: ISession = {
					master: props.currentUser.email,
					players: {},
					scores: Object.values(PredefinedScore),
				}
				await props.document.set(session)
			}

			const session = (await props.document.get()).data() as ISession
			if (session.master !== props.currentUser.email && session.players[props.currentUser.email] === undefined) {
				await props.document.update(
					new Firebase.firestore.FieldPath('players', props.currentUser.email),
					basisPlayerScore
				)
			}

			if (unmounted) {
				return
			}

			unsubscribe = props.document.onSnapshot(snapshot => {
				const session = snapshot.data() as ISession

				if (!session || session.players[props.currentUser.email] === undefined && session.master !== props.currentUser.email) {
					props.showFlashMessage('You have been removed from the session')
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
			players: _.mapValues(data.players, player => ({
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

	const currentUserIsScrumMaster = data.master === props.currentUser.email
	const currentUserCanVote = !!data.players[props.currentUser.email]

	const everyoneIsVoted = _.isEmpty(data.players) === false &&
		_.every(data.players, player => player.lastScore !== '')

	const otherPlayerEmails = _.chain(data.players).keys().without(props.currentUser.email).sortBy().value()

	const floatingButtons = (
		<div className='planning__buttons'>
			{currentUserIsScrumMaster && everyoneIsVoted && (
				<Fab color='primary' onClick={onSessionReset}>
					<Icon>autorenew</Icon>
				</Fab>
			)}

			<SpeedDial
				ariaLabel='SpeedDial'
				open={speedDialMenuVisible}
				icon={<Icon>menu</Icon>}
				onClick={() => {
					setSpeedDialMenuVisible(value => !value)
				}}
			>
				{currentUserIsScrumMaster && (<SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>person_add</Icon>}
					tooltipTitle='Show QRCode'
					tooltipOpen
					onClick={() => {
						QRCode.toDataURL(window.location.href, { width: 600 }, (error, url) => {
							if (error) {
								window.alert(_.isString(error) ? error : String(error))
								return
							}

							setInvitationQRCode(url)
						})
						setSpeedDialMenuVisible(false)
					}}
				/>)}
				{currentUserIsScrumMaster && <SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>{currentUserCanVote ? 'indeterminate_check_box' : 'check_box'}</Icon>}
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
					icon={<Icon>amp_stories</Icon>}
					tooltipTitle='Edit scores'
					tooltipOpen
					onClick={() => {
						setScoreSelectionDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster && otherPlayerEmails.length > 0 && <SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>remove_circle_outline</Icon>}
					tooltipTitle='Remove a person'
					tooltipOpen
					onClick={() => {
						setRemovalPersonDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster && otherPlayerEmails.length > 0 && <SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>eject</Icon>}
					tooltipTitle='Transfer scrum master role'
					tooltipOpen
					onClick={() => {
						setRemovalPersonDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				{currentUserIsScrumMaster ? (<SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>delete_forever</Icon>}
					tooltipTitle='Delete this session'
					tooltipOpen
					onClick={() => {
						props.document.delete()
					}}
				/>) : (<SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>call_missed_outgoing</Icon>}
					tooltipTitle='Leave this session'
					tooltipOpen
					onClick={() => {
						onPersonRemoved(props.currentUser.email)
					}}
				/>)}
			</SpeedDial>

			<Dialog open={!!invitationQRCode} onClose={() => { setInvitationQRCode(null) }}>
				<img src={invitationQRCode} style={{ width: '100%', height: '100%' }} />
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
									new Firebase.firestore.FieldPath('players', props.currentUser.email),
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
										..._.chain(data.players)
											.toPairs()
											.filter(([email, player]) => player.firstScore === score || player.lastScore === score)
											.map(([email, player]) => [
												new Firebase.firestore.FieldPath('players', email),
												{
													...player,
													firstScore: '',
													lastScore: '',
													timestamp: new Date().toISOString()
												}
											])
											.flatten()
											.value()
									)
								}}>
									<Icon>clear</Icon>
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
								_.chain(data.scores)
									.push(customScore)
									.sortBy(
										score => score === '?' ? 1 : 0,
										score => /[¼½¾]/.test(score) ? '0' : score,
									)
									.value()
							)

							setCustomScore('')
						}}>
							<Input
								type="text"
								placeholder="Custom score"
								fullWidth
								value={customScore}
								onChange={e => {
									setCustomScore(_.trim(e.target.value))
								}}
							/>
							<ListItemSecondaryAction>
								<IconButton type="submit" edge="end" aria-label="add">
									<Icon>add_circle</Icon>
								</IconButton>
							</ListItemSecondaryAction>
						</form>
					</ListItem>
				</List>
			</Dialog>
		</div >
	)

	const timer = currentUserIsScrumMaster && _.isEmpty(data.players) === false && (
		<div className='planning__timer'>
			<Timer beginning={beginning} />
		</div>
	)

	const myScore = currentUserCanVote ? data.players[props.currentUser.email].lastScore : ''

	if (everyoneIsVoted) {
		const sortedScores = _.chain(data.scores)
			.map(score => ({
				score,
				count: _.chain(data.players).filter(player => player.firstScore === score).value().length,
			}))
			.orderBy(result => result.count, 'desc')
			.map(result => result.score)
			.value()

		const finalResults = _.chain(sortedScores)
			.map(score => ({
				score,
				voters: _.chain(data.players)
					.toPairs()
					.filter(([, player]) => player.lastScore === score)
					.sortBy(([, player]) => player.timestamp)
					.value()
			}))
			.value()

		return (
			<React.Fragment>
				{timer}
				<Container className='planning__results' maxWidth='sm'>
					<Slide direction='up' in timeout={900}>
						<Grid container direction='column' spacing={2}>
							{finalResults.map(result => (
								<Grid item key={result.score}>
									<Grid container direction='row' spacing={2}>
										<Grid item>
											<Card
												selected={currentUserCanVote ? result.score === myScore : false}
												disabled={!currentUserCanVote}
												onClick={score => {
													if (score === myScore) {
														return
													}

													props.document.update(
														new Firebase.firestore.FieldPath('players', props.currentUser.email),
														{
															...data.players[props.currentUser.email],
															lastScore: score,
															timestamp: new Date().toISOString(),
														}
													)
												}}
											>
												{result.score}
											</Card>
										</Grid>
										<Grid item className='planning__flex-full'>
											<FlipMove className='planning__players --left'>
												{result.voters.map(([email]) => (
													<div key={email}>
														<Avatar email={email} />
													</div>
												))}
											</FlipMove>
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
					{_.isEmpty(data.players)
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
						onClick={score => {
							props.document.update(
								new Firebase.firestore.FieldPath('players', props.currentUser.email),
								{
									...data.players[props.currentUser.email],
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
	const sortedPlayers = _.chain(props.players)
		.toPairs()
		.map(([email, player]) => ({ ...player, email }))
		.sortBy(
			player => player.lastScore === '' ? 1 : 0,
			player => player.timestamp
		)
		.value()

	return (
		<FlipMove className={_.compact(['planning__players', '--free', props.grand && '--tall']).join(' ')}>
			{sortedPlayers.map(({ email, lastScore }) =>
				<div key={email}>
					<Avatar email={email} faded={lastScore === ''} size={props.grand ? 120 : 36} />
				</div>
			)}
		</FlipMove>
	)
}