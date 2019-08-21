import * as Firebase from 'firebase/app'
import * as React from 'react'
import { Redirect } from 'react-router-dom'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Fab from '@material-ui/core/Fab'
import Icon from '@material-ui/core/Icon'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import SpeedDial from '@material-ui/lab/SpeedDial'
import SpeedDialAction from '@material-ui/lab/SpeedDialAction'
import * as _ from 'lodash'
import FlipMove from 'react-flip-move'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'
import { getAcronym } from './getAcronym'

export enum Score {
	Unvoted = '',
	P0 = '0',
	P1 = '1',
	P2 = '2',
	P3 = '3',
	P5 = '5',
	P8 = '8',
	P13 = '13',
	Infinity = '∞',
	NonDeterminable = '?',
}

interface ISession {
	master: string
	players: { [email: string]: { firstScore: Score, lastScore: Score, timestamp: string } }
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

	React.useEffect(() => {
		let unsubscribe = _.noop;
		let unmounted = false;

		(async () => {
			let { exists } = await props.document.get()
			if (!exists) {
				const session: ISession = {
					master: props.currentUser.email,
					players: {},
				}
				await props.document.set(session)
			}

			const session = (await props.document.get()).data() as ISession
			if (session.master !== props.currentUser.email && session.players[props.currentUser.email] === undefined) {
				await props.document.update(
					new Firebase.firestore.FieldPath('players', props.currentUser.email),
					{
						firstScore: Score.Unvoted,
						lastScore: Score.Unvoted,
						timestamp: new Date().toISOString(),
					}
				)
			}

			if (unmounted) {
				return
			}

			unsubscribe = props.document.onSnapshot(snapshot => {
				const session = snapshot.data() as ISession
				console.log(session)

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

	if (!props.currentUser) {
		return <Redirect to='/' />
	}

	const onSessionReset = () => {
		props.document.update({
			players: _.mapValues(data.players, player => ({
				...player,
				firstScore: Score.Unvoted,
				lastScore: Score.Unvoted,
			})),
		})
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

	const everyoneIsVoted = _.isEmpty(data.players) === false &&
		_.every(data.players, player => player.lastScore !== Score.Unvoted)

	const floatingButtons = currentUserIsScrumMaster && (
		<div className='planning__buttons'>
			{everyoneIsVoted && <Fab onClick={onSessionReset}><Icon>autorenew</Icon></Fab>}

			<SpeedDial
				ariaLabel="SpeedDial"
				open={speedDialMenuVisible}
				icon={<Icon>menu</Icon>}
				onClick={() => {
					setSpeedDialMenuVisible(value => !value)
				}}
			>
				{_.isEmpty(data.players) === false && <SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>remove_circle_outline</Icon>}
					tooltipTitle='Remove a person'
					tooltipOpen
					onClick={() => {
						setRemovalPersonDialogVisible(true)
						setSpeedDialMenuVisible(false)
					}}
				/>}
				<SpeedDialAction
					className='planning__speed-dial'
					icon={<Icon>delete_forever</Icon>}
					tooltipTitle='Delete this session'
					tooltipOpen
					onClick={() => {
						props.document.delete()
					}}
				/>
			</SpeedDial>

			<Dialog open={personRemovalDialogVisible} onClose={() => { setRemovalPersonDialogVisible(false) }}>
				<DialogTitle>Remove a person</DialogTitle>
				<List>
					{_.chain(data.players).keys().sortBy().map(email => (
						<ListItem button key={email} onClick={() => {
							onPersonRemoved(email)
							setRemovalPersonDialogVisible(false)
						}}>
							{getAcronym(email)} ({email})
						</ListItem>
					)).value()}
				</List>
			</Dialog>
		</div>
	)

	const myScore = currentUserIsScrumMaster ? Score.Unvoted : data.players[props.currentUser.email].lastScore

	if (everyoneIsVoted) {
		const sortedScores = _.chain(Score)
			.values()
			.without(Score.Unvoted)
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
			<Container className='planning__results' maxWidth='sm'>
				<Grid container direction='column' spacing={2}>
					{finalResults.map(result => (
						<Grid item key={result.score}>
							<Grid container direction='row' spacing={2}>
								<Grid item>
									<Card
										selected={result.score === myScore}
										disabled={currentUserIsScrumMaster}
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
				{floatingButtons}
			</Container>
		)
	}

	if (currentUserIsScrumMaster) {
		return (
			<React.Fragment>
				<PeerProgress players={data.players} grand />
				{floatingButtons}
			</React.Fragment>
		)
	}

	return (
		<React.Fragment>
			<PeerProgress players={data.players} />
			<div className='planning__cards'>
				{Object.values(Score).filter(score => score !== Score.Unvoted).map(score => (
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
			player => player.lastScore === Score.Unvoted ? 1 : 0,
			player => player.timestamp
		)
		.value()

	return (
		<FlipMove className={_.compact(['planning__players', '--free', props.grand && '--tall']).join(' ')}>
			{sortedPlayers.map(({ email, lastScore }) =>
				<div key={email}>
					<Avatar email={email} faded={lastScore === Score.Unvoted} size={props.grand ? 120 : 36} />
				</div>
			)}
		</FlipMove>
	)
}