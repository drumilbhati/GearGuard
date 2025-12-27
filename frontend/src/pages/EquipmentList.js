import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Form, InputGroup, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { FaSearch, FaPlus, FaFilter, FaClock } from 'react-icons/fa';

const EquipmentList = () => {
    const { user } = useAuth();
    const [equipment, setEquipment] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [openCounts, setOpenCounts] = useState({});
    const navigate = useNavigate();

    const isManager = user?.role === 'Manager';

    useEffect(() => {
        // Debounce search to avoid too many API calls
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            const query = searchTerm ? `?search=${searchTerm}` : '';
            const eqRes = await api.get(`/equipment${query}`);
            setEquipment(eqRes.data);

            const reqRes = await api.get('/requests');
            const counts = {};
            reqRes.data.forEach(r => {
                if (r.status === 'New' || r.status === 'In Progress') {
                    counts[r.equipment_id] = (counts[r.equipment_id] || 0) + 1;
                }
            });
            setOpenCounts(counts);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Equipment Registry</h2>
                    <p className="text-muted mb-0">Manage and track company assets</p>
                </div>
                {isManager && (
                    <Button variant="primary" onClick={() => navigate('/equipment/new')} className="d-flex align-items-center gap-2 shadow-sm">
                        <FaPlus size={12} /> Add Equipment
                    </Button>
                )}
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-0">
                    <Row className="align-items-center">
                        <Col md={4}>
                            <InputGroup className="mb-3">
                                <InputGroup.Text className="bg-light border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search by name or department..." 
                                    className="bg-light border-start-0 ps-0"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    value={searchTerm}
                                />
                            </InputGroup>
                        </Col>
                        <Col className="text-end">
                            <Button variant="light" className="text-muted"><FaFilter className="me-2" /> Filter</Button>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light text-muted">
                            <tr>
                                <th className="ps-4 py-3 fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Asset Name</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Department</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Category</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Serial #</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Assigned Team</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Default Tech</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Owner</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Maintenance</th>
                                <th className="fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Status</th>
                                <th className="text-end pe-4 fw-normal text-uppercase" style={{fontSize: '0.75rem'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id} className="border-bottom">
                                    <td className="ps-4 py-3">
                                        <div className="fw-bold text-dark">{item.name}</div>
                                        <div className="text-muted small">{item.location}</div>
                                    </td>
                                    <td><span className="text-dark small">{item.department || '-'}</span></td>
                                    <td><Badge bg="light" text="dark" className="border fw-normal">{item.category}</Badge></td>
                                    <td className="text-secondary" style={{fontFamily: 'monospace'}}>{item.serial_number}</td>
                                    <td>
                                        {item.maintenance_team ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="bg-primary rounded-circle" style={{width: '8px', height: '8px'}}></div>
                                                {item.maintenance_team.name}
                                            </div>
                                        ) : <span className="text-muted">-</span>}
                                    </td>
                                    <td>
                                        {item.default_technician ? (
                                            <span className="text-dark small fw-medium">{item.default_technician.name}</span>
                                        ) : <span className="text-muted small">-</span>}
                                    </td>
                                    <td>
                                        {item.employee ? (
                                            <span className="text-dark small fw-medium">{item.employee.name}</span>
                                        ) : <span className="text-muted small">Unassigned</span>}
                                    </td>
                                    <td>
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            className="px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
                                            style={{ 
                                                fontSize: '0.8rem', 
                                                borderRadius: '8px', 
                                                backgroundColor: '#714B67', // Odoo Purple
                                                borderColor: '#714B67',
                                                fontWeight: '600'
                                            }}
                                            onClick={() => navigate(`/equipment/${item.id}`)}
                                        >
                                            <FaClock size={12} />
                                            <span>Maintenance</span>
                                            <Badge bg="white" text="dark" className="ms-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                                {openCounts[item.id] || 0}
                                            </Badge>
                                        </Button>
                                    </td>
                                    <td>
                                        {item.is_usable ? (
                                            <Badge bg="success-subtle" text="success" className="px-3 py-2 rounded-pill fw-normal">Active</Badge>
                                        ) : (
                                            <Badge bg="danger-subtle" text="danger" className="px-3 py-2 rounded-pill fw-normal">Scrapped</Badge>
                                        )}
                                    </td>
                                    <td className="text-end pe-4">
                                        <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/equipment/${item.id}`)} style={{fontSize: '0.8rem'}}>
                                            Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EquipmentList;