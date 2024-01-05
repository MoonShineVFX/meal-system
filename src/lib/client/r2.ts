export async function upload(props: {
  blob: Blob
  url: string
  filename: string
  type: string
}) {
  const file = new File([props.blob], props.filename)
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': props.type,
    },
    body: file,
  }

  try {
    // Retry 3 times on [503 service unavailable]
    let response = await fetch(`${props.url}`, options)
    let retryCount = 0
    while (response.status === 503 && retryCount < 3) {
      response = await fetch(`${props.url}`, options)
      retryCount++
    }

    if (response.ok) {
      return {
        isSuccess: true,
      }
    }
    console.error(response)
    return {
      isSuccess: false,
      message: response.statusText,
    }
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        isSuccess: false,
        message: error.message,
      }
    }
    return {
      isSuccess: false,
      message: 'Unknown error',
    }
  }
}
