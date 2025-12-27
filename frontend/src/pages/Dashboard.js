import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [equipment, setEquipment] = useState([]);
    const [activeRequests, setActiveRequests] = useState([]);
    const [scheduledRequests, setScheduledRequests] = useState([]);
    const [stats, setStats] = useState({ critical_equipment: 0, open_requests: 0, overdue_requests: 0, utilization_rate: 0, technician_count: 0 });
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        switch (status) {
            case 'In Progress': return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-normal" style={{backgroundColor: '#fef3c7'}}>In Progress</Badge>;
            case 'New': return <Badge bg="info" text="dark" className="px-3 py-2 rounded-pill fw-normal" style={{backgroundColor: '#e0f2fe'}}>New</Badge>;
            case 'Repaired': return <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal">Repaired</Badge>;
            case 'Scrap': return <Badge bg="danger" className="px-3 py-2 rounded-pill fw-normal">Scrapped</Badge>;
            case 'Pending Parts': return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal">Pending Parts</Badge>;
            default: return <Badge bg="light" text="dark" className="border"> {status}</Badge>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const KPICard = ({ title, value, subtitle, borderColor, bgColor, textColor, link }) => (
        <Col md={4} className="mb-4">
            <Link to={link} className="text-decoration-none">
                <div 
                    className="p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center" 
                    style={{ 
                        border: `2px solid ${borderColor}`, 
                        backgroundColor: bgColor, 
                        borderRadius: '20px',
                        color: textColor,
                        minHeight: '160px',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <h5 className="mb-3" style={{ color: textColor }}>{title}</h5>
                    <h3 className="fw-bold mb-1" style={{ color: textColor }}>{value}</h3>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{subtitle}</div>
                </div>
            </Link>
        </Col>
    );

    const isEmployee = user?.role === 'Employee';
    const isTechnician = user?.role === 'Technician';

    const fetchData = async () => {
        try {
            // Fetch Stats
            const statsRes = await api.get('/dashboard/stats');
            setStats(statsRes.data);

            // Fetch All Requests to filter and count
            const reqRes = await api.get('/requests');
            const allRequests = reqRes.data;

            // Fetch Equipment
            const eqRes = await api.get('/equipment');
            // Attach open request count to each equipment item
            const equipmentWithCounts = eqRes.data.map(eq => {
                const count = allRequests.filter(r => 
                    r.equipment_id === eq.id && (r.status === 'New' || r.status === 'In Progress')
                ).length;
                return { ...eq, open_request_count: count };
            });
            setEquipment(equipmentWithCounts.slice(0, 3)); 
            
            // Filter: Corrective Requests (Show all so progress is visible)
            const active = allRequests.filter(r => r.type === 'Corrective');
            setActiveRequests(active);

            // Filter: Preventive Requests (Show all so progress is visible)
            const scheduled = allRequests.filter(r => r.type === 'Preventive');
            setScheduledRequests(scheduled);

        } catch (error) {
            console.error("Error loading dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Container className="mt-5" style={{ maxWidth: '1400px' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <h3 className="fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>Dashboard</h3>
                <div className="d-flex gap-2">
                    <Button variant="primary" onClick={() => navigate('/requests/new')} className="shadow-sm px-4">
                        New Request
                    </Button>
                </div>
            </div>

            {/* KPI Cards Row (Hidden for Employees) */}
            {!isEmployee && (
                <Row className="mb-5 gx-4">
                    <KPICard 
                        title="Critical Equipment" 
                        value={`${stats.critical_equipment} Units`}
                        subtitle="(Scrapped / Unusable)"
                        borderColor="#fa5252" // Red
                        bgColor="#fff5f5"
                        textColor="#c92a2a"
                        link="/equipment"
                    />
                    <KPICard 
                        title="Technician Load" 
                        value={`${stats.utilization_rate ? stats.utilization_rate.toFixed(0) : 0}% Utilized`}
                        subtitle={`(${stats.technician_count || 0} Technicians Active)`}
                        borderColor="#714B67" // Purple
                        bgColor="#f3e8ff"
                        textColor="#5a3b52"
                        link="/teams"
                    />
                    <KPICard 
                        title="Open Requests" 
                        value={`${stats.open_requests} Pending`}
                        subtitle={`${stats.overdue_requests} Overdue Tasks`}
                        borderColor="#40c057" // Green
                        bgColor="#ebfbee"
                        textColor="#2b8a3e"
                        link={isTechnician ? "/kanban" : "#"}
                    />
                </Row>
            )}

            {/* My Assigned Equipment Section */}
            <h4 className="fw-bold mb-4 text-dark">My Assigned Equipment</h4>

            <Row className="mb-5">
                {equipment.length > 0 ? equipment.map(eq => (
                    <Col lg={4} md={6} key={eq.id} className="mb-4">
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                            <Card.Body className="p-4 d-flex flex-column">
                                <h5 className="fw-bold mb-4 text-dark">{eq.name}</h5>
                                
                                <div className="mb-4 flex-grow-1">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Serial Number:</span>
                                        <span className="fw-medium text-dark small">{eq.serial_number}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Location:</span>
                                        <span className="fw-medium text-dark small">{eq.location || 'N/A'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Purchase Date:</span>
                                        <span className="fw-medium text-dark small">{formatDate(eq.purchase_date)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Warranty:</span>
                                        <span className="fw-medium small" style={{ color: '#059669' }}>
                                            {eq.warranty_info || 'Valid until Jan 2026'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <Button 
                                        variant="primary" 
                                        className="w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-3 shadow-sm border-0"
                                        style={{ 
                                            backgroundColor: '#714B67', // Odoo Purple
                                            borderRadius: '12px',
                                            letterSpacing: '0.5px'
                                        }}
                                        onClick={() => navigate(`/equipment/${eq.id}`)}
                                    >
                                        <span>Maintenance</span>
                                        <Badge bg="white" text="dark" className="rounded-pill px-2 py-1" style={{ fontSize: '0.8rem' }}>
                                            {eq.open_request_count}
                                        </Badge>
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                )) : (
                    <Col>
                        <div className="text-muted py-4">No equipment assigned.</div>
                    </Col>
                )}
            </Row>

            {/* Equipments in Maintenance Table */}
            <div className="mb-5">
                <h4 className="fw-bold mb-3 text-dark">Equipments in Maintenance</h4>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-4 text-muted small fw-normal text-uppercase">Equipment Name</th>
                                <th className="py-3 text-muted small fw-normal text-uppercase">Status</th>
                                <th className="py-3 text-muted small fw-normal text-uppercase">Subject</th>
                                <th className="py-3 pe-4 text-muted small fw-normal text-uppercase text-end">Reported Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeRequests.length > 0 ? activeRequests.map(req => (
                                <tr key={req.id} style={{ height: '70px' }}>
                                    <td className="ps-4 fw-medium text-dark">{req.equipment?.name}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td className="text-secondary">{req.subject}</td>
                                    <td className="pe-4 text-secondary text-end">{formatDate(req.created_at)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-muted">No active maintenance requests.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>

            {/* Scheduled Maintenance Table */}
            <div className="mb-5">
                <h4 className="fw-bold mb-3 text-dark">Scheduled Maintenance by Manager</h4>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-4 text-muted small fw-normal text-uppercase">Equipment Name</th>
                                <th className="py-3 text-muted small fw-normal text-uppercase">Maintenance Type</th>
                                <th className="py-3 text-muted small fw-normal text-uppercase">Scheduled Date</th>
                                <th className="py-3 pe-4 text-muted small fw-normal text-uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduledRequests.length > 0 ? scheduledRequests.map(req => (
                                <tr key={req.id} style={{ height: '70px' }}>
                                    <td className="ps-4 fw-medium text-dark">{req.equipment?.name}</td>
                                    <td className="text-secondary">{req.type}</td>
                                    <td className="fw-medium text-dark">{formatDate(req.scheduled_date)}</td>
                                    <td className="pe-4 text-secondary">Regular maintenance check</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-muted">No scheduled maintenance.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>
        </Container>
    );
};

export default Dashboard;
