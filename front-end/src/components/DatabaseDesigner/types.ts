export interface DatabaseDesignerProps {
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
}

export interface Column {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTargetTableId?: string
  foreignKeyTargetColumnId?: string
}

export interface Table {
  id: string
  name: string
  comment: string
  x: number
  y: number
  columns: Column[]
}

export interface SavedSchema {
  id: string
  name: string
  savedAt: string
  tables: Table[]
  tableCount: number
}
