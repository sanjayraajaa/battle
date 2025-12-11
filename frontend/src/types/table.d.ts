import { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        onEdit?: (data: TData) => void
    }
}
