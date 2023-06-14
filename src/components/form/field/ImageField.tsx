import { PhotoIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState, useCallback, useRef } from 'react'
import { FieldValues } from 'react-hook-form'
import ReactCrop, {
  PercentCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import EventEmitter from 'events'

import { uploadImage } from '@/lib/client/bunny'
import trpc from '@/lib/client/trpc'
import { useStore, NotificationType } from '@/lib/client/store'
import { settings } from '@/lib/common'
import Spinner from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import { InputFieldProps } from './define'
import { useDialog } from '@/components/core/Dialog'

function validateImageFile(files: FileList) {
  if (files.length === 0 || files.length > 1) return undefined
  if (settings.RESOURCE_IMAGE_TYPES.includes(files[0].type)) {
    return files[0]
  }
  return undefined
}

export default function ImageField<T extends FieldValues>(
  props: InputFieldProps<'image', T>,
) {
  const [imagePath, setImagePath] = useState<string | undefined>(undefined)
  const [dragState, setDragState] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const getImageMutation = trpc.image.get.useMutation()
  const createImageMutation = trpc.image.create.useMutation()
  const addNotification = useStore((state) => state.addNotification)
  const { showDialog, dialog } = useDialog()
  const inputFileRef = useRef<HTMLInputElement>(null)

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

  // Crop Image
  const cropImageFile = useCallback(
    async (imageFile: File) => {
      if (!inputFileRef.current) return

      const emitter = new EventEmitter()
      const resultCropMeta: { data: CropImageMeta | undefined } = {
        data: undefined,
      }

      showDialog({
        title: '編輯圖片',
        icon: null,
        panelProps: {
          className: 'max-w-3xl',
        },
        content: (
          <ImageCropEditor
            imageUrl={URL.createObjectURL(imageFile)}
            minLength={100}
            onChange={(cropMeta) => {
              if (cropMeta === null) {
                emitter.emit('disabled')
              } else {
                emitter.emit('null')
                resultCropMeta.data = cropMeta
              }
            }}
          />
        ),
        onConfirm: () => {
          if (resultCropMeta.data) {
            console.log('crop', resultCropMeta)
            setTimeout(() => {
              emitter.emit('complete')
            }, 2000)
          } else {
            console.log('no data')
          }
        },
        cancel: true,
        confirmText: '上傳',
        customTrigger: emitter,
        onCancel: () => {
          inputFileRef.current!.value = ''
        },
        onClose: () => {
          inputFileRef.current!.value = ''
        },
      })
    },
    [inputFileRef.current],
  )

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
        props.useFormReturns.setValue(
          props.formInput.name,
          imageId as Parameters<typeof props.useFormReturns.setValue>[1],
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
          props.useFormReturns.setValue(
            props.formInput.name,
            imageId as Parameters<typeof props.useFormReturns.setValue>[1],
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragState(false)
    const file = validateImageFile(e.dataTransfer.files)
    if (file) {
      cropImageFile(file)
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const file = validateImageFile(e.target.files)
        if (file) {
          cropImageFile(file)
        }
      }
    },
    [],
  )

  return (
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
            <p className='pointer-events-none text-xl font-bold'>更改圖片</p>
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
              ref={inputFileRef}
              type='file'
              accept={settings.RESOURCE_IMAGE_TYPES.join(',')}
              className='sr-only'
              onChange={handleFileChange}
            />
          </div>
        </label>
      )}
      {dialog}
    </div>
  )
}

function centerAspectCrop(width: number, height: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100,
      },
      aspect,
      width,
      height,
    ),
    width,
    height,
  )
}

type CropImageMeta = {
  width: number
  height: number
  crop: { width: number; height: number; x: number; y: number }
  image: HTMLImageElement
}

export function ImageCropEditor(props: {
  imageUrl: string
  minLength?: number
  onChange?: (cropMeta: CropImageMeta | null) => void
}) {
  const [crop, setCrop] = useState<PercentCrop | undefined>(undefined)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isInvalid, setIsInvalid] = useState(false)

  const onImageLoaded = useCallback((image: HTMLImageElement) => {
    setCrop(centerAspectCrop(image.width, image.height, 1))
  }, [])

  return (
    <ReactCrop
      aspect={1}
      crop={crop}
      onChange={(_, percentCrop) => {
        if (percentCrop.width === 0 && percentCrop.height === 0) {
          return
        }
        setCrop(percentCrop)

        if (!imageRef.current) return
        const w = imageRef.current!.width
        const h = imageRef.current!.height
        const cropWidth = Math.floor((w * percentCrop.width) / 100)
        const cropHeight = Math.floor((h * percentCrop.height) / 100)

        if (
          props.minLength &&
          Math.min(cropWidth, cropHeight) < props.minLength
        ) {
          props.onChange?.(null)
          setIsInvalid(true)
          return
        }

        props.onChange?.({
          width: w,
          height: h,
          crop: {
            width: cropWidth,
            height: cropHeight,
            x: Math.floor((w * percentCrop.x) / 100),
            y: Math.floor((h * percentCrop.y) / 100),
          },
          image: imageRef.current,
        })
        setIsInvalid(false)
      }}
    >
      {/* Circle */}
      {crop && (
        <div
          className={twMerge(
            'absolute flex items-center justify-center rounded-full border border-white/50',
            isInvalid && 'rounded-none border-none bg-red-600/80',
          )}
          style={{
            width: crop.width + '%',
            height: crop.height + '%',
            top: crop.y + '%',
            left: crop.x + '%',
          }}
        >
          {isInvalid && <p className='font-bold text-white'>尺寸過小</p>}
        </div>
      )}
      <img
        ref={imageRef}
        src={props.imageUrl}
        onLoad={(e) => onImageLoaded(e.currentTarget)}
        alt='預覽圖片'
      />
    </ReactCrop>
  )
}
