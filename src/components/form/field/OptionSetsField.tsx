import {
  Bars3Icon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState, useCallback, useRef } from 'react'
import { FieldValues } from 'react-hook-form'
import { useDragControls, Reorder } from 'framer-motion'

import trpc from '@/lib/client/trpc'
import { useStore, NotificationType } from '@/lib/client/store'
import { OptionSet, OptionValue, getOptionName } from '@/lib/common'
import Spinner from '@/components/core/Spinner'
import { InputFieldProps } from './define'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import TextInput from '../base/TextInput'
import CheckBox from '../base/CheckBox'
import NumberInput from '../base/NumberInput'

export default function OptionSetsField<T extends FieldValues>(
  props: InputFieldProps<'optionSets', T>,
) {
  const { data, isError, isLoading } = trpc.optionSet.get.useQuery()
  const [currentOptionSets, setCurrentOptionSets] = useState<OptionSet[]>(
    props.formInput.defaultValue || [],
  )
  const addNotification = useStore((state) => state.addNotification)

  // set rfh value
  useEffect(() => {
    if (
      currentOptionSets.length > 0 &&
      currentOptionSets.some((oss) => oss.options.length === 0)
    ) {
      props.useFormReturns.setError(props.formInput.name, {
        type: 'custom',
        message: '選項集內容不可為空',
      })
      return
    }
    props.useFormReturns.clearErrors(props.formInput.name)
    props.useFormReturns.setValue(
      props.formInput.name,
      currentOptionSets as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? currentOptionSets !== props.formInput.defaultValue
          : currentOptionSets.length > 0,
        shouldValidate: true,
      },
    )
  }, [currentOptionSets])

  const handleTemplateAdd = useCallback(
    (addedOptionSets: OptionSet[]) => {
      const addedNames = addedOptionSets.map((os) => os.name)
      if (currentOptionSets.some((os) => addedNames.includes(os.name))) {
        addNotification({
          type: NotificationType.ERROR,
          message: '選項集名稱重複',
        })
        return
      }
      setCurrentOptionSets((prev) => [...prev, ...addedOptionSets])
    },
    [currentOptionSets],
  )

  if (isLoading || isError) {
    return <Spinner className='h-12 w-12' />
  }

  return (
    <>
      {/* Template */}
      <DropdownMenu label='樣本' className='ml-auto text-stone-400'>
        {data.map((optionSets) => (
          <DropdownMenuItem
            key={optionSets.name}
            label={optionSets.name}
            onClick={() => handleTemplateAdd(optionSets.optionSets)}
          />
        ))}
      </DropdownMenu>
      {/* OptionSets */}
      <Reorder.Group
        axis='y'
        className='flex flex-col gap-2'
        values={currentOptionSets}
        onReorder={(newOptionSets) =>
          setCurrentOptionSets(
            newOptionSets.map((oss, index) => ({ ...oss, order: index })),
          )
        }
      >
        {currentOptionSets.map((optionSet, index) => (
          <OptionSetField
            key={optionSet.name}
            optionSet={optionSet}
            added={
              optionSet.name === '' && index === currentOptionSets.length - 1
            }
            onChange={(newOptionSet) => {
              if (newOptionSet && newOptionSet.name !== optionSet.name) {
                if (
                  currentOptionSets.some((os) => os.name === newOptionSet.name)
                ) {
                  addNotification({
                    type: NotificationType.ERROR,
                    message: '選項集名稱重複',
                  })
                  return false
                }
              }
              if (newOptionSet === undefined) {
                setCurrentOptionSets((prevOptionSets) =>
                  prevOptionSets.filter((os) => os.name !== optionSet.name),
                )
              } else {
                setCurrentOptionSets((prevOptionSets) =>
                  prevOptionSets.map((os) =>
                    os.name === optionSet.name ? newOptionSet : os,
                  ),
                )
              }
              return true
            }}
          />
        ))}
        <button
          type='button'
          className='mx-auto flex w-fit items-center rounded-2xl p-2 text-sm hover:bg-stone-100 active:scale-95'
          onClick={() => {
            setCurrentOptionSets((prevOptionSets) => [
              ...prevOptionSets,
              {
                name: '',
                options: [],
                multiSelect: false,
                order: prevOptionSets.length,
              },
            ])
          }}
        >
          新增選項集
          <PlusIcon className='h-4 w-4' />
        </button>
      </Reorder.Group>
    </>
  )
}

