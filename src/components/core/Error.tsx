import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function Error(props: { title?: string; description: string }) {
  return (
    <div className='grid h-full w-full place-content-center'>
      <div className='flex flex-col items-center gap-2'>
        <ExclamationCircleIcon className='h-16 w-16 font-bold text-red-400' />
        <p className='text-lg font-bold'>{props.title ?? 'Oops!'}</p>
        <p className='max-w-[60ch] text-stone-400'>{props.description}</p>
      </div>
    </div>
  )
}
