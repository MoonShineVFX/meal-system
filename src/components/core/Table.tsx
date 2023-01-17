type TableData = {
  name: string
  value: any
  render: (value: any) => JSX.Element
}

type GTableData<T> = T extends infer U
  ? {
      name: string
      value: U
      render: (value: Guess<U>) => JSX.Element
    }
  : never

type TableDataList<T extends Record<string, TableData>> = {
  [K in keyof T]: GTableData<T[K]['value']>
}

type Guess<T> = T extends string ? string : number

export default function Table<T extends Record<string, TableData>>(props: {
  data: TableDataList<T>
}) {
  console.log(props.data)
  return <table></table>
}
