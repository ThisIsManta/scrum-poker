import { useState, useCallback, useEffect } from 'react'

export default function useHash() {
	const [hash, setHashInternal] = useState(() => window.location.hash)

	useEffect(() => {
		const onHashChange = () => {
			setHashInternal(window.location.hash)
		}

		window.addEventListener('hashchange', onHashChange)

		return () => {
			window.removeEventListener('hashchange', onHashChange)
		}
	}, [])

	const setHash = useCallback((newHash: string) => {
		if (newHash !== hash) {
			window.location.hash = newHash
		}
	}, [hash])

	return [hash.replace(/^#/, ''), setHash] as const
}