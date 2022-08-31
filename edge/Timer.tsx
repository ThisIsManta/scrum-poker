import React, { useState, useEffect } from 'react'
import { padStart } from 'lodash-es'

export default function Timer(props: {
	beginning: number
}) {
	const [, updateState] = useState<any>()
	const forceUpdate = React.useCallback(() => updateState({}), [])

	useEffect(() => {
		const timerId = window.setInterval(forceUpdate, 1000)
		return () => {
			window.clearInterval(timerId)
		}
	}, [])

	if (Number.isNaN(props.beginning)) {
		return null
	}

	if (!Number.isFinite(props.beginning)) {
		return null
	}

	const seconds = Math.floor((Date.now() - props.beginning) / 1000)

	return (
		<div className='timer'>
			{padStart(String(Math.floor(seconds / 60)), 2, '0')}:{padStart(String(seconds % 60), 2, '0')}
		</div>
	)
}