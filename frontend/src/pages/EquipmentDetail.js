import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Button, Badge, Row, Col, ListGroup } from 'react-bootstrap';
import api from '../services/api';

const EquipmentDetail = () => {
    const { id } = useParams();
    const [equipment, setEquipment] = useState(null);
    const [requests, setRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eqRes = await api.get(`/equipment?id=${id}`); 
                // Note: The generic get returns list, we filter manually for prototype or assume ID match if API supports /equipment/{id}
                // To be safe with current API:
                const allEq = await api.get('/equipment');
                const match = allEq.data.find(e => e.id === parseInt(id));
                setEquipment(match);

                const reqRes = await api.get(`/equipment/${id}/requests`);
                setRequests(reqRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    if (!equipment) return <Container className="mt-4">Loading...</Container>;

    const openRequestsCount = requests.filter(r => r.status === 'New' || r.status === 'In Progress').length;

    return (
        <Container className="mt-5" style={{ maxWidth: '1000px' }}>
            {/* Odoo-style Smart Button Row */}
            <div className="d-flex justify-content-end mb-4">
                <Button 
                    variant="primary" 
                    className="px-4 py-3 shadow border-0 d-flex align-items-center gap-3"
                    style={{ 
                        borderRadius: '12px', 
                        transition: 'all 0.3s',
                        backgroundColor: '#714B67', // Odoo Purple
                        minWidth: '200px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => setShowRequests(!showRequests)}
                >
                    <div className="text-center border-end border-white border-opacity-25 pe-3">
                        <div className="h3 fw-bold mb-0 text-white">{openRequestsCount}</div>
                        <small className="text-white text-uppercase fw-bold" style={{ fontSize: '0.6rem', opacity: 0.8 }}>Open Tasks</small>
                    </div>
                    <div className="text-start">
                        <div className="fw-bold text-white h5 mb-0">Maintenance</div>
                        <small className="text-white" style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                            {showRequests ? 'Hide History' : 'View History'}
                        </small>
                    </div>
                </Button>
            </div>

            <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <h2 className="fw-bold text-dark mb-0">{equipment.name}</h2>
                    {equipment.is_usable ? (
                        <Badge bg="success-subtle" text="success" className="px-3 py-2 rounded-pill fw-normal">Active / Usable</Badge>
                    ) : (
                        <Badge bg="danger-subtle" text="danger" className="px-3 py-2 rounded-pill fw-normal">Scrapped / Unusable</Badge>
                    )}
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="gy-4">
                        <Col md={6}>
                            <div className="mb-3">
                                <label className="text-muted small text-uppercase fw-bold mb-1">Equipment Details</label>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-secondary">Category</span>
                                        <span className="fw-medium">{equipment.category}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-secondary">Serial Number</span>
                                        <span className="fw-medium text-primary">{equipment.serial_number}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-secondary">Department</span>
                                        <span className="fw-medium">{equipment.department || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-3">
                                <label className="text-muted small text-uppercase fw-bold mb-1">Responsibility</label>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-secondary">Maintenance Team</span>
                                        <span className="fw-medium">{equipment.maintenance_team?.name}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-secondary">Assigned Technician</span>
                                        <span className="fw-medium">{equipment.default_technician?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-secondary">Location</span>
                                        <span className="fw-medium">{equipment.location}</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {showRequests && (
                <div className="mt-5 animate-in">
                    <h4 className="fw-bold mb-4 text-dark">Maintenance History</h4>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <ListGroup variant="flush">
                            {requests.length > 0 ? requests.map(r => (
                                <ListGroup.Item key={r.id} className="p-4 d-flex justify-content-between align-items-center hover-bg-light">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <Badge bg="light" text="dark" className="border fw-normal">{r.type}</Badge>
                                            <span className="fw-bold text-dark">{r.subject}</span>
                                        </div>
                                        <div className="text-muted small">
                                            Reported on {new Date(r.created_at).toLocaleDateString()} • Technician: {r.technician?.name || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <Badge bg={r.status === 'Repaired' ? 'success' : r.status === 'In Progress' ? 'warning' : 'info'} className="px-3 py-2 rounded-pill fw-normal">
                                            {r.status}
                                        </Badge>
                                        {r.duration_hours > 0 && (
                                            <div className="text-muted small mt-1">{r.duration_hours} hrs spent</div>
                                        )}
                                    </div>
                                </ListGroup.Item>
                            )) : (
                                <div className="p-5 text-center text-muted">No maintenance history available.</div>
                            )}
                        </ListGroup>
                    </Card>
                </div>
            )}
        </Container>
    );
};

export default EquipmentDetail;
