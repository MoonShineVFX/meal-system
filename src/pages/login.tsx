import { FormEvent, useEffect } from 'react'

import Image from '@/components/core/Image'
import Title from '@/components/core/Title'
import trpc from '@/lib/client/trpc'
import { generateCookie, settings, twData } from '@/lib/common'
import { useStore, NotificationType } from '@/lib/client/store'
import Logo from '@/components/core/Logo'
import Button from '@/components/core/Button'

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
    trpcContext.user.get.invalidate()
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
    <div className='fixed inset-0 flex'>
      <Title prefix='登入' />
      <div className='flex w-full shrink-0 flex-col justify-center bg-white md:max-w-md'>
        <form
          className='group relative mx-auto flex w-full max-w-sm flex-col gap-8 py-8 px-10'
          onSubmit={handleLogin}
          data-ui={twData({ loading: isBusy })}
        >
          <Logo className='w-40 text-yellow-500' />
          <h1 className='text-xl font-bold tracking-wider'>
            請登入夢想 AD 帳號
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
          <Button
            className='h-12'
            textClassName='text-lg font-bold'
            isBusy={isBusy}
            isLoading={loginMutation.isLoading}
            isSuccess={loginMutation.isSuccess}
            type='submit'
            label='登入'
            labelOnSuccess='登入成功'
          />
          {loginMutation.isError && (
            <div className='absolute bottom-0 text-sm font-normal text-red-400'>
              ⚠️{loginMutation.error.message}
            </div>
          )}
        </form>
      </div>
      <div className='relative hidden grow md:block'>
        <Image
          className='object-cover'
          fill
          src={settings.RESOURCE_LOGIN_COVER}
          sizes='100vw'
          alt='Cover Image'
          priority
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
    <div className='flex flex-col gap-2'>
      <p className='text-sm'>{props.label}</p>
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
        className='rounded-2xl border-[1px] border-stone-300 bg-stone-100 py-2 px-4 text-lg font-bold focus:outline-yellow-500 disabled:opacity-75'
      />
    </div>
  )
}
