import * as Firebase from 'firebase'
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
import * as _ from 'lodash'
import FlipMove from 'react-flip-move'

import './Planning.less'
import Card from './Card'
import Avatar from './Avatar'

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
	players: { [acronym: string]: { firstScore: Score, lastScore: Score, timestamp: string } }
}

export default function Planning(props: {
	acronym: string
	document: Firebase.firestore.DocumentReference
	onSessionDelete: () => void
}) {
	const [data, setData] = React.useState<ISession>()
	const [personRemovalDialogVisible, setRemovalPersonDialogVisible] = React.useState(false)
	const menuRef = React.useRef()

	React.useEffect(() => {
		let unsubscribe = _.noop;
		let unmounted = false;

		(async () => {
			let { exists } = await props.document.get()
			if (!exists) {
				const session: ISession = {
					master: props.acronym,
					players: {},
				}
				await props.document.set(session)
			}

			const session = (await props.document.get()).data() as ISession
			if (session.master !== props.acronym && session.players[props.acronym] === undefined) {
				await props.document.update(`players.${props.acronym}`, {
					firstScore: Score.Unvoted,
					lastScore: Score.Unvoted,
					timestamp: new Date().toISOString(),
				})
			}

			if (unmounted) {
				return
			}

			unsubscribe = props.document.onSnapshot(snapshot => {
				const session = snapshot.data() as ISession
				console.log(session)

				if (!session || session.players[props.acronym] === undefined && session.master !== props.acronym) {
					props.onSessionDelete()
					return
				}

				setData(session)
			})
		})()

		return () => {
			unmounted = true
			unsubscribe()
		}
	}, [props.document])

	if (!props.acronym) {
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

	const onSessionDeleted = () => {
		props.document.delete()
	}

	const onPersonKicked = (name: string) => {
		props.document.update(`players.${name}`, Firebase.firestore.FieldValue.delete())
	}

	if (!data) {
		return null
	}

	const currentUserIsScrumMaster = data.master === props.acronym

	const everyoneIsVoted = _.isEmpty(data.players) === false &&
		_.every(data.players, player => player.lastScore !== Score.Unvoted)

	const floatingButton = currentUserIsScrumMaster && (
		<div className='planning__buttons'>
			{everyoneIsVoted && <Fab onClick={onSessionReset}><Icon>autorenew</Icon></Fab>}

			{_.isEmpty(data.players) === false && <Fab ref={menuRef} onClick={() => { setRemovalPersonDialogVisible(true) }}><Icon>remove_circle_outline</Icon></Fab>}
			<Dialog onClose={() => { setRemovalPersonDialogVisible(false) }} open={personRemovalDialogVisible}>
				<DialogTitle>Remove a person</DialogTitle>
				<List>
					{_.chain(data.players).keys().sortBy().map(name => (
						<ListItem button key={name} onClick={() => {
							onPersonKicked(name)
							setRemovalPersonDialogVisible(false)
						}}>
							{name}
						</ListItem>
					)).value()}
				</List>
			</Dialog>

			<Fab onClick={onSessionDeleted}><Icon>delete_forever</Icon></Fab>
		</div>
	)

	const myScore = currentUserIsScrumMaster ? Score.Unvoted : data.players[props.acronym].lastScore

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
			<Container className='planning__results --fade-in' maxWidth='sm'>
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

											props.document.update(`players.${props.acronym}`, {
												...data.players[props.acronym],
												lastScore: score,
												timestamp: new Date().toISOString(),
											})
										}}
									>
										{result.score}
									</Card>
								</Grid>
								<Grid item className='planning__flex-full'>
									<FlipMove className='planning__players --left'>
										{result.voters.map(([name]) => (
											<div key={name}>
												<Avatar>
													{name}
												</Avatar>
											</div>
										))}
									</FlipMove>
								</Grid>
							</Grid>
						</Grid>
					))}
				</Grid>
				{floatingButton}
			</Container>
		)
	}

	if (currentUserIsScrumMaster) {
		const sortedNamePlayerPairs = _.chain(data.players)
			.toPairs()
			.sortBy(
				([, player]) => player.lastScore === Score.Unvoted ? 1 : 0,
				([, player]) => player.timestamp
			)
			.value()

		return (
			<React.Fragment>
				<FlipMove className='planning__players --tall'>
					{sortedNamePlayerPairs.map(([name, { lastScore: score }]) =>
						<div key={name}>
							<Avatar faded={score === Score.Unvoted} size={120}>
								{name}
							</Avatar>
						</div>
					)}
				</FlipMove>
				{floatingButton}
			</React.Fragment>
		)
	}

	return (
		<div className='planning__cards'>
			{Object.values(Score).filter(score => score !== Score.Unvoted).map(score => (
				<Card
					key={score}
					selected={score === myScore}
					onClick={score => {
						props.document.update(`players.${props.acronym}`, {
							...data.players[props.acronym],
							firstScore: score,
							lastScore: score,
							timestamp: new Date().toISOString(),
						})
					}}
				>
					{score}
				</Card>
			))}
		</div>
	)
}