import { memo, ChangeEvent, useCallback, useRef, startTransition } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'

import Spinner from '@/components/core/Spinner'
import TextInput from '@/components/form/base/TextInput'

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
    <div className={twMerge('w-fit', props.className)}>
      <div key='searchBar' className='flex flex-col items-center gap-2'>
        <div className='relative w-full'>
          <TextInput
            ref={searchRef}
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
