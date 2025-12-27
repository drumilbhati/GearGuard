import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaTools, FaExclamationTriangle, FaUserClock, FaClipboardList } from 'react-icons/fa';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_equipment: 0,
        critical_equipment: 0,
        open_requests: 0,
        overdue_requests: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error loading stats", error);
            }
        };
        fetchStats();
    }, []);

    const KPICard = ({ title, value, subtitle, color, icon: Icon, link }) => (
        <Col md={4} className="mb-4">
            <Card className={`h-100 shadow-sm border-${color}`} style={{ backgroundColor: `var(--bs-${color}-bg-subtle)` }}>
                <Card.Body className="d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 className="text-uppercase text-muted mb-2">{title}</h6>
                            <h2 className="display-6 fw-bold mb-0">{value}</h2>
                        </div>
                        <div className={`p-3 rounded-circle bg-${color} text-white`}>
                            <Icon size={24} />
                        </div>
                    </div>
                    {subtitle && <div className="mt-3 text-muted small">{subtitle}</div>}
                    {link && (
                        <Link to={link} className="stretched-link mt-3 text-decoration-none fw-bold">
                            View Details &rarr;
                        </Link>
                    )}
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Overview</h2>
            
            <Row>
                <KPICard 
                    title="Critical Equipment" 
                    value={stats.critical_equipment} 
                    subtitle="Assets flagged as Unusable/Scrap"
                    color="danger" 
                    icon={FaExclamationTriangle}
                    link="/equipment"
                />
                <KPICard 
                    title="Open Requests" 
                    value={stats.open_requests} 
                    subtitle={`${stats.overdue_requests} Overdue`}
                    color="success" 
                    icon={FaClipboardList}
                    link="/kanban"
                />
                <KPICard 
                    title="Technician Load" 
                    value={`${stats.open_requests}`} // Simplified load metric
                    subtitle="Active Tasks Across Teams"
                    color="primary" 
                    icon={FaUserClock}
                    link="/teams"
                />
            </Row>

            <h4 className="mt-4 mb-3">Quick Actions</h4>
            <Row>
                <Col md={3}>
                    <Link to="/requests/new" className="btn btn-primary w-100 py-3 mb-2">
                        + Create Request
                    </Link>
                </Col>
                <Col md={3}>
                    <Link to="/equipment/new" className="btn btn-outline-dark w-100 py-3 mb-2">
                        + Add Equipment
                    </Link>
                </Col>
                <Col md={3}>
                    <Link to="/calendar" className="btn btn-outline-info w-100 py-3 mb-2">
                        View Calendar
                    </Link>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;