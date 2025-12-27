import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const AppNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">GearGuard</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {user && (
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/kanban">Kanban Board</Nav.Link>
                            <Nav.Link as={Link} to="/calendar">Calendar</Nav.Link>
                            <Nav.Link as={Link} to="/equipment">Equipment</Nav.Link>
                            <Nav.Link as={Link} to="/teams">Teams</Nav.Link>
                        </Nav>
                    )}
                    <Nav className="ms-auto">
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Signed in as: <a href="#login">{user.name}</a>
                                </Navbar.Text>
                                <Button variant="outline-light" size="sm" onClick={handleLogout}>Logout</Button>
                            </>
                        ) : (
                            <Nav.Link as={Link} to="/login">Login</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;