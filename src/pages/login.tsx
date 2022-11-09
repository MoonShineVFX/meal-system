import trpc from '@/trpc/client/client'
import { useRouter } from 'next/router'
import { FormEvent, useEffect } from 'react'
import { generateCookie } from '@/utils/settings'
import Spinner from '@/components/Spinner'

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
  const router = useRouter()

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
        // If the login is successful, redirect to the home page
        onSuccess: async () => {
          await trpcContext.user.info.invalidate()
          router.push('/')
        },
      },
    )
  }

  const isBusy = loginMutation.isLoading || loginMutation.isSuccess

  return (
    <div className='absolute top-0 bottom-0 flex w-full max-w-lg flex-col justify-center gap-2 px-8'>
      <form
        className='group flex w-full flex-col gap-8 rounded-xl bg-amber-400 py-8 px-10 shadow-xl'
        onSubmit={handleLogin}
        data-ui={isBusy ? 'loading' : ''}
      >
        <h1 className='relative text-3xl font-bold text-stone-800'>
          請登入夢想 AD
          {loginMutation.isError && (
            <div className='absolute text-base font-normal text-red-800'>
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
          className='flex h-14 items-center justify-center rounded-xl bg-stone-800 text-lg tracking-widest text-stone-100 shadow-lg hover:bg-amber-900 active:bg-amber-900 disabled:opacity-75 disabled:hover:bg-stone-800'
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
      <p className='font-bold'>{props.label}</p>
      <input
        required={true}
        disabled={props.disabled}
        type={props.type}
        name={props.name}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        autoComplete={props.autoComplete}
        className='rounded-md border-2 bg-stone-100 p-2 text-lg outline-stone-400 focus:outline-amber-500 disabled:opacity-75'
      />
    </div>
  )
}
