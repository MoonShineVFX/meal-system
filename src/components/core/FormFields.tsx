import { PhotoIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState, useCallback } from 'react'
import {
  UseFormRegister,
  FieldValues,
  FieldPath,
  UseFormSetValue,
} from 'react-hook-form'
import { uploadImage } from '@/lib/client/bunny'

import trpc from '@/lib/client/trpc'
import { useStore, NotificationType } from '@/lib/client/store'
import { settings } from '@/lib/common'
import Spinner from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import type { FormInput } from './FormDialog'

/* Input Fields */
// Types
type InputFieldProps<
  TType extends FormInput['type'],
  TFieldValues extends FieldValues,
> = {
  errorMessage?: string
  formInput: Extract<FormInput, { type: TType }> & {
    name: FieldPath<TFieldValues>
  }
  register: UseFormRegister<TFieldValues>
}

// Components
function BaseLabel(props: {
  label: string
  errorMessage?: string
  children?: JSX.Element
}) {
  return (
    <div className='flex h-full flex-col gap-1'>
      <label className='text-sm font-bold text-stone-500'>
        {props.label}
        <span className='ml-[1ch] text-red-400'>{props.errorMessage}</span>
      </label>
      {props.children}
    </div>
  )
}

export function TextInputField<T extends FieldValues>(
  props: InputFieldProps<'text', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <input
          type='text'
          className='mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
      </BaseLabel>
    </div>
  )
}

export function TextAreaField<T extends FieldValues>(
  props: InputFieldProps<'textarea', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <textarea
          type='text'
          className='ms-scroll mx-1 max-h-72 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
      </BaseLabel>
    </div>
  )
}

export function SelectField<T extends FieldValues>(
  props: InputFieldProps<'select', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <select
          className={twMerge(
            'ms-scroll mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 focus:border-yellow-500 focus:ring-yellow-500',
            props.formInput.coreClassName,
          )}
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, {
            ...props.formInput.options,
          })}
        >
          {props.formInput.data.map((optionData) => {
            if ('children' in optionData) {
              return (
                <optgroup key={optionData.label} label={optionData.label}>
                  {optionData.children.map((child) => (
                    <option key={child.value} value={child.value}>
                      {child.label}
                    </option>
                  ))}
                </optgroup>
              )
            }
            return (
              <option key={optionData.value} value={optionData.value}>
                {optionData.label}
              </option>
            )
          })}
        </select>
      </BaseLabel>
    </div>
  )
}

export function CheckboxField<T extends FieldValues>(
  props: InputFieldProps<'checkbox', T>,
) {
  return (
    <div className={props.formInput.className}>
      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          className='focus:ring-none h-5 w-5 rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
        <span className='font-bold text-stone-500'>
          {props.formInput.label}
        </span>
        <span className='ml-[1ch] text-red-400'>{props.errorMessage}</span>
      </label>
    </div>
  )
}

export function NumberField<T extends FieldValues>(
  props: InputFieldProps<'number', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <input
          type='number'
          className='mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          min={
            typeof props.formInput.options?.min === 'number'
              ? props.formInput.options.min
              : typeof props.formInput.options?.min === 'string'
              ? parseInt(props.formInput.options?.min)
              : props.formInput.options?.min?.value !== undefined
              ? props.formInput.options?.min?.value
              : undefined
          }
          max={
            typeof props.formInput.options?.max === 'number'
              ? props.formInput.options.max
              : typeof props.formInput.options?.max === 'string'
              ? parseInt(props.formInput.options?.max)
              : props.formInput.options?.max?.value !== undefined
              ? props.formInput.options?.max?.value
              : undefined
          }
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, {
            valueAsNumber: true,
            ...props.formInput.options,
          })}
        />
      </BaseLabel>
    </div>
  )
}

