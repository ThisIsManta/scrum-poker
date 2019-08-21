import * as React from 'react'

import './Box.less'

export default function Box(props: {
	children: React.ReactNode
}) {
	return <div className='box'>{props.children}</div>
}