import React from 'react'
import Tooltip from '@mui/material/Tooltip'

import './Avatar.less'
import useUser, { User } from './useUser'

export default function Avatar(props: {
	userID: User['id']
	size?: number
	faded?: boolean
}) {
	const user = useUser(props.userID)

	const size = props.size || 70

	const renderContent = () => {
		if (user?.photo) {
			return (
				<img
					className='avatar__photo'
					src={user.photo}
					onError={(e) => {
						// Retry loading the image as photos from Google fail often times
						e.currentTarget.src = user.photo!
					}}
				/>
			)
		}

		return user?.codeName
	}

	return (
		<Tooltip
			arrow
			placement='bottom-start'
			title={
				<div>
					<div><strong>{user?.fullName}</strong></div>
					<div>{user?.email}</div>
				</div>
			}
		>
			<div
				className='avatar'
				style={{
					width: size,
					height: size,
					fontSize: Math.ceil(size / 2),
					opacity: props.faded ? 0.4 : 1,
				}}
			>
				{renderContent()}
			</div>
		</Tooltip >
	)
}