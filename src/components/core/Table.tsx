type TableData<T> = {
  name: string,
  value: T,
  render?: (value: T) => JSX.Element,
}

type TableDataCallback = <R>(unpack: <T>(tableData: TableData<T>) => R) => R

export function td<T>(tableData: TableData<T>): TableDataCallback {
  return function<R>(unpack: <T>(tableData: TableData<T>) => R) {
    return unpack(tableData)
  }
}

export default function Table(props: {
  data: TableDataCallback[]
}) {
  props.data.map((unpack) => unpack((tableData) => ({
    name: tableData.name,
    value: tableData.value,
    render: tableData.render ? tableData.render(tableData.value) : <span>{tableData.value as string}</span>,
  })))
  return <table></table>
}
