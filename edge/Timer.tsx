import * as React from 'react'
import * as _ from 'lodash'

export default function Timer(props: {
	beginning: number
}) {
	const [, updateState] = React.useState()
	const forceUpdate = React.useCallback(() => updateState({}), [])

	React.useEffect(() => {
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
			{_.padStart(String(Math.floor(seconds / 60)), 2, '0')}:{_.padStart(String(seconds % 60), 2, '0')}
		</div>
	)
}