type TableData = {
  value: number | string | object
}

type TableDatas = Record<string, TableData>

type TableProps<TTableDatas extends TableDatas> = {
  [TName in keyof TTableDatas]: {
    [K in keyof TTableDatas[TName]]: TTableDatas[TName][K]
  } & {
    render?: (arg: TTableDatas[TName]['value']) => JSX.Element
  }
}

export default function Table<T extends TableDatas>(props: {
  data: TableProps<T>
}) {
  return <table></table>
}
