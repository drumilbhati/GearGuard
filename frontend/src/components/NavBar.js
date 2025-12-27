import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const AppNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const isEmployee = user?.role === 'Employee';
    const isTechnician = user?.role === 'Technician';

    return (
        <Navbar expand="lg" className="py-3 sticky-top border-bottom" style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #714B67' }}>
            <Container>
                <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px', color: '#714B67' }}>
                    <span className="me-2">⚙️</span> GearGuard
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {user && (
                        <Nav className="mx-auto">
                            <Nav.Link as={Link} to="/" className={`px-3 mx-1 rounded ${isActive('/') ? 'bg-light text-primary fw-bold' : 'text-secondary'}`}>Dashboard</Nav.Link>
                            
                            {!isEmployee && (
                                <>
                                    {isTechnician && (
                                        <Nav.Link as={Link} to="/kanban" className={`px-3 mx-1 rounded ${isActive('/kanban') ? 'bg-light text-primary fw-bold' : 'text-secondary'}`}>Board</Nav.Link>
                                    )}
                                    <Nav.Link as={Link} to="/calendar" className={`px-3 mx-1 rounded ${isActive('/calendar') ? 'bg-light text-primary fw-bold' : 'text-secondary'}`}>Calendar</Nav.Link>
                                    <Nav.Link as={Link} to="/teams" className={`px-3 mx-1 rounded ${isActive('/teams') ? 'bg-light text-primary fw-bold' : 'text-secondary'}`}>Teams</Nav.Link>
                                </>
                            )}
                            
                            <Nav.Link as={Link} to="/equipment" className={`px-3 mx-1 rounded ${isActive('/equipment') ? 'bg-light text-primary fw-bold' : 'text-secondary'}`}>Equipment</Nav.Link>
                        </Nav>
                    )}
                    <Nav className="ms-auto align-items-center">
                        {user ? (
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent text-dark shadow-none">
                                    <div className="text-end me-2 d-none d-lg-block">
                                        <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.role}</div>
                                    </div>
                                    <FaUserCircle size={32} className="text-secondary" />
                                </Dropdown.Toggle>

                                <Dropdown.Menu className="shadow-lg border-0 mt-2">
                                    <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center">
                                        <FaSignOutAlt className="me-2" /> Logout
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <Link to="/login" className="btn btn-primary px-4 shadow-sm">Login</Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
