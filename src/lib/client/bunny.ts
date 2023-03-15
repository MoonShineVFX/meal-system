export async function uploadImage(props: {
  apiKey: string
  url: string
  filename: string
  file: File
}) {
  const options = {
    method: 'PUT',
    headers: {
      AccessKey: props.apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: props.file,
  }
  const response = await fetch(`${props.url}/${props.filename}`, options)
  if (response.ok) {
    return true
  }
  console.error(response)
  return false
}
