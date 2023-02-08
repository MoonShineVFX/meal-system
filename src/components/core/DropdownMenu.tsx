/* Modified from floating-ui example */
import * as React from 'react'
import { twMerge } from 'tailwind-merge'
import {
  useFloating,
  offset,
  flip,
  shift,
  useListNavigation,
  useHover,
  useTypeahead,
  useInteractions,
  useRole,
  useClick,
  useDismiss,
  autoUpdate,
  safePolygon,
  FloatingPortal,
  useFloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useMergeRefs,
  FloatingNode,
  FloatingTree,
  FloatingFocusManager,
} from '@floating-ui/react'
import { Transition } from '@headlessui/react'

import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface MenuItemProps {
  label: string
  disabled?: boolean
}

export const DdMenuItem = React.forwardRef<
  HTMLButtonElement,
  MenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ label, disabled, ...props }, ref) => {
  return (
    <button
      {...props}
      ref={ref}
      role='menuitem'
      disabled={disabled}
      type='button'
    >
      {label}
    </button>
  )
})

interface MenuProps {
  label: string
  nested?: boolean
  children?: React.ReactNode
}
export const MenuComponent = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>(({ children, label, ...props }, forwardedRef) => {
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [allowHover, setAllowHover] = React.useState(false)

  const listItemsRef = React.useRef<Array<HTMLButtonElement | null>>([])
  const listContentRef = React.useRef(
    React.Children.map(children, (child) =>
      React.isValidElement(child) ? child.props.label : null,
    ) as Array<string | null>,
  )

  const tree = useFloatingTree()
  const nodeId = useFloatingNodeId()
  const parentId = useFloatingParentNodeId()
  const nested = parentId != null

  const { x, y, strategy, refs, context } = useFloating<HTMLButtonElement>({
    open,
    nodeId,
    onOpenChange: setOpen,
    placement: nested ? 'right-start' : 'bottom-start',
    middleware: [
      offset({ mainAxis: 5, alignmentAxis: nested ? -8 : 0 }),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [
      useHover(context, {
        handleClose: safePolygon({
          restMs: 25,
          blockPointerEvents: true,
        }),
        enabled: nested && allowHover,
        delay: { open: 75 },
      }),
      useClick(context, {
        toggle: !nested || !allowHover,
        event: 'mousedown',
        ignoreMouse: nested,
      }),
      useRole(context, { role: 'menu' }),
      useDismiss(context),
      useListNavigation(context, {
        listRef: listItemsRef,
        activeIndex,
        nested,
        onNavigate: setActiveIndex,
      }),
      useTypeahead(context, {
        listRef: listContentRef,
        onMatch: open ? setActiveIndex : undefined,
        activeIndex,
      }),
    ],
  )

  // Event emitter allows you to communicate across tree components.
  // This effect closes all menus when an item gets clicked anywhere
  // in the tree.
  React.useEffect(() => {
    function handleTreeClick() {
      setOpen(false)
    }

    function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
      if (event.nodeId !== nodeId && event.parentId === parentId) {
        setOpen(false)
      }
    }

    tree?.events.on('click', handleTreeClick)
    tree?.events.on('menuopen', onSubMenuOpen)

    return () => {
      tree?.events.off('click', handleTreeClick)
      tree?.events.off('menuopen', onSubMenuOpen)
    }
  }, [tree, nodeId, parentId])

  React.useEffect(() => {
    if (open) {
      tree?.events.emit('menuopen', {
        parentId,
        nodeId,
      })
    }
  }, [tree, open, nodeId, parentId])

  // Determine if "hover" logic can run based on the modality of input. This
  // prevents unwanted focus synchronization as menus open and close with
  // keyboard navigation and the cursor is resting on the menu.
  React.useEffect(() => {
    function onPointerMove({ pointerType }: PointerEvent) {
      if (pointerType !== 'touch') {
        setAllowHover(true)
      }
    }

    function onKeyDown() {
      setAllowHover(false)
    }

    window.addEventListener('pointermove', onPointerMove, {
      once: true,
      capture: true,
    })
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointermove', onPointerMove, {
        capture: true,
      })
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [allowHover])

  const referenceRef = useMergeRefs([refs.setReference, forwardedRef])

  return (
    <FloatingNode id={nodeId}>
      <button
        type='button'
        ref={referenceRef}
        data-open={open ? '' : undefined}
        {...getReferenceProps({
          ...props,
          className: `${
            nested
              ? 'flex w-full min-w-[7rem] justify-between text-left p-2 hover:bg-stone-100 items-center'
              : 'p-1 rounded-2xl hover:bg-stone-100 text-sm flex items-center gap-1 w-fit'
          }`,
          onClick(event) {
            event.stopPropagation()
          },
          ...(nested && {
            // Indicates this is a nested <Menu /> acting as a <MenuItem />.
            role: 'menuitem',
          }),
        })}
      >
        {label}
        {nested ? (
          <ChevronRightIcon className='h-4 w-4' aria-hidden />
        ) : (
          <ChevronDownIcon className='h-4 w-4' aria-hidden />
        )}
      </button>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager
            context={context}
            // Prevent outside content interference.
            modal={!nested}
            // Only initially focus the root floating menu.
            initialFocus={nested ? -1 : 0}
            // Only return focus to the root menu's reference when menus close.
            returnFocus={!nested}
            // Allow touch screen readers to escape the modal root menu
            // without selecting anything.
            visuallyHiddenDismiss
          >
            <Transition
              as={React.Fragment}
              appear={true}
              enter='transition duration-100 ease-out'
              enterFrom={
                nested
                  ? 'transform scale-x-50 opacity-0'
                  : 'transform scale-y-50 opacity-0'
              }
              enterTo={
                nested
                  ? 'transform scale-x-100 opacity-100'
                  : 'transform scale-y-100 opacity-100'
              }
              leave='transition duration-75 ease-out'
              leaveFrom={
                nested
                  ? 'transform scale-x-100 opacity-100'
                  : 'transform scale-y-100 opacity-100'
              }
              leaveTo={
                nested
                  ? 'transform scale-x-50 opacity-0'
                  : 'transform scale-y-50 opacity-0'
              }
            >
              <div
                ref={refs.setFloating}
                className={twMerge(
                  'relative z-[1000] w-max origin-top-right overflow-hidden rounded-2xl border bg-white py-2 shadow-lg',
                  nested && 'origin-top-left',
                )}
                style={{
                  position: strategy,
                  top: y ?? 0,
                  left: x ?? 0,
                  width: 'max-content',
                }}
                {...getFloatingProps({
                  // Pressing tab dismisses the menu due to the modal
                  // focus management on the root menu.
                  onKeyDown(event) {
                    if (event.key === 'Tab') {
                      setOpen(false)

                      if (event.shiftKey) {
                        event.preventDefault()
                      }
                    }
                  },
                })}
              >
                {React.Children.map(
                  children,
                  (child, index) =>
                    React.isValidElement(child) &&
                    React.cloneElement(
                      child,
                      getItemProps({
                        tabIndex: activeIndex === index ? 0 : -1,
                        role: 'menuitem',
                        className:
                          'flex w-full justify-between p-2 text-left hover:bg-stone-100',
                        ref(node: HTMLButtonElement) {
                          listItemsRef.current[index] = node
                        },
                        onClick(event) {
                          child.props.onClick?.(event)
                          tree?.events.emit('click')
                        },
                        // Allow focus synchronization if the cursor did not move.
                        onMouseEnter() {
                          if (allowHover && open) {
                            setActiveIndex(index)
                          }
                        },
                      }),
                    ),
                )}
              </div>
            </Transition>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
})

export const DdMenu = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>((props, ref) => {
  const parentId = useFloatingParentNodeId()

  if (parentId == null) {
    return (
      <FloatingTree>
        <MenuComponent {...props} ref={ref} />
      </FloatingTree>
    )
  }

  return <MenuComponent {...props} ref={ref} />
})
