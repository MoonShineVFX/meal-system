import { PhotoIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState, useCallback } from 'react'
import { FieldValues, UseFormSetValue } from 'react-hook-form'

import { uploadImage } from '@/lib/client/bunny'
import trpc from '@/lib/client/trpc'
import { useStore, NotificationType } from '@/lib/client/store'
import { settings } from '@/lib/common'
import Spinner from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import { BaseLabel, InputFieldProps } from './define'

function validateImageFile(files: FileList) {
  if (files.length === 0 || files.length > 1) return undefined
  if (settings.RESOURCE_IMAGE_TYPES.includes(files[0].type)) {
    return files[0]
  }
  return undefined
}
export default function ImageField<T extends FieldValues>(
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
          { shouldDirty: true },
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
