import React, { useState } from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Thead = styled.thead`
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
`;

const Th = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1f2937;
`;

const Badge = styled.span<{ type?: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  
  background: ${props => {
    switch(props.type) {
      case 'success': return '#dcfce7';
      case 'warning': return '#fef08a';
      case 'danger': return '#fee2e2';
      case 'info': return '#dbeafe';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => {
    switch(props.type) {
      case 'success': return '#166534';
      case 'warning': return '#92400e';
      case 'danger': return '#991b1b';
      case 'info': return '#0c4a6e';
      default: return '#374151';
    }
  }};
`;

const ActionBtn = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &.edit {
    background: #dbeafe;
    color: #0c4a6e;
    
    &:hover {
      background: #bfdbfe;
    }
  }
  
  &.delete {
    background: #fee2e2;
    color: #991b1b;
    
    &:hover {
      background: #fecaca;
    }
  }
  
  &.view {
    background: #e0e7ff;
    color: #3730a3;
    
    &:hover {
      background: #c7d2fe;
    }
  }
`;

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataGridProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  actions?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onView,
  actions = true,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  let sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No data available</div>;
  }

  return (
    <Table>
      <Thead>
        <Tr>
          {columns.map(col => (
            <Th 
              key={col.key}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              {col.label}
              {col.sortable && sortKey === col.key && (
                <span style={{ marginLeft: '8px' }}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Th>
          ))}
          {actions && <Th>Actions</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {sortedData.map((row, idx) => (
          <Tr key={row.id || idx}>
            {columns.map(col => (
              <Td key={`${row.id}-${col.key}`}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </Td>
            ))}
            {actions && (
              <Td>
                {onView && <ActionBtn className="view" onClick={() => onView(row)}>View</ActionBtn>}
                {onEdit && <ActionBtn className="edit" onClick={() => onEdit(row)}>Edit</ActionBtn>}
                {onDelete && <ActionBtn className="delete" onClick={() => onDelete(row)}>Delete</ActionBtn>}
              </Td>
            )}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export { Badge };
