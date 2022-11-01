import trpc from '@/utils/trpc'
import { useRouter } from 'next/router'
import { FormEvent } from 'react'

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
      }
    )
  }

  return (
    <div className="w-full flex flex-col items-center p-8">
      <form className="flex flex-col gap-8" onSubmit={handleLogin}>
        <input type="text" name="username" placeholder="username" />
        <input type="password" name="password" placeholder="password" />
        <button
          disabled={loginMutation.isLoading}
          className="border-2 p-1 rounded-md"
          type="submit"
        >
          login
        </button>
      </form>

      {loginMutation.isLoading && <div>Loading...</div>}
      {loginMutation.isSuccess && <div>Success!</div>}
      {loginMutation.isError && <div>Error: {loginMutation.error.message}</div>}
    </div>
  )
}
