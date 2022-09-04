import React from 'react'
import Button from '@mui/material/Button'
import { compact } from 'lodash-es'

import './Card.less'

export default function Card(props: {
	className?: string
	children: string
	selected?: boolean
	onClick?: () => void
}) {
	return (
		<Button
			className={compact(['card', props.className]).join(' ')}
			color='primary'
			variant={props.selected ? 'contained' : 'outlined'}
			disabled={!props.onClick}
			onClick={props.onClick}
		>
			{props.children}
		</Button>
	)
}