import * as Firebase from 'firebase'
import * as React from 'react'
import { Redirect } from 'react-router-dom'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Fab from '@material-ui/core/Fab'
import Icon from '@material-ui/core/Icon'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
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
	const [menuVisible, setMenuVisible] = React.useState(false)
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

				if (!session) {
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
		setMenuVisible(false)
	}

	const onSessionDelete = () => {
		props.document.delete()
		setMenuVisible(false)
	}

	if (!data) {
		return null
	}

	const currentUserIsScrumMaster = data.master === props.acronym

	const floatingButton = currentUserIsScrumMaster && (
		<div className='planning__buttons'>
			<Fab onClick={onSessionReset}><Icon>autorenew</Icon></Fab>
			<Fab ref={menuRef} onClick={() => { setMenuVisible(true) }}><Icon>menu</Icon></Fab>
			<Menu
				anchorEl={menuRef ? menuRef.current : null}
				open={menuVisible}
				onClose={() => { setMenuVisible(false) }}
			>
				<MenuItem onClick={onSessionDelete}>Delete this session</MenuItem>
				<MenuItem disabled>Kick a person</MenuItem>
			</Menu>
		</div>
	)

	const myScore = currentUserIsScrumMaster ? Score.Unvoted : data.players[props.acronym].lastScore

	const everyoneIsVoted = _.isEmpty(data.players) === false &&
		_.every(data.players, player => player.lastScore !== Score.Unvoted)
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