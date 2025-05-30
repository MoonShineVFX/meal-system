import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { useEffect } from 'react'
import {
  FieldErrorsImpl,
  Path,
  SubmitHandler,
  useForm,
  UseFormRegister,
} from 'react-hook-form'

import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import Logo from '@/components/core/Logo'
import Title from '@/components/core/Title'
import TextInput from '@/components/form/base/TextInput'
import trpc from '@/lib/client/trpc'
import { generateCookie, settings, twData } from '@/lib/common'
import { NotificationType, useStore } from '@/lib/client/store'
import { useRouter } from 'next/router'
type FormInputs = {
  username: string
  password: string
}

export default function PageLogin() {
  const loginMutation = trpc.user.login.useMutation()
  const utils = trpc.useUtils()

  const addNotification = useStore((state) => state.addNotification)
  const loginRedirect = useStore((state) => state.loginRedirect_session)
  const setLoginRedirect = useStore((state) => state.setLoginRedirect)

  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>()

  useEffect(() => {
    // Logout the user when enter the page
    document.cookie = generateCookie(undefined) // Remove the cookie
    utils.user.get.invalidate()
  }, [])

  const handleLogin: SubmitHandler<FormInputs> = async (formData) => {
    loginMutation.mutate(
      {
        username: formData.username,
        password: formData.password,
      },
      {
        onSuccess: async (data) => {
          // Set authentication token in cookie
          document.cookie = generateCookie(data.token)

          // Get and clear any saved redirect path from login
          if (loginRedirect !== null) {
            setLoginRedirect(null)
          }

          // Invalidate all queries to refetch fresh data
          await utils.invalidate()

          // Redirect user to saved path or default live page
          router.push(loginRedirect === null ? '/live' : loginRedirect)

          // Show success notification
          addNotification({
            type: NotificationType.SUCCESS,
            message: '登入成功',
          })
        },
      },
    )
  }

  const isBusy = loginMutation.isPending || loginMutation.isSuccess

  return (
    <div className='fixed inset-0 flex'>
      <Title prefix='登入' />
      <section className='flex w-full shrink-0 flex-col justify-center bg-white md:max-w-md'>
        <form
          className='group relative mx-auto flex w-full max-w-sm flex-col gap-8 py-8 px-10'
          onSubmit={handleSubmit(handleLogin)}
          {...twData({ loading: isBusy })}
        >
          <Logo className='w-40 text-yellow-500' />
          <h3 className='text-xl font-bold tracking-wider'>
            請登入夢想 AD 帳號
          </h3>
          <InputField
            disabled={isBusy}
            label='帳號'
            type='text'
            placeholder=''
            autoComplete='username'
            name='username'
            register={register}
            errors={errors}
          />
          <InputField
            disabled={isBusy}
            label='密碼'
            type='password'
            placeholder=''
            autoComplete='password'
            name='password'
            register={register}
            errors={errors}
          />
          <Button
            className='h-12'
            textClassName='text-lg font-bold'
            isBusy={isBusy}
            isLoading={loginMutation.isPending}
            isSuccess={loginMutation.isSuccess}
            type='submit'
            label='登入'
            labelOnSuccess='登入成功'
          />
          <p className='mt-2 text-sm text-stone-400/80'>
            有任何問題請使用下列管道：
            <a
              className='rounded-2xl p-1 font-bold text-stone-400 hover:bg-stone-100'
              href={settings.ZULIP}
              target='_blank'
            >
              Zulip 公會頻道
            </a>
            、營運部、或來信
            <a
              className='rounded-2xl p-1 font-bold text-stone-400 hover:bg-stone-100'
              href={`mailto:${settings.EMAIL}`}
              target='_blank'
            >
              {settings.EMAIL}
            </a>
            詢問。
          </p>
          {loginMutation.isError && (
            <div className='absolute bottom-0 flex items-center gap-2 text-sm font-normal text-red-400'>
              <ExclamationTriangleIcon className='h-5 w-5' />
              {loginMutation.error.message}
            </div>
          )}
        </form>
      </section>
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

interface InputFieldProps extends React.HTMLProps<HTMLInputElement> {
  label: string
  register: UseFormRegister<FormInputs>
  name: Path<FormInputs>
  errors: FieldErrorsImpl<FormInputs>
}
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  register,
  ...props
}) => {
  const error = props.errors[name]
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-sm'>
        {label}
        <span className='ml-[1ch] text-red-400'>{error && error.message}</span>
      </p>
      <TextInput
        {...props}
        {...register(name, {
          required: '此欄位為必填',
        })}
        autoCapitalize='none'
        autoCorrect='off'
        className='px-4 text-lg font-bold'
      />
    </div>
  )
}
