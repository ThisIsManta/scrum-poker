import React, { useRef, useState } from 'react'
import { compact } from 'lodash-es'

import './Avatar.less'
import useUser, { User } from './useUser'
import PopupHint from './PopupHint'

type Props = {
	className?: string
	userID: User['id']
	size?: number
	clued?: boolean
	faded?: boolean
}

export default React.forwardRef<HTMLDivElement, Props>(function Avatar(props, ref) {
	const user = useUser(props.userID)
	const photoReloadCount = useRef(0)
	const [codeNameForced, setCodeNameForced] = useState(false)

	const size = props.size || 70

	const content = (
		<div
			className={compact(['avatar', props.className]).join(' ')}
			style={{
				width: size,
				height: size,
				fontSize: Math.ceil(size / 2),
				opacity: props.faded ? 0.4 : 1,
			}}
			data-user-id={props.userID}
		>
			{
				user?.photo && !codeNameForced
					? (
						<img
							className='avatar__photo'
							src={user.photo}
							onError={(e) => {
								// Retry loading the image as photos from Google fail often times
								e.currentTarget.src = user.photo!

								photoReloadCount.current += 1
								if (photoReloadCount.current > 10) {
									setCodeNameForced(true)
								}
							}}
						/>
					)
					: user?.codeName
			}
		</div>
	)

	if (props.clued === false) {
		return content
	}

	return (
		<PopupHint
			placement='bottom-start'
			title={
				<React.Fragment>
					<div>{user?.fullName}</div>
					<div className='avatar__email'>{user?.email}</div>
				</React.Fragment>
			}
		>
			{content}
		</PopupHint >
	)
})