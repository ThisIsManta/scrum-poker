import * as _ from 'lodash'
import * as React from 'react'

import './Avatar.less'

export default function Avatar(props: {
	children: string
	faded?: boolean
	size?: number
}) {
	const size = props.size || 70

	return (
		<div className='avatar' style={{
			opacity: props.faded ? 0.15 : 1,
			width: size,
			height: size,
			fontSize: Math.ceil(size / 2),
		}}>
			{props.children}
		</div>
	)
}