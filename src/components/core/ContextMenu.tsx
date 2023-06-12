/* Modified from floating-ui example: https://codesandbox.io/s/trusting-rui-2duieo */
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  Fragment,
} from 'react'
import {
  useFloating,
  autoUpdate,
  flip,
  offset,
  shift,
  useRole,
  useDismiss,
  useInteractions,
  useListNavigation,
  useTypeahead,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
} from '@floating-ui/react'
import { Transition } from '@headlessui/react'

export const ContextMenuItem = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string | JSX.Element
    disabled?: boolean
  }
>(({ label, disabled, ...props }, ref) => {
  return (
    <button
      {...props}
      className='w-full px-4 py-2 text-left text-sm text-stone-500 hover:bg-stone-100 active:scale-90'
      ref={ref}
      role='menuitem'
      disabled={disabled}
    >
      {label}
    </button>
  )
})

interface Props {
  parentRef?: React.RefObject<HTMLElement>
}

export const ContextMenu = forwardRef<
  HTMLDivElement,
  Props & React.HTMLProps<HTMLDivElement>
>(({ children, parentRef }, ref) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const listItemsRef = useRef<Array<HTMLButtonElement | null>>([])
  const listContentRef = useRef(
    Children.map(children, (child) =>
      isValidElement(child) ? child.props.label : null,
    ) as Array<string | null>,
  )
  const allowMouseUpCloseRef = useRef(false)

  const { x, y, refs, strategy, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset({ mainAxis: 5, alignmentAxis: 4 }),
      flip({
        fallbackPlacements: ['left-start'],
      }),
      shift({ padding: 10 }),
    ],
    placement: 'right-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
  })

  const role = useRole(context, { role: 'menu' })
  const dismiss = useDismiss(context)
  const listNavigation = useListNavigation(context, {
    listRef: listItemsRef,
    onNavigate: setActiveIndex,
    activeIndex,
  })
  const typeahead = useTypeahead(context, {
    enabled: isOpen,
    listRef: listContentRef,
    onMatch: setActiveIndex,
    activeIndex,
  })

  const { getFloatingProps, getItemProps } = useInteractions([
    role,
    dismiss,
    listNavigation,
    typeahead,
  ])

  useEffect(() => {
    if (!parentRef?.current) return

    let timeout: number
    const parentElement = parentRef.current

    function onContextMenu(e: MouseEvent) {
      e.preventDefault()

      refs.setPositionReference({
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: e.clientX,
            y: e.clientY,
            top: e.clientY,
            right: e.clientX,
            bottom: e.clientY,
            left: e.clientX,
          }
        },
      })

      setIsOpen(true)
      clearTimeout(timeout)

      allowMouseUpCloseRef.current = false
      timeout = window.setTimeout(() => {
        allowMouseUpCloseRef.current = true
      }, 300)
    }

    function onMouseUp() {
      if (allowMouseUpCloseRef.current) {
        setIsOpen(false)
      }
    }

    parentElement.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('mouseup', onMouseUp)
      clearTimeout(timeout)
    }
  }, [refs, parentRef?.current])

  return (
    <FloatingPortal>
      {isOpen && (
        <FloatingOverlay lockScroll>
          <FloatingFocusManager context={context} initialFocus={refs.floating}>
            <Transition
              show={isOpen}
              as={Fragment}
              appear={true}
              enter='transition duration-100 ease-out'
              enterFrom={'opacity-0'}
              enterTo={'opacity-100'}
              leave='transition duration-75 ease-out'
              leaveFrom={'opacity-100'}
              leaveTo={'opacity-0'}
            >
              <div
                className='flex flex-col rounded-2xl border bg-white py-2 shadow-md'
                ref={(r) => {
                  refs.setFloating(r)
                  if (ref && r) {
                    if (typeof ref === 'function') {
                      ref(r)
                    } else {
                      ref.current = r
                    }
                  }
                }}
                style={{
                  position: strategy,
                  left: x ?? 0,
                  top: y ?? 0,
                }}
                {...getFloatingProps()}
              >
                {Children.map(
                  children,
                  (child, index) =>
                    isValidElement(child) &&
                    cloneElement(
                      child,
                      getItemProps({
                        tabIndex: activeIndex === index ? 0 : -1,
                        ref(node: HTMLButtonElement) {
                          listItemsRef.current[index] = node
                        },
                        onClick() {
                          child.props.onClick?.()
                          setIsOpen(false)
                        },
                        onMouseUp() {
                          child.props.onClick?.()
                          setIsOpen(false)
                        },
                      }),
                    ),
                )}
              </div>
            </Transition>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </FloatingPortal>
  )
})
