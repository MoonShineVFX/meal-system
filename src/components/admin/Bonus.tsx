import { useCallback, useMemo } from 'react'
import { InView } from 'react-intersection-observer'

import Button from '@/components/core/Button'
import { useDialog } from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import Spinner from '@/components/core/Spinner'
import Table from '@/components/core/Table'
import { useFormDialog } from '@/components/form/FormDialog'
import trpc, { BonusDatas } from '@/lib/client/trpc'
import {
  convertDateToInputDateValue,
  convertInputDateValueToDate,
} from '@/lib/common'

export default function Bonus() {
  // Trpc
  const { data, isError, error, fetchNextPage, hasNextPage } =
    trpc.bonus.getList.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  // State
  const { showFormDialog, formDialog } = useFormDialog()
  const { showDialog, dialog } = useDialog()

  const bonusDatas = useMemo(() => {
    return data?.pages.flatMap((page) => page.bonus) ?? []
  }, [data])

  const handleBonusCreateOrEdit = useCallback((bonus?: BonusDatas[number]) => {
    const isEdit = !!bonus

    const now = new Date()
    const notStartYet =
      bonus?.validAt && bonus.validAt.getTime() > now.getTime()
    const notRedeemYet = bonus?.users && bonus.redeemUsers.length === 0
    const notYet = notStartYet && notRedeemYet

    showFormDialog({
      title: isEdit ? '編輯獎勵' : '新增獎勵',
      inputs: {
        note: {
          label: '備註',
          type: 'text',
          defaultValue: isEdit ? bonus!.note ?? '' : '',
        },
        amount: {
          label: '點數',
          type: 'number',
          defaultValue: isEdit ? bonus!.amount : 1,
          hide: !notYet && isEdit,
        },
        validAt: {
          label: '發放日期 (不填則立即發放)',
          type: 'date',
          defaultValue: bonus?.validAt
            ? convertDateToInputDateValue(bonus.validAt)
            : undefined,
          hide: !notYet && isEdit,
        },
        userIds: {
          label: '贈送對象',
          type: 'users',
          data: {
            newDialog: true,
            onlyIncrease: true,
          },
          defaultValue: isEdit ? bonus!.users.map((u) => u.id) : [],
        },
      },
      useMutation: trpc.bonus.createOrEdit.useMutation,
      onSubmit(formData, mutation) {
        mutation.mutate({
          note: formData.note,
          amount: formData.amount,
          id: isEdit ? bonus!.id : undefined,
          validAt: formData.validAt
            ? convertInputDateValueToDate(formData.validAt) ?? undefined
            : undefined,
          userIds: formData.userIds,
        })
      },
    })
  }, [])

  const handleBonusDelete = useCallback((id: number) => {
    showDialog({
      title: '刪除獎勵',
      content: `確定要刪除獎勵編號 ${id} 嗎？`,
      useMutation: trpc.bonus.delete.useMutation,
      mutationOptions: {
        id: id,
      },
      cancel: true,
      confirmButtonTheme: 'danger',
    })
  }, [])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <Button
            label='新增獎勵'
            className='ml-auto py-3 px-4'
            textClassName='font-bold'
            onClick={() => handleBonusCreateOrEdit()}
          />
        </div>
        {/* Table */}
        <Table
          data={bonusDatas}
          columns={[
            {
              name: '編號',
              align: 'left',
              cellClassName: 'text-sm font-mono font-bold',
              render: (bonus) => bonus.id,
            },
            {
              name: '創建日期',
              align: 'left',
              cellClassName: 'text-sm',
              render: (bonus) => bonus.createdAt.toLocaleString(),
            },
            {
              name: '發送日期',
              align: 'left',
              cellClassName: 'text-sm',
              render: (bonus) => bonus.validAt?.toLocaleString() ?? '即時',
            },
            {
              name: '點數',
              align: 'right',
              render: (bonus) => bonus.amount,
            },
            {
              name: '備註',
              align: 'left',
              render: (bonus) => bonus.note ?? '-',
            },
            {
              name: '人數 (已領取)',
              align: 'left',
              render: (bonus) => (
                <>
                  {bonus.users.length} ({bonus.redeemUsers.length})
                </>
              ),
            },
            {
              name: '動作',
              render: (bonus) => (
                <div className='flex items-center gap-2'>
                  <Button
                    textClassName='px-3 py-1 text-sm'
                    className='disabled:opacity-50 hover:bg-stone-200'
                    label='編輯'
                    theme='secondary'
                    onClick={() => handleBonusCreateOrEdit(bonus)}
                  />
                  <Button
                    textClassName='px-3 py-1 text-sm text-red-400'
                    className='disabled:opacity-50 hover:bg-stone-200'
                    label='刪除'
                    theme='secondary'
                    onClick={() => handleBonusDelete(bonus.id)}
                  />
                </div>
              ),
            },
          ]}
          footer={
            hasNextPage ? (
              <InView
                as='td'
                onChange={(inView) => {
                  if (inView && hasNextPage) {
                    fetchNextPage()
                  }
                }}
                className='flex items-center gap-2 p-4'
              >
                <Spinner className='h-4 w-4' />
                <p className='tracking-wider text-stone-400'>讀取更多</p>
              </InView>
            ) : undefined
          }
        />
      </div>
      {formDialog}
      {dialog}
    </div>
  )
}
