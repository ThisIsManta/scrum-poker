import * as _ from 'lodash'
import * as React from 'react'

import './Avatar.less'
import { getAcronym } from './getAcronym'

export default function Avatar(props: {
	email?: string
	children?: React.ReactNode
	size?: number
	faded?: boolean
}) {
	const size = props.size || 70

	return (
		<div className='avatar' style={{
			width: size,
			height: size,
			fontSize: Math.ceil(size / 2),
			opacity: props.faded ? 0.2 : 1,
		}}>
			{props.children ? props.children : getAcronym(props.email)}
		</div>
	)
}