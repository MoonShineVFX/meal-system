import { PhotoIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldValues } from 'react-hook-form'
import ReactCrop, {
  PercentCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { twMerge } from 'tailwind-merge'

import { useDialog } from '@/components/core/Dialog'
import Image from '@/components/core/Image'
import Spinner from '@/components/core/Spinner'
import { upload } from '@/lib/client/r2'
import { NotificationType, useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'
import { settings } from '@/lib/common'
import { InputFieldProps } from './define'

const MAX_IMAGE_LENGTH = 1280
const MIN_IMAGE_LENGTH = 100

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setButtonState = useStore((state) => state.setDialogButtonState)
  const [cropMeta, setCropMeta] = useState<CropImageMeta | undefined>(undefined)
  const [cropResolve, setCropResolve] = useState<
    ((value: void | PromiseLike<void>) => void) | undefined
  >(undefined)

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

  // When image editor done
  useEffect(() => {
    if (!cropMeta || !cropResolve || !canvasRef.current) return

    const cropWidth = Math.min(cropMeta.crop.width, MAX_IMAGE_LENGTH)
    const cropHeight = Math.min(cropMeta.crop.height, MAX_IMAGE_LENGTH)

    // Crop image if edited
    if (
      cropWidth !== cropMeta.image.naturalWidth ||
      cropHeight !== cropMeta.image.naturalHeight
    ) {
      canvasRef.current.width = cropWidth
      canvasRef.current.height = cropHeight
      const ctx = canvasRef.current.getContext('2d')
      ctx?.drawImage(
        cropMeta.image,
        cropMeta.crop.x,
        cropMeta.crop.y,
        cropMeta.crop.width,
        cropMeta.crop.height,
        0,
        0,
        cropWidth,
        cropHeight,
      )
      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Invalid image blob')
            return
          }
          uploadImageFile({ blob })
        },
        'image/jpeg',
        0.9,
      )
    } else {
      // Direct upload if not edited
      const file = validateImageFile(inputFileRef.current!.files!)
      if (!file) {
        console.error('Invalid image file')
        return
      }

      // Upload if jpeg, otherwise convert to jpeg
      if (file.type === 'image/jpeg') {
        uploadImageFile({ file })
      } else {
        const img = document.createElement('img')
        img.src = URL.createObjectURL(file)
        img.onload = () => {
          canvasRef.current!.width = img.width
          canvasRef.current!.height = img.height
          const ctx = canvasRef.current!.getContext('2d')
          ctx?.drawImage(img, 0, 0)
          canvasRef.current!.toBlob(
            (blob) => {
              if (!blob) {
                console.error('Invalid image blob')
                return
              }
              uploadImageFile({ blob })
            },
            'image/jpeg',
            0.9,
          )
        }
      }
    }

    cropResolve()
    setCropResolve(undefined)
    setCropMeta(undefined)
  }, [cropMeta, cropResolve, canvasRef.current, inputFileRef.current])

  // Open crop image editor
  const cropImageFile = useCallback(
    async (imageFile: File) => {
      if (!inputFileRef.current) return

      showDialog({
        title: '編輯圖片',
        icon: null,
        panelProps: {
          className: 'max-w-3xl',
        },
        content: (
          <ImageCropEditor
            imageUrl={URL.createObjectURL(imageFile)}
            minLength={MIN_IMAGE_LENGTH}
            onChange={(cropMeta) => {
              if (cropMeta === null) {
                setButtonState('disabled')
              } else {
                setButtonState('null')
                setCropMeta(cropMeta)
              }
            }}
          />
        ),
        onConfirm: () => {
          return new Promise<void>((resolve) => {
            setCropResolve(() => {
              return resolve
            })
          })
        },
        cancel: true,
        confirmText: '上傳',
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
    async (inputData: { blob?: Blob; file?: File }) => {
      if (!canvasRef.current) return
      if (!inputData.blob && !inputData.file) return
      setIsUploading(true)

      const CryptoJS = await import('crypto-js')
      const dataString = await (inputData.blob ?? inputData.file)!.text()
      const hash = CryptoJS.SHA256(dataString).toString()
      const imageId = hash + '.jpg'
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
        setIsUploading(false)
      } else {
        // Upload
        const blob = inputData.blob ?? inputData.file!
        const { isSuccess, message } = await upload({
          type: blob.type,
          url: checkImageResult.signedUrl!,
          filename: imageId,
          blob: inputData.blob ?? inputData.file!,
        })
        if (isSuccess) {
          const createImageResult = await createImageMutation.mutateAsync({
            id: imageId,
          })
          setImagePath(createImageResult.path)
          props.useFormReturns.setValue(
            props.formInput.name,
            imageId as Parameters<typeof props.useFormReturns.setValue>[1],
          )
        } else {
          addNotification({
            type: NotificationType.ERROR,
            message: '上傳失敗: ' + message,
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
      <canvas ref={canvasRef} className='sr-only' />
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
    const centerCrop = centerAspectCrop(image.width, image.height, 1)
    setCrop(centerCrop)
    handleCropChange(centerCrop)
  }, [])

  const handleCropChange = useCallback(
    (newCrop: PercentCrop) => {
      if (!imageRef.current) return
      const w = imageRef.current!.naturalWidth
      const h = imageRef.current!.naturalHeight
      const cropWidth = Math.floor((w * newCrop.width) / 100)
      const cropHeight = Math.floor((h * newCrop.height) / 100)

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
          x: Math.floor((w * newCrop.x) / 100),
          y: Math.floor((h * newCrop.y) / 100),
        },
        image: imageRef.current,
      })
      setIsInvalid(false)
    },
    [imageRef.current],
  )

  return (
    <ReactCrop
      aspect={1}
      crop={crop}
      onChange={(_, percentCrop) => {
        if (percentCrop.width === 0 && percentCrop.height === 0) {
          return
        }
        setCrop(percentCrop)
        handleCropChange(percentCrop)
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
