type TableData<T> = {
  name: string,
  value: T,
  render?: (value: T) => JSX.Element,
}

type TableDataItem = <R>(cb: <T>(tableData: TableData<T>) => R) => R
export const td = <T,>(arg: TableData<T>): TableDataItem => (cb) => cb(arg)

export default function Table(props: {
  data: TableDataItem[]
}) {
  const data = props.data.map((item) => item((tableData) => ({
    name: tableData.name,
    value: tableData.value,
    render: tableData.render ? tableData.render(tableData.value) : <span>{tableData.value as string}</span>,
  })))
  return <table></table>
}
