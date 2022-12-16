import { useEffect } from 'react'
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  Path,
  FieldErrorsImpl,
} from 'react-hook-form'

import Image from '@/components/core/Image'
import Title from '@/components/core/Title'
import trpc from '@/lib/client/trpc'
import { generateCookie, settings, twData } from '@/lib/common'
import Logo from '@/components/core/Logo'
import Button from '@/components/core/Button'

type FormInputs = {
  username: string
  password: string
}

export default function PageLogin() {
  const loginMutation = trpc.user.login.useMutation()
  const trpcContext = trpc.useContext()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>()

  useEffect(() => {
    // Logout the user when enter the page
    document.cookie = generateCookie(undefined) // Remove the cookie
    trpcContext.user.get.invalidate()
  }, [])

  const handleLogin: SubmitHandler<FormInputs> = async (formData) => {
    loginMutation.mutate(
      {
        username: formData.username,
        password: formData.password,
      },
      {
        // If the login is successful, reload to the home page at @/lib/client/trpc.ts [authLink]
      },
    )
  }

  const isBusy = loginMutation.isLoading || loginMutation.isSuccess

  return (
    <div className='fixed inset-0 flex'>
      <Title prefix='登入' />
      <section className='flex w-full shrink-0 flex-col justify-center bg-white md:max-w-md'>
        <form
          className='group relative mx-auto flex w-full max-w-sm flex-col gap-8 py-8 px-10'
          onSubmit={handleSubmit(handleLogin)}
          data-ui={twData({ loading: isBusy })}
        >
          <Logo className='w-40 text-yellow-500' />
          <h3 className='indent-[0.05em] text-xl font-bold tracking-wider'>
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
      <input
        {...props}
        {...register(name, {
          required: '此欄位為必填',
        })}
        autoCapitalize='none'
        autoCorrect='off'
        className='rounded-2xl border-[0.0625rem] border-stone-300 bg-stone-100 py-2 px-4 text-lg font-bold focus:outline-yellow-500 disabled:opacity-75'
      />
    </div>
  )
}
