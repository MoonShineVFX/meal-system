import { Switch } from '@headlessui/react'

export default function SwitchButton(props: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <Switch
      checked={props.checked}
      onChange={props.onChange}
      className={
        'relative inline-flex h-[2rem] w-[3.375rem] shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-300 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75 ui-checked:bg-amber-400' +
        (props.className ? ' ' + props.className : '')
      }
    >
      <span
        aria-hidden='true'
        className='pointer-events-none inline-block h-[1.625rem] w-[1.625rem] translate-x-0 transform rounded-full bg-stone-100 shadow-md transition duration-200 ease-in-out ui-checked:translate-x-6'
      />
    </Switch>
  )
}
