import { trpc } from '@/utils/trpcClient'

export default function PageLogin() {
  const loginMutation = trpc.user.login.useMutation()

  const handleLogin = async () => {
    loginMutation.mutate(undefined, {
      onSuccess: (data) => {
        const date = new Date()
        date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000)
        document.cookie = `test_token=${
          data.token
        }; expires=${date.toUTCString()}; path=/`
        console.log('Logged in!')
      },
    })
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin} disabled={loginMutation.isLoading}>
        login
      </button>

      {loginMutation.isLoading && <div>Loading...</div>}
      {loginMutation.isSuccess && <div>Success!</div>}
      {loginMutation.isError && <div>Error: {loginMutation.error.message}</div>}
      {loginMutation.data && (
        <div>data: {JSON.stringify(loginMutation.data)}</div>
      )}
    </div>
  )
}
