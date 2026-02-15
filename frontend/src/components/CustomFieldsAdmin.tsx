import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { customFieldsService, CustomField, FieldType, FieldResource } from '../services/customFields';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }

  p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`;

const Button = styled.button`
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
`;

const SecondaryButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;

  .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .value {
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 20px;
  background: none;
  border: none;
  color: ${props => props.active ? '#667eea' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  border-bottom: ${props => props.active ? '2px solid #667eea' : 'none'};
  margin-bottom: -2px;

  &:hover {
    color: #667eea;
  }
`;

const FieldsList = styled.div`
  display: grid;
  gap: 12px;
`;

const FieldCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const FieldInfo = styled.div`
  flex: 1;
`;

const FieldName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
`;

const FieldMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: #6b7280;
`;

const Badge = styled.span<{ type?: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #f0f9ff;
  color: #0369a1;
  margin-right: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  padding: 8px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  margin-bottom: 8px;
`;

export const CustomFieldsAdmin: React.FC = () => {
  const [selectedResource, setSelectedResource] = useState<FieldResource>('lead');
  const [fields, setFields] = useState<CustomField[]>([]);
  const [stats, setStats] = useState(customFieldsService.getStats());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newField, setNewField] = useState<Omit<CustomField, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>>({
    name: '',
    label: '',
    type: 'text',
    resource: 'lead',
    required: false,
    visible: true,
    searchable: false,
    order: 0,
  });

  useEffect(() => {
    setFields(customFieldsService.getFieldsByResource(selectedResource));
  }, [selectedResource]);

  const handleAddField = () => {
    try {
      customFieldsService.createField(newField, 'admin-user');
      setFields(customFieldsService.getFieldsByResource(selectedResource));
      setStats(customFieldsService.getStats());
      setIsModalOpen(false);
      setNewField({
        name: '',
        label: '',
        type: 'text',
        resource: 'lead',
        required: false,
        visible: true,
        searchable: false,
        order: 0,
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (window.confirm('Delete this field? Data will be preserved.')) {
      customFieldsService.deleteField(fieldId);
      setFields(customFieldsService.getFieldsByResource(selectedResource));
      setStats(customFieldsService.getStats());
    }
  };

  return (
    <Container>
      <Header>
        <h1>⚙️ Custom Fields Management</h1>
        <p>Create and manage custom fields for leads, contacts, and deals</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="label">Total Custom Fields</div>
          <div className="value">{stats.totalFields}</div>
        </StatCard>
        <StatCard>
          <div className="label">Lead Fields</div>
          <div className="value">{stats.byResource.lead}</div>
        </StatCard>
        <StatCard>
          <div className="label">Contact Fields</div>
          <div className="value">{stats.byResource.contact}</div>
        </StatCard>
        <StatCard>
          <div className="label">Deal Fields</div>
          <div className="value">{stats.byResource.deal}</div>
        </StatCard>
      </StatsGrid>

      <Toolbar>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Custom Field</Button>
      </Toolbar>

      <Tabs>
        <TabButton active={selectedResource === 'lead'} onClick={() => setSelectedResource('lead')}>
          Leads
        </TabButton>
        <TabButton active={selectedResource === 'contact'} onClick={() => setSelectedResource('contact')}>
          Contacts
        </TabButton>
        <TabButton active={selectedResource === 'deal'} onClick={() => setSelectedResource('deal')}>
          Deals
        </TabButton>
      </Tabs>

      <FieldsList>
        {fields.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
            No custom fields yet. Click "Add Custom Field" to create one.
          </p>
        ) : (
          fields.map(field => {
            const usage = customFieldsService.getFieldUsage(field.id);
            return (
              <FieldCard key={field.id}>
                <FieldInfo>
                  <FieldName>{field.label}</FieldName>
                  <FieldMeta>
                    <Badge type="type">{field.type}</Badge>
                    {field.required && <Badge type="required">Required</Badge>}
                    {field.searchable && <Badge type="search">Searchable</Badge>}
                    • {usage.recordsWithValue} of {usage.totalRecords} records filled
                  </FieldMeta>
                </FieldInfo>
                <Actions>
                  <IconButton onClick={() => handleDeleteField(field.id)}>🗑️</IconButton>
                </Actions>
              </FieldCard>
            );
          })
        )}
      </FieldsList>

      <Modal isOpen={isModalOpen}>
        <ModalContent>
          <h2 style={{ marginTop: 0 }}>Add Custom Field</h2>

          <FormGroup>
            <Label>Field Label</Label>
            <Input
              type="text"
              placeholder="e.g., Lead Source"
              value={newField.label}
              onChange={e => setNewField({ ...newField, label: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Field Type</Label>
            <Select
              value={newField.type}
              onChange={e => setNewField({ ...newField, type: e.target.value as FieldType })}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown</option>
              <option value="checkbox">Checkbox</option>
              <option value="textarea">Textarea</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={newField.required}
                onChange={e => setNewField({ ...newField, required: e.target.checked })}
              />
              Required Field
            </CheckboxLabel>
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={newField.searchable}
                onChange={e => setNewField({ ...newField, searchable: e.target.checked })}
              />
              Searchable
            </CheckboxLabel>
          </FormGroup>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={handleAddField} style={{ flex: 1 }}>
              Create Field
            </Button>
            <SecondaryButton onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </SecondaryButton>
          </div>
        </ModalContent>
      </Modal>
    </Container>
  );
};