export function validateImageFile(files: FileList) {
  if (files.length === 0 || files.length > 1) return undefined
  if (settings.RESOURCE_IMAGE_TYPES.includes(files[0].type)) {
    return files[0]
  }
  return undefined
}
export function ImageField<T extends FieldValues>(
  props: InputFieldProps<'image', T> & {
    setValue: UseFormSetValue<T>
  },
) {
  const [imagePath, setImagePath] = useState<string | undefined>(undefined)
  const [dragState, setDragState] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const getImageMutation = trpc.image.get.useMutation()
  const createImageMutation = trpc.image.create.useMutation()
  const addNotification = useStore((state) => state.addNotification)

  // Get default image path
  useEffect(() => {
    const checkImage = async (id: string) => {
      const result = await getImageMutation.mutateAsync({ id })
      if (result.isFound) {
        setImagePath(result.image!.path)
      }
    }
    if (props.formInput.defaultValue) {
      checkImage(props.formInput.defaultValue)
    }
  }, [props.formInput.defaultValue])

  // Upload image
  const uploadImageFile = useCallback(
    async (imageFile: File) => {
      const CryptoJS = await import('crypto-js')
      const dataString = await imageFile.text()
      const imageId = CryptoJS.SHA256(dataString).toString()
      const filename = imageId + '.' + imageFile.type.split('/')[1]
      const checkImageResult = await getImageMutation.mutateAsync({
        id: imageId,
      })

      if (checkImageResult.isFound) {
        // Exists
        setImagePath(checkImageResult.image!.path)
        props.setValue(
          props.formInput.name,
          imageId as Parameters<typeof props.setValue>[1],
        )
      } else {
        // Upload
        setIsUploading(true)
        const isSuccess = await uploadImage({
          apiKey: checkImageResult.apiKey!,
          url: `${checkImageResult.url!}/${settings.RESOURCE_UPLOAD_PATH}`,
          filename: filename,
          file: imageFile,
        })
        if (isSuccess) {
          const createImageResult = await createImageMutation.mutateAsync({
            id: imageId,
            path: `${settings.RESOURCE_UPLOAD_PATH}/${filename}`,
          })
          setImagePath(createImageResult.path)
          props.setValue(
            props.formInput.name,
            imageId as Parameters<typeof props.setValue>[1],
          )
        } else {
          addNotification({
            type: NotificationType.ERROR,
            message: '上傳失敗',
          })
        }
        setIsUploading(false)
      }
    },
    [props],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      setDragState(false)
      const file = validateImageFile(e.dataTransfer.files)
      if (file) {
        uploadImageFile(file)
      }
    },
    [uploadImageFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const file = validateImageFile(e.target.files)
        if (file) {
          uploadImageFile(file)
        }
      }
    },
    [uploadImageFile],
  )

  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <div className='relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border border-stone-300 bg-stone-50'>
          {imagePath && !isUploading && (
            <Image
              alt='商品預覽圖片'
              src={imagePath}
              className='object-cover'
              sizes='240px'
            />
          )}
          {isUploading ? (
            <div className='flex flex-col items-center gap-2'>
              <Spinner className='h-12 w-12' />
              <span>上傳中...</span>
            </div>
          ) : (
            <label
              className={twMerge(
                'absolute inset-0 flex cursor-pointer flex-col justify-center p-4 text-center text-sm',
                !imagePath && 'hover:bg-stone-100',
                imagePath &&
                  'bg-white/80 opacity-0 transition-opacity hover:opacity-100',
                dragState && 'opacity-100',
              )}
              onDragEnter={() => setDragState(true)}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragState(false)}
              onDrop={handleDrop}
            >
              {imagePath ? (
                <p className='pointer-events-none text-xl font-bold'>
                  更改圖片
                </p>
              ) : (
                <PhotoIcon className='pointer-events-none mx-auto h-10 w-10 text-stone-300' />
              )}
              <div className='pointer-events-none mt-2'>
                {dragState ? (
                  <span>拖曳至此處</span>
                ) : (
                  <>
                    <span className='text-yellow-500'>上傳檔案</span>
                    <span>或拖曳至此處</span>
                  </>
                )}
                <input
                  type='file'
                  accept={settings.RESOURCE_IMAGE_TYPES.join(',')}
                  className='sr-only'
                  onChange={handleFileChange}
                />
              </div>
            </label>
          )}
        </div>
      </BaseLabel>
      <input
        type='text'
        className='sr-only'
        {...props.register(props.formInput.name, props.formInput.options)}
      />
    </div>
  )
}
