import * as React from 'react'
import Button from '@material-ui/core/Button'

import './Card.less'

import { Score } from './Planning'

export default function Card(props: {
	children: Score
	selected?: boolean
	disabled?: boolean
	onClick?: (score: Score) => void
}) {
	return (
		<Button
			className='card'
			variant={props.selected ? 'contained' : 'outlined'}
			onClick={props.disabled ? undefined : () => { props.onClick(props.children) }}
		>
			{props.children}
		</Button>
	)
}