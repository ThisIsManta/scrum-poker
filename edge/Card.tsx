import * as React from 'react'
import Button from '@material-ui/core/Button'

import './Card.less'

export default function Card(props: {
	children: string
	selected?: boolean
	disabled?: boolean
	onClick?: (score: string) => void
}) {
	return (
		<Button
			className='card'
			color='primary'
			variant={props.selected ? 'contained' : 'outlined'}
			onClick={props.disabled ? undefined : () => { props.onClick(props.children) }}
		>
			{props.children}
		</Button>
	)
}