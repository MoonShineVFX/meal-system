import { useCallback, useState, useEffect } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { useFormDialog } from '@/components/core/FormDialog'
import SortableList from '@/components/core/SortableList'
import trpc, { OptionSetsTemplateDatas } from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import { OptionSet } from '@/lib/common'

export default function OptionSets() {
  const { data, isError, error, isLoading } = trpc.optionSet.get.useQuery()
  const [selectedTemplate, setSelectedTemplate] = useState<
    OptionSetsTemplateDatas[number] | undefined
  >(undefined)
  const [selectedOptionSet, setSelectedOptionSet] = useState<
    OptionSet | undefined
  >(undefined)
  const { showFormDialog, formDialog } = useFormDialog()

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
  // Create template
  const handleTemplateCreate = useCallback(() => {
    if (!data) return
    showFormDialog({
      title: `新增選項集樣本`,
      inputs: {
        templateName: {
          label: '樣本名稱',
          type: 'text',
          options: { required: '請輸入樣本名稱' },
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
    if (!data || !selectedTemplate) return
    showFormDialog({
      title: `新增${selectedTemplate.name}的選項集`,
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
  }, [data, selectedTemplate])

  // Create option
  const handleOptionCreate = useCallback(() => {
    if (!data || !selectedTemplate) return
    showFormDialog({
      title: `新增${selectedTemplate.name}的選項集`,
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
  }, [data, selectedTemplate])

  // Filter
  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='grid h-full grid-cols-3 gap-x-8 p-8'>
      {/* Root */}
      <SortableList
        header='選項集樣本'
        items={data}
        onCreate={handleTemplateCreate}
        onCreateLabel='新增選項集樣本'
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
          header={selectedTemplate.name + ' 選項集'}
          items={selectedTemplate.optionSets.map((optionSet) => ({
            id: optionSet.name,
            ...optionSet,
          }))}
          onCreate={handleOptionSetCreate}
          onCreateLabel='新增選項集'
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
      {formDialog}
      {/* Options */}
      {selectedOptionSet && (
        <SortableList
          header={selectedOptionSet.name + ' 選項'}
          items={selectedOptionSet.options.map((option) => ({
            id: option,
          }))}
          onCreate={handleOptionCreate}
          onCreateLabel='新增選項'
        ></SortableList>
      )}
    </div>
  )
}
