import * as React from 'react'

import './FlexBox.less'

export default function FlexBox(props: {
	children: React.ReactNode
}) {
	return <div className='flex-box'>{props.children}</div>
}