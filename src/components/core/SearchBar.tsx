import { memo, ChangeEvent, useCallback, useRef, startTransition } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

import Spinner from '@/components/core/Spinner'

function SearchBar(props: {
  className?: string
  placeholder?: string
  hint?: string
  isLoading: boolean
  searchKeyword: string
  setSearchKeyword: (keyword: string) => void
}) {
  const searchRef = useRef<HTMLInputElement>(null)
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value
      startTransition(() => {
        // avoid 注音 typing
        if (!text.match(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/)) {
          props.setSearchKeyword(text)
        }
      })
    },
    [],
  )

  const handleSearchClear = useCallback(() => {
    props.setSearchKeyword('')
    if (!searchRef.current) return
    searchRef.current.value = ''
    searchRef.current.focus()
  }, [])

  return (
    <div className={props.className}>
      <div key='searchBar' className='flex flex-col items-center gap-2'>
        <div className='relative w-full'>
          <input
            ref={searchRef}
            type='text'
            className='w-full rounded-2xl border border-stone-300 bg-stone-100 py-2 px-4 placeholder:text-stone-400 focus:border-yellow-500 focus:ring-yellow-500'
            placeholder={props.placeholder}
            defaultValue={props.searchKeyword}
            onChange={handleSearchChange}
          />
          <div className='absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 stroke-2 text-stone-400'>
            {props.isLoading ? (
              <Spinner className='h-full w-full' />
            ) : props.searchKeyword.length > 0 ? (
              <XMarkIcon
                className='h-full w-full cursor-pointer rounded-full hover:scale-125 hover:bg-stone-200 active:scale-95 active:bg-stone-200'
                onClick={handleSearchClear}
              />
            ) : (
              <MagnifyingGlassIcon className='h-full w-full' />
            )}
          </div>
        </div>
        {props.hint && <p className='text-xs text-stone-400'>{props.hint}</p>}
      </div>
    </div>
  )
}

export default memo(SearchBar)
