import { FormEvent, useEffect } from 'react'
import Image from 'next/image'

import CoverImage from '/public/resource/cover1.jpg'

import trpc from '@/lib/client/trpc'
import { generateCookie } from '@/lib/common'
import Spinner from '@/components/Spinner'
import { useStore, NotificationType } from '@/lib/client/store'
import Logo from '@/components/Logo'

interface LoginFormElements extends HTMLFormControlsCollection {
  username: HTMLInputElement
  password: HTMLInputElement
}

interface LoginFormElement extends HTMLFormElement {
  readonly elements: LoginFormElements
}

export default function PageLogin() {
  const loginMutation = trpc.user.login.useMutation()
  const trpcContext = trpc.useContext()
  const addNotification = useStore((state) => state.addNotification)

  useEffect(() => {
    // Logout the user when enter the page
    document.cookie = generateCookie(undefined) // Remove the cookie
    trpcContext.user.info.invalidate()
  }, [])

  const handleLogin = async (event: FormEvent<LoginFormElement>) => {
    event.preventDefault()
    loginMutation.mutate(
      {
        username: event.currentTarget.elements.username.value,
        password: event.currentTarget.elements.password.value,
      },
      {
        // If the login is successful, reload to the home page
        onSuccess: async () => {
          addNotification({
            type: NotificationType.SUCCESS,
            message: '登入成功',
          })
        },
        onError: (error) => {
          addNotification({
            type: NotificationType.ERROR,
            message: error.message,
          })
        },
      },
    )
  }

  const isBusy = loginMutation.isLoading || loginMutation.isSuccess

  return (
    <div className='absolute inset-0 flex'>
      <div className='flex w-full shrink-0 flex-col justify-center bg-stone-100 lg:max-w-md'>
        <form
          className='group mx-auto flex w-full max-w-sm flex-col gap-8 py-8 px-10'
          onSubmit={handleLogin}
          data-ui={isBusy ? 'loading' : ''}
        >
          <Logo className='w-40 text-violet-500' />
          <h1 className='relative text-xl font-bold tracking-wider text-gray-500'>
            請登入夢想 AD 帳號
            {loginMutation.isError && (
              <div className='absolute text-sm font-normal text-red-400'>
                {loginMutation.error.message}
              </div>
            )}
          </h1>
          <InputField
            disabled={isBusy}
            label='帳號'
            type='text'
            name='username'
            placeholder=''
            autoComplete='username'
          />
          <InputField
            disabled={isBusy}
            label='密碼'
            type='password'
            name='password'
            placeholder=''
            autoComplete='password'
          />
          <button
            disabled={isBusy}
            className='flex h-12 items-center justify-center rounded-md bg-violet-500 text-lg font-bold tracking-widest text-gray-100 hover:bg-violet-600 active:bg-amber-900 disabled:opacity-75 disabled:hover:bg-gray-800'
            type='submit'
          >
            {loginMutation.isSuccess ? (
              '登入成功'
            ) : (
              <>
                <Spinner className='hidden h-6 w-6 group-data-loading:block' />
                <p className='group-data-loading:hidden'>登入</p>
              </>
            )}
          </button>
        </form>
      </div>
      <div className='relative hidden grow lg:block'>
        <Image
          className='object-cover'
          fill
          src={CoverImage}
          alt='Cover Image'
        />
      </div>
    </div>
  )
}

function InputField(props: {
  disabled: boolean
  label: string
  type: string
  name: string
  placeholder: string
  defaultValue?: string
  autoComplete?: string
}) {
  return (
    <div className='flex flex-col gap-1'>
      <p className='text-sm text-gray-500'>{props.label}</p>
      <input
        required={true}
        disabled={props.disabled}
        type={props.type}
        name={props.name}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        autoComplete={props.autoComplete}
        autoCapitalize='none'
        autoCorrect='off'
        className='rounded-md border-[1px] border-gray-300 bg-gray-100 p-2 text-lg font-bold text-gray-600 focus:outline-violet-500 disabled:opacity-75'
      />
    </div>
  )
}
