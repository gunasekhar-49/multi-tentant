import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationShell } from './components/notifications/NotificationShell';
import { DataGrid, Badge } from './components/DataGrid';
import { useToast, useAlert } from './hooks/useNotifications';
import { apiClient, Lead, Contact } from './services/api';
import { WorkflowManager } from './components/WorkflowManager';
import { workflowEngine } from './services/workflow';
import { PermissionsManager } from './components/PermissionsManager';

// Layout Styles
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h1`
  font-size: 28px;
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
  
  svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
`;

const NavBar = styled.nav`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const NavBtn = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: white;
  border: 2px solid ${props => props.active ? 'rgba(255, 255, 255, 0.5)' : 'transparent'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const StatusBadge = styled.div<{ online?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 12px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.online ? '#10b981' : '#ef4444'};
    animation: ${props => props.online ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 20px 0;
  font-weight: 700;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .value {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
  
  .change {
    font-size: 12px;
    color: #10b981;
    margin-top: 8px;
  }
`;

const ControlBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  
  background: ${props => props.variant === 'primary' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb'};
  color: ${props => props.variant === 'primary' ? 'white' : '#1f2937'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
  
  svg {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 16px;
  }
`;

type Tab = 'dashboard' | 'leads' | 'contacts' | 'workflows' | 'permissions';

const AppContent: React.FC = () => {
  const toast = useToast();
  const alert = useAlert();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      const online = await apiClient.healthCheck();
      setIsOnline(online);
      
      if (!online) {
        alert.trialEnding(7);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [alert]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getLeads();
      if (response.success && response.data) {
        setLeads(response.data);
        toast.success(`Loaded ${response.data.length} leads`, 'Success');
        
        // Trigger workflow for each new lead (simulate)
        if (response.data.length > leads.length) {
          const newLeads = response.data.slice(leads.length);
          for (const lead of newLeads) {
            await workflowEngine.executeTrigger('lead_created', {
              recordId: lead.id,
              recordType: 'lead',
              data: lead,
              userId: 'current-user'
            });
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load leads');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load leads', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getContacts();
      if (response.success && response.data) {
        setContacts(response.data);
        toast.success(`Loaded ${response.data.length} contacts`, 'Success');
      } else {
        throw new Error(response.message || 'Failed to load contacts');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load contacts', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leads' && leads.length === 0) {
      fetchLeads();
    } else if (activeTab === 'contacts' && contacts.length === 0) {
      fetchContacts();
    }
  }, [activeTab]);

  const handleDeleteLead = async (lead: Lead) => {
    if (window.confirm(`Delete "${lead.name}"?`)) {
      const response = await apiClient.deleteLead(lead.id);
      if (response.success) {
        setLeads(leads.filter(l => l.id !== lead.id));
        toast.success(`${lead.name} has been deleted`, 'Deleted');
      } else {
        toast.error(response.message || 'Failed to delete lead', 'Error');
      }
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leadsColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status: string) => <Badge type={status === 'won' ? 'success' : status === 'lost' ? 'danger' : 'info'}>{status}</Badge>,
    },
    {
      key: 'value',
      label: 'Value',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
  ];

  const contactsColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
  ];

  return (
    <AppContainer>
      <Header>
        <HeaderTitle>
          💼 CRM Dashboard
        </HeaderTitle>
        <NavBar>
          <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</NavBtn>
          <NavBtn active={activeTab === 'leads'} onClick={() => setActiveTab('leads')}>Leads</NavBtn>
          <NavBtn active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')}>Contacts</NavBtn>
          <NavBtn active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')}>⚡ Workflows</NavBtn>
          <NavBtn active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')}>🔒 Permissions</NavBtn>
          <StatusBadge online={isOnline}>
            {isOnline ? 'Online' : 'Offline'}
          </StatusBadge>
        </NavBar>
      </Header>

      <MainContent>
        {activeTab === 'dashboard' && (
          <>
            <SectionTitle>Dashboard Overview</SectionTitle>
            <StatsGrid>
              <StatCard>
                <h3>Total Leads</h3>
                <p className="value">{leads.length}</p>
                <div className="change">↑ 12% this month</div>
              </StatCard>
              <StatCard>
                <h3>Total Contacts</h3>
                <p className="value">{contacts.length}</p>
                <div className="change">↑ 8% this month</div>
              </StatCard>
              <StatCard style={{ borderLeftColor: '#10b981' }}>
                <h3>Won Deals</h3>
                <p className="value">{leads.filter(l => l.status === 'won').length}</p>
                <div className="change">↑ 5% this week</div>
              </StatCard>
              <StatCard style={{ borderLeftColor: '#ef4444' }}>
                <h3>Lost Deals</h3>
                <p className="value">{leads.filter(l => l.status === 'lost').length}</p>
                <div className="change">↓ 2% this week</div>
              </StatCard>
            </StatsGrid>

            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <Button variant="primary" onClick={() => { setActiveTab('leads'); fetchLeads(); }}>
                Load All Leads
              </Button>
              <Button variant="primary" onClick={() => { setActiveTab('contacts'); fetchContacts(); }}>
                Load All Contacts
              </Button>
              <Button onClick={() => toast.success('Create new lead form coming soon!', 'Feature')}>
                New Lead
              </Button>
              <Button onClick={() => toast.info('Export feature coming soon!', 'Feature')}>
                Export Data
              </Button>
            </div>
          </>
        )}

        {activeTab === 'leads' && (
          <>
            <SectionTitle>Leads Management</SectionTitle>
            <ControlBar>
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary" onClick={fetchLeads}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="primary" onClick={() => toast.info('Add lead form coming soon!', 'Feature')}>
                + New Lead
              </Button>
            </ControlBar>
            <TableContainer>
              {filteredLeads.length > 0 ? (
                <DataGrid
                  columns={leadsColumns}
                  data={filteredLeads}
                  loading={loading}
                  onDelete={handleDeleteLead}
                  onEdit={(lead) => toast.info(`Editing ${lead.name}`, 'Edit')}
                />
              ) : (
                <EmptyState>
                  <div>📭</div>
                  <p>No leads found</p>
                </EmptyState>
              )}
            </TableContainer>
          </>
        )}

        {activeTab === 'contacts' && (
          <>
            <SectionTitle>Contacts Management</SectionTitle>
            <ControlBar>
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary" onClick={fetchContacts}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="primary" onClick={() => toast.info('Add contact form coming soon!', 'Feature')}>
                + New Contact
              </Button>
            </ControlBar>
            <TableContainer>
              {filteredContacts.length > 0 ? (
                <DataGrid
                  columns={contactsColumns}
                  data={filteredContacts}
                  loading={loading}
                />
              ) : (
                <EmptyState>
                  <div>📭</div>
                  <p>No contacts found</p>
                </EmptyState>
              )}
            </TableContainer>
          </>
        )}

        {activeTab === 'workflows' && <WorkflowManager />}
        {activeTab === 'permissions' && <PermissionsManager />}
      </MainContent>

      <NotificationShell />
    </AppContainer>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
