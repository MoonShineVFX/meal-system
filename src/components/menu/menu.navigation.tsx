import { parseAsInteger, useQueryState } from 'nuqs'

export function useMenuNavigation() {
  const [comId, setComId] = useQueryState(
    'c',
    parseAsInteger.withOptions({
      history: 'push',
    }),
  )
  const [menuId, setMenuId] = useQueryState(
    'm',
    parseAsInteger.withOptions({
      history: 'push',
    }),
  )

  return {
    comId,
    setComId,
    menuId,
    setMenuId,
  }
}
