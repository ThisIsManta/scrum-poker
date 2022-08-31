import React from 'react'
import Button from '@mui/material/Button'

import './Card.less'

export default function Card(props: {
	children: string
	selected?: boolean
	onClick?: () => void
}) {
	return (
		<Button
			className='card'
			color='primary'
			variant={props.selected ? 'contained' : 'outlined'}
			onClick={props.onClick}
		>
			{props.children}
		</Button>
	)
}