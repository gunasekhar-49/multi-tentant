import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { workflowEngine, WorkflowRule, WorkflowExecution } from '../services/workflow';

const Container = styled.div`
  padding: 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #1f2937;
  margin: 0;
  font-weight: 700;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div<{ color?: string }>`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid ${props => props.color || '#667eea'};

  h3 {
    margin: 0 0 8px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .label {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 25px;
  margin-bottom: 25px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 20px 0;
  font-weight: 600;
`;

const RuleCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }
`;

const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const RuleName = styled.h4`
  margin: 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
`;

const RuleDescription = styled.p`
  margin: 0 0 15px 0;
  color: #6b7280;
  font-size: 14px;
`;

const RuleDetails = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 13px;
`;

const DetailBadge = styled.span<{ type?: 'trigger' | 'action' | 'status' }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
  
  background: ${props => {
    switch(props.type) {
      case 'trigger': return '#dbeafe';
      case 'action': return '#d1fae5';
      case 'status': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => {
    switch(props.type) {
      case 'trigger': return '#1e40af';
      case 'action': return '#065f46';
      case 'status': return '#92400e';
      default: return '#374151';
    }
  }};
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #10b981;
  }
  
  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const ExecutionTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px;
    background: #f9fafb;
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
  }
  
  td {
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 14px;
    color: #1f2937;
  }
  
  tr:hover {
    background: #f9fafb;
  }
`;

const StatusBadge = styled.span<{ status: 'success' | 'failed' | 'skipped' }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  
  ${props => {
    switch(props.status) {
      case 'success':
        return 'background: #d1fae5; color: #065f46;';
      case 'failed':
        return 'background: #fee2e2; color: #991b1b;';
      case 'skipped':
        return 'background: #f3f4f6; color: #6b7280;';
    }
  }}
`;

export const WorkflowManager: React.FC = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, skipped: 0, successRate: '0' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRules(workflowEngine.getAllRules());
    setExecutions(workflowEngine.getExecutionHistory(20));
    setStats(workflowEngine.getExecutionStats());
  };

  const toggleRule = (ruleId: string, enabled: boolean) => {
    if (enabled) {
      workflowEngine.disableRule(ruleId);
    } else {
      workflowEngine.enableRule(ruleId);
    }
    loadData();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container>
      <Header>
        <Title>⚡ Workflow Automation</Title>
      </Header>

      <StatsGrid>
        <StatCard color="#667eea">
          <h3>Total Executions</h3>
          <p className="value">{stats.total}</p>
          <div className="label">All time</div>
        </StatCard>
        <StatCard color="#10b981">
          <h3>Successful</h3>
          <p className="value">{stats.successful}</p>
          <div className="label">{stats.successRate}% success rate</div>
        </StatCard>
        <StatCard color="#ef4444">
          <h3>Failed</h3>
          <p className="value">{stats.failed}</p>
        </StatCard>
        <StatCard color="#6b7280">
          <h3>Active Rules</h3>
          <p className="value">{rules.filter(r => r.enabled).length}</p>
          <div className="label">of {rules.length} total</div>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionTitle>Automation Rules</SectionTitle>
        {rules.map(rule => (
          <RuleCard key={rule.id}>
            <RuleHeader>
              <div>
                <RuleName>{rule.name}</RuleName>
                <RuleDescription>{rule.description}</RuleDescription>
              </div>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id, rule.enabled)}
                />
                <span />
              </ToggleSwitch>
            </RuleHeader>
            <RuleDetails>
              <div>
                <strong>Trigger:</strong>{' '}
                <DetailBadge type="trigger">{rule.trigger.replace(/_/g, ' ')}</DetailBadge>
              </div>
              <div>
                <strong>Actions:</strong>{' '}
                {rule.actions.map((action, idx) => (
                  <DetailBadge key={idx} type="action" style={{ marginRight: '4px' }}>
                    {action.type.replace(/_/g, ' ')}
                  </DetailBadge>
                ))}
              </div>
              <div>
                <strong>Executed:</strong> {rule.executionCount} times
              </div>
              {rule.lastExecuted && (
                <div>
                  <strong>Last run:</strong> {formatDate(rule.lastExecuted)}
                </div>
              )}
            </RuleDetails>
          </RuleCard>
        ))}
      </Section>

      <Section>
        <SectionTitle>Recent Executions</SectionTitle>
        {executions.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            No executions yet. Workflows will appear here when triggered.
          </p>
        ) : (
          <ExecutionTable>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Record</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Duration</th>
                <th>Triggered</th>
              </tr>
            </thead>
            <tbody>
              {executions.map(exec => (
                <tr key={exec.id}>
                  <td>{exec.ruleName}</td>
                  <td>{exec.recordType} #{exec.recordId.slice(0, 8)}</td>
                  <td>
                    <StatusBadge status={exec.status}>{exec.status}</StatusBadge>
                  </td>
                  <td>{exec.actionsExecuted} actions</td>
                  <td>{exec.duration}ms</td>
                  <td>{formatDate(exec.triggeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </ExecutionTable>
        )}
      </Section>
    </Container>
  );
};
