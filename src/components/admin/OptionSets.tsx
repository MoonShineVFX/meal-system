import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'

import { useDialog } from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import SortableList from '@/components/core/SortableList'
import { SpinnerBlock } from '@/components/core/Spinner'
import { useFormDialog } from '@/components/form/FormDialog'
import trpc, { OptionSetsTemplateDatas } from '@/lib/client/trpc'
import { OptionSet, getOptionName } from '@/lib/common'

export default function OptionSets() {
  const { data, isError, error, isLoading } = trpc.optionSet.get.useQuery()
  const [selectedTemplate, setSelectedTemplate] = useState<
    OptionSetsTemplateDatas[number] | undefined
  >(undefined)
  const [selectedOptionSet, setSelectedOptionSet] = useState<
    OptionSet | undefined
  >(undefined)
  const { showFormDialog, formDialog } = useFormDialog()
  const { showDialog, dialog } = useDialog()
  const updateTemplateOrdersMutation = trpc.optionSet.updateOrders.useMutation()
  const updateOptionSetOrdersMutation = trpc.optionSet.update.useMutation()
  const updateOptionOrdersMutation = trpc.optionSet.update.useMutation()

  // Selected template on data change
  useEffect(() => {
    if (!data) return
    if (selectedTemplate) {
      const foundTemplate = data.find(
        (template) => template.id === selectedTemplate.id,
      )
      if (foundTemplate) {
        setSelectedTemplate(foundTemplate)
        return
      }
    }
    setSelectedTemplate(data[0])
  }, [data])

  // Selected option set on selected template change
  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedOptionSet(undefined)
      return
    }
    if (selectedOptionSet) {
      const foundOptionSet = selectedTemplate.optionSets.find(
        (optionSet) => optionSet.name === selectedOptionSet.name,
      )
      if (foundOptionSet) {
        setSelectedOptionSet(foundOptionSet)
        return
      }
    }
    setSelectedOptionSet(selectedTemplate.optionSets[0])
  }, [selectedTemplate])

  /* Handles */
  // Rename Template
  const handleTemplateRename = useCallback(
    (template: OptionSetsTemplateDatas[number]) => {
      if (!data) return
      showFormDialog({
        title: `重新命名 ${template.name}`,
        inputs: {
          templateName: {
            label: '樣本名稱',
            defaultValue: template.name,
            type: 'text',
            options: {
              required: '請輸入樣本名稱',
              validate: (value: string) => {
                return (
                  !data
                    .filter((d) => d.id !== template.id)
                    .map((d) => d.name)
                    .includes(value) || '名稱重複'
                )
              },
            },
            attributes: { placeholder: template.name },
          },
        },
        useMutation: trpc.optionSet.update.useMutation,
        onSubmit(formData, mutation) {
          mutation.mutate({
            id: template.id,
            name: formData.templateName,
          })
        },
      })
    },
    [data],
  )

  // Rename OptionSet
  const handleOptionSetRename = useCallback(
    (optionSet: OptionSet) => {
      if (!selectedTemplate) return
      showFormDialog({
        title: `重新命名 ${optionSet.name}`,
        inputs: {
          optionSetName: {
            label: '選項集名稱',
            defaultValue: optionSet.name,
            type: 'text',
            options: {
              required: '請輸入選項集名稱',
              validate: (value) => {
                return (
                  !selectedTemplate.optionSets
                    .filter((o) => o.name !== optionSet.name)
                    .map((o) => o.name)
                    .includes(value) || '名稱重複'
                )
              },
            },
            attributes: { placeholder: optionSet.name },
          },
          multiSelect: {
            label: '多選',
            type: 'checkbox',
            defaultValue: optionSet.multiSelect,
          },
        },
        useMutation: trpc.optionSet.update.useMutation,
        onSubmit(formData, mutation) {
          const newOptionSets = selectedTemplate.optionSets.map((o) => {
            if (o.name === optionSet.name) {
              return {
                ...o,
                name: formData.optionSetName,
                multiSelect: formData.multiSelect,
              }
            }
            return o
          })
          mutation.mutate({
            id: selectedTemplate.id,
            optionSets: newOptionSets,
          })
        },
      })
    },
    [selectedTemplate],
  )

  // Rename Option
  const handleOptionRename = useCallback(
    (option: { id: string; price: number }) => {
      if (!selectedTemplate || !selectedOptionSet) return
      showFormDialog({
        title: `編輯 ${option.id}`,
        inputs: {
          optionName: {
            label: '選項名稱',
            defaultValue: option.id,
            type: 'text',
            options: {
              required: '請輸入選項名稱',
              validate: (value) => {
                return (
                  !selectedOptionSet.options
                    .filter((o) => o !== option.id)
                    .includes(value) || '名稱重複'
                )
              },
            },
            attributes: { placeholder: option.id },
          },
          optionPrice: {
            label: '選項價格',
            type: 'number',
            defaultValue: option.price,
          },
        },
        useMutation: trpc.optionSet.update.useMutation,
        onSubmit(formData, mutation) {
          const newOptionSets = selectedTemplate.optionSets.map((o) => {
            if (o.name === selectedOptionSet.name) {
              return {
                ...o,
                options: o.options.map((op) =>
                  getOptionName(op) === option.id
                    ? {
                        name: formData.optionName,
                        price: formData.optionPrice ?? 0,
                      }
                    : op,
                ),
              }
            }
            return o
          })
          mutation.mutate({
            id: selectedTemplate.id,
            optionSets: newOptionSets,
          })
        },
      })
    },
    [selectedTemplate, selectedOptionSet],
  )

  // Create template
  const handleTemplateCreate = useCallback(() => {
    if (!data) return
    showFormDialog({
      title: `新增選項集樣本`,
      inputs: {
        templateName: {
          label: '樣本名稱',
          type: 'text',
          options: {
            required: '請輸入樣本名稱',
            validate: (value: string) => {
              return !data.map((d) => d.name).includes(value) || '名稱重複'
            },
          },
        },
      },
      useMutation: trpc.optionSet.create.useMutation,
      onSubmit(formData, mutation) {
        mutation.mutate({
          name: formData.templateName,
          order: data.length,
        })
      },
    })
  }, [data])

  // Create option set
  const handleOptionSetCreate = useCallback(() => {
    if (!selectedTemplate) return
    showFormDialog({
      title: `新增 ${selectedTemplate.name} 的選項集`,
      inputs: {
        optionSetName: {
          label: '選項集名稱',
          type: 'text',
          options: {
            required: '請輸入選項集名稱',
            validate: (value: string) => {
              return (
                !selectedTemplate.optionSets
                  .map((o) => o.name)
                  .includes(value) || '名稱重複'
              )
            },
          },
        },
        multiSelect: {
          label: '多選',
          type: 'checkbox',
        },
      },
      useMutation: trpc.optionSet.update.useMutation,
      onSubmit(formData, mutation) {
        const newOptionSets = [
          ...selectedTemplate.optionSets,
          {
            name: formData.optionSetName,
            multiSelect: formData.multiSelect,
            order: selectedTemplate.optionSets.length,
            options: [],
          },
        ]
        mutation.mutate({
          id: selectedTemplate.id,
          optionSets: newOptionSets,
        })
      },
    })
  }, [selectedTemplate])

  // Create option
  const handleOptionCreate = useCallback(() => {
    if (!selectedOptionSet || !selectedTemplate) return
    showFormDialog({
      title: `新增 ${selectedOptionSet.name} 的選項`,
      inputs: {
        optionName: {
          label: '選項名稱',
          type: 'text',
          options: {
            required: '請輸入選項名稱',
            validate: (value: string) => {
              return !selectedOptionSet.options.includes(value) || '名稱重複'
            },
          },
        },
        optionPrice: {
          label: '選項價格',
          type: 'number',
          attributes: {
            defaultValue: 0,
          },
        },
      },
      useMutation: trpc.optionSet.update.useMutation,
      onSubmit(formData, mutation) {
        const newOptionSets = selectedTemplate.optionSets.map((optionSet) => {
          if (optionSet.name === selectedOptionSet.name) {
            return {
              ...optionSet,
              options: [
                ...optionSet.options,
                {
                  name: formData.optionName,
                  price: formData.optionPrice ?? 0,
                },
              ],
            }
          }
          return optionSet
        })
        mutation.mutate({
          id: selectedTemplate.id,
          optionSets: newOptionSets,
        })
      },
    })
  }, [selectedTemplate, selectedOptionSet])

  // reorder templates
  const handleTemplateReorder = useCallback(
    (reorderedTemplates: OptionSetsTemplateDatas) => {
      updateTemplateOrdersMutation.mutate({
        ids: reorderedTemplates.map((t) => t.id),
      })
    },
    [],
  )

  // reorder option sets
  const handleOptionSetReorder = useCallback(
    (reorderedOptionSets: OptionSet[]) => {
      if (!selectedTemplate) return
      updateOptionSetOrdersMutation.mutate({
        id: selectedTemplate.id,
        optionSets: reorderedOptionSets,
      })
    },
    [selectedTemplate],
  )

  // reorder option
  const handleOptionReorder = useCallback(
    (reorderedOptions: { id: string }[]) => {
      if (!selectedTemplate || !selectedOptionSet) return
      updateOptionOrdersMutation.mutate({
        id: selectedTemplate.id,
        optionSets: selectedTemplate.optionSets.map((o) => {
          if (o.name === selectedOptionSet.name) {
            return {
              ...o,
              options: reorderedOptions.map((op) => op.id),
            }
          }
          return o
        }),
      })
    },
    [selectedTemplate, selectedOptionSet],
  )

  // Delete template
  const handleTemplateDelete = useCallback((selectedIds: number[]) => {
    showDialog({
      title: `刪除選項集樣本`,
      content: `確定要刪除 ${selectedIds.length} 個選項集樣本嗎？`,
      useMutation: trpc.optionSet.deleteMany.useMutation,
      mutationOptions: {
        ids: selectedIds,
      },
      cancel: true,
      confirmButtonTheme: 'danger',
    })
  }, [])

  // Delete option set
  const handleOptionSetDelete = useCallback(
    (selectedIds: string[]) => {
      if (!selectedTemplate) return
      const newOptionSets = selectedTemplate.optionSets.filter(
        (o) => !selectedIds.includes(o.name),
      )
      showDialog({
        title: `刪除選項集`,
        content: `確定要刪除 ${selectedIds.length} 個選項集嗎？`,
        useMutation: trpc.optionSet.update.useMutation,
        mutationOptions: {
          id: selectedTemplate.id,
          optionSets: newOptionSets,
        },
        cancel: true,
        confirmButtonTheme: 'danger',
      })
    },
    [selectedTemplate],
  )

  // Delete option
  const handleOptionDelete = useCallback(
    (selectedIds: string[]) => {
      if (!selectedTemplate || !selectedOptionSet) return
      const newOptionSets = selectedTemplate.optionSets.map((o) => {
        if (o.name === selectedOptionSet.name) {
          return {
            ...o,
            options: o.options.filter((op) => {
              const name = getOptionName(op)
              !selectedIds.includes(name)
            }),
          }
        }
        return o
      })
      showDialog({
        title: `刪除選項`,
        content: `確定要刪除 ${selectedIds.length} 個選項嗎？`,
        useMutation: trpc.optionSet.update.useMutation,
        mutationOptions: {
          id: selectedTemplate.id,
          optionSets: newOptionSets,
        },
        cancel: true,
        confirmButtonTheme: 'danger',
      })
    },
    [selectedTemplate, selectedOptionSet],
  )

  // Filter
  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='grid h-full grid-cols-3 gap-x-8 p-8'>
      {/* Root */}
      <SortableList
        header='選項集樣本'
        items={data ?? []}
        childrenClassName={(template) =>
          selectedTemplate?.id === template.id ? 'bg-stone-100' : ''
        }
        onCreate={handleTemplateCreate}
        onCreateLabel='新增選項集樣本'
        onRename={handleTemplateRename}
        onReorder={handleTemplateReorder}
        onReordering={updateTemplateOrdersMutation.isPending}
        batchEditButtons={[
          {
            label: '刪除',
            onClick: (ids) => handleTemplateDelete(ids),
            isDanger: true,
          },
        ]}
      >
        {(template) => (
          <button
            disabled={selectedTemplate?.id === template.id}
            className='group/button ml-auto rounded-2xl p-2 text-sm text-stone-400 transition-opacity disabled:opacity-0 hover:bg-stone-100 active:scale-95'
            onClick={() => setSelectedTemplate(template)}
          >
            {template.optionSets.length} 個選項集
            <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
          </button>
        )}
      </SortableList>
      {/* Option sets */}
      {selectedTemplate && (
        <SortableList
          key={'sets_' + selectedTemplate.id}
          header={selectedTemplate.name + ' 選項集'}
          items={selectedTemplate.optionSets.map((optionSet) => ({
            id: optionSet.name,
            ...optionSet,
          }))}
          childrenClassName={(optionSet) =>
            optionSet.name === selectedOptionSet?.name ? 'bg-stone-100' : ''
          }
          onCreate={handleOptionSetCreate}
          onCreateLabel='新增選項集'
          onRename={handleOptionSetRename}
          onReorder={handleOptionSetReorder}
          onReordering={updateOptionSetOrdersMutation.isPending}
          batchEditButtons={[
            {
              label: '刪除',
              onClick: (ids) => handleOptionSetDelete(ids),
              isDanger: true,
            },
          ]}
        >
          {(optionSet) => (
            <button
              disabled={selectedOptionSet?.name === optionSet.name}
              className='group/button ml-auto rounded-2xl p-2 text-sm text-stone-400 transition-opacity disabled:opacity-0 hover:bg-stone-100 active:scale-95'
              onClick={() => setSelectedOptionSet(optionSet)}
            >
              {optionSet.options.length} 個選項
              <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
            </button>
          )}
        </SortableList>
      )}
      {/* Options */}
      {selectedOptionSet && (
        <SortableList
          key={'options_' + selectedOptionSet.name}
          header={`${selectedOptionSet.name} [${
            selectedOptionSet.multiSelect ? '多選' : '單選'
          }]`}
          items={selectedOptionSet.options.map((option) => ({
            id: getOptionName(option),
            price: typeof option === 'string' ? 0 : option.price,
          }))}
          onCreate={handleOptionCreate}
          onCreateLabel='新增選項'
          onRename={handleOptionRename}
          onReorder={handleOptionReorder}
          onReordering={updateOptionOrdersMutation.isPending}
          batchEditButtons={[
            {
              label: '刪除',
              onClick: (ids) => handleOptionDelete(ids),
              isDanger: true,
            },
          ]}
        >
          {(option) => {
            if (option.price === 0) return <></>
            return <span className='pl-2'>${option.price}</span>
          }}
        </SortableList>
      )}
      {formDialog}
      {dialog}
    </div>
  )
}
