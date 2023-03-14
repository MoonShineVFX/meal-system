import type { NextApiRequest, NextApiResponse } from 'next'

export default async function api(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const { depositId } = req.query
  if (typeof depositId !== 'string') {
    res.status(400).json({
      error: 'depositId is required',
    })
    return
  }

  res.status(200).redirect(307, `/deposit/${depositId}?notify=true`)
}