function OptionSetField(props: {
  optionSet: OptionSet
  onChange: (optionSet: OptionSet | undefined) => boolean
  added?: boolean
}) {
  const controls = useDragControls()
  const [isEdit, setIsEdit] = useState(props.added ?? false)
  const inputRef = useRef<HTMLInputElement>(null)

  // autofocus
  useEffect(() => {
    if (!isEdit || !inputRef.current) return
    inputRef.current.focus()
  }, [isEdit, inputRef.current])

  // applyedit
  const applyEdit = useCallback(() => {
    if (!inputRef.current) return
    const name = inputRef.current.value.trim()
    if (name !== '') {
      const result = props.onChange({
        ...props.optionSet,
        name,
      })
      if (!result) {
        inputRef.current.value = props.optionSet.name
      }
    } else {
      props.onChange(undefined)
      inputRef.current.value = props.optionSet.name
    }

    setIsEdit(false)
  }, [inputRef.current, props.onChange])

  return (
    <Reorder.Item
      className='rounded-2xl border bg-white p-3'
      value={props.optionSet}
      dragListener={false}
      dragControls={controls}
    >
      {/* Header */}
      <div className='mb-2 flex items-center'>
        <Bars3Icon
          className='h-5 w-5 cursor-grab text-stone-300'
          onPointerDown={(e) => controls.start(e)}
        />
        <div onClick={() => setIsEdit(true)}>
          <TextInput
            ref={inputRef}
            className={twMerge(
              'ml-1 max-w-[10ch] rounded-md border-transparent bg-white p-1 placeholder:text-stone-300 disabled:pointer-events-auto disabled:opacity-100',
              !isEdit && 'cursor-text hover:bg-stone-100',
              isEdit && 'bg-stone-100',
            )}
            placeholder={props.optionSet.name}
            disabled={!isEdit}
            onBlur={applyEdit}
            defaultValue={props.optionSet.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyEdit()
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
        </div>
        <button
          type='button'
          className='ml-auto rounded-full p-1 hover:bg-stone-100 active:scale-90'
          onClick={() => props.onChange(undefined)}
        >
          <XMarkIcon className='h-5 w-5 text-stone-400' />
        </button>
      </div>
      {/* Multiselect */}
      <label className='mb-3 flex cursor-pointer items-center gap-2'>
        <CheckBox
          className='h-4 w-4 rounded-lg'
          checked={props.optionSet.multiSelect}
          onChange={(e) =>
            props.onChange({
              ...props.optionSet,
              multiSelect: e.target.checked,
            })
          }
        />
        <span className='text-sm text-stone-500'>多選</span>
      </label>
      {/* Options */}
      <div>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={props.optionSet.options}
          onReorder={(newOptions) =>
            props.onChange({ ...props.optionSet, options: newOptions })
          }
        >
          {props.optionSet.options.map((option, index) => (
            <OptionField
              key={getOptionName(option)}
              option={option}
              onChange={(newOption) =>
                props.onChange({
                  ...props.optionSet,
                  options: [
                    ...new Set(
                      props.optionSet.options
                        .map((o) => (o === option ? newOption : o))
                        .filter((o) => o !== ''),
                    ),
                  ],
                })
              }
              added={
                option === ' ' && index === props.optionSet.options.length - 1
              }
            />
          ))}
          <button
            type='button'
            className='mx-auto flex w-fit items-center rounded-2xl p-2 text-sm hover:bg-stone-100 active:scale-95'
            onClick={() => {
              props.onChange({
                ...props.optionSet,
                options: [...props.optionSet.options, ' '],
              })
            }}
          >
            新增選項
            <PlusIcon className='h-4 w-4' />
          </button>
        </Reorder.Group>
      </div>
    </Reorder.Item>
  )
}

function OptionField(props: {
  option: OptionValue
  onChange: (option: OptionValue) => void
  added?: boolean
}) {
  const controls = useDragControls()
  const [isEditName, setIsEditName] = useState(props.added ?? false)
  const [isEditPrice, setIsEditPrice] = useState(false)
  const inputNameRef = useRef<HTMLInputElement>(null)
  const inputPriceRef = useRef<HTMLInputElement>(null)

  // autofocus
  useEffect(() => {
    if (!isEditName || !inputNameRef.current) return
    inputNameRef.current.focus()
  }, [isEditName, inputNameRef.current])

  // autofocus
  useEffect(() => {
    if (!isEditPrice || !inputPriceRef.current) return
    inputPriceRef.current.focus()
  }, [isEditPrice, inputPriceRef.current])

  // applyedit
  const applyEdit = useCallback(() => {
    if (!inputNameRef.current || !inputPriceRef.current) return
    props.onChange({
      name: inputNameRef.current.value.trim(),
      price: parseInt(inputPriceRef.current.value),
    })
    setIsEditName(false)
    setIsEditPrice(false)
  }, [inputNameRef.current, inputPriceRef.current, props.onChange])

  const name = getOptionName(props.option)
  const price = typeof props.option === 'string' ? 0 : props.option.price

  return (
    <Reorder.Item
      className='flex items-center rounded-2xl border bg-white px-2 py-1'
      value={props.option}
      dragListener={false}
      dragControls={controls}
    >
      <Bars3Icon
        className='mr-2 h-4 w-4 cursor-grab text-stone-300'
        onPointerDown={(e) => controls.start(e)}
      />
      {/* Name */}
      <div onClick={() => setIsEditName(true)} className='cursor-text'>
        <TextInput
          ref={inputNameRef}
          className={twMerge(
            'ml-1 max-w-[10ch] rounded-md border-transparent bg-white p-1 placeholder:text-stone-300 disabled:opacity-100',
            !isEditName && 'pointer-events-none hover:bg-stone-100',
            isEditName && 'bg-stone-100',
          )}
          placeholder={name}
          disabled={!isEditName}
          onBlur={applyEdit}
          defaultValue={props.added ? '' : name}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyEdit()
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        />
      </div>
      {/* Price */}
      <div
        onClick={() => setIsEditPrice(true)}
        className='flex cursor-text items-center'
      >
        <span className='text-sm text-stone-300'>$</span>
        <NumberInput
          ref={inputPriceRef}
          className={twMerge(
            'ml-1 max-w-[6ch] rounded-md border-transparent bg-white p-1 placeholder:text-stone-300 disabled:opacity-100',
            !isEditPrice && 'pointer-events-none hover:bg-stone-100',
            isEditPrice && 'bg-stone-100',
          )}
          disabled={!isEditPrice}
          onBlur={applyEdit}
          defaultValue={price}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyEdit()
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        />
      </div>
      {/* Delete */}
      <button
        type='button'
        className='ml-auto rounded-full p-1 hover:bg-stone-100 active:scale-90'
        onClick={() => props.onChange('')}
      >
        <TrashIcon className='h-4 w-4 text-stone-300' />
      </button>
    </Reorder.Item>
  )
}
