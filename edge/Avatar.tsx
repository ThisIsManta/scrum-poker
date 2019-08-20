import * as _ from 'lodash'
import * as React from 'react'

import './Avatar.less'

export default function Avatar(props: {
	children: string
	size?: number
	faded?: boolean
}) {
	const size = props.size || 70

	return (
		<div className='avatar' style={{
			width: size,
			height: size,
			fontSize: Math.ceil(size / 2),
			opacity: props.faded ? 0.15 : 1,
		}}>
			{props.children}
		</div>
	)
}