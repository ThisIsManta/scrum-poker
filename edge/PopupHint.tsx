import React from 'react'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'

import './PopupHint.less'

export default function PopupHint(props: TooltipProps) {
	return (
		<Tooltip
			{...props}
			arrow
			classes={{ tooltip: 'popup-hint' }}
			title={
				<div className='popup-hint__title'>
					{props.title}
				</div>
			}
		/>
	)
}
