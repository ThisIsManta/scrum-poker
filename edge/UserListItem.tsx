import React from 'react'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'

import useUser, { User } from './useUser'
import Avatar from './Avatar'

export default function UserListItem(props: {
	userID: User['id']
	onClick: () => void
}) {
	const user = useUser(props.userID)

	if (!user) {
		return null
	}

	return (
		<ListItem button onClick={props.onClick}>
			<ListItemAvatar>
				<Avatar userID={props.userID} size={40} clued={false} />
			</ListItemAvatar>
			<ListItemText primary={user.fullName} secondary={user.email} />
		</ListItem>
	)
}