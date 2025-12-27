import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Modal } from 'react-bootstrap';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaPlus, FaCalendarAlt, FaFilter } from 'react-icons/fa';

// Setup the localizer by providing the moment (or globalize, or Date) Object
const localizer = momentLocalizer(moment);

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const [view, setView] = useState('month');
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            // Filter requests that have a scheduled date
            const calendarEvents = res.data
                .filter(req => req.scheduled_date && req.status !== 'Scrap')
                .map(req => {
                    const startDate = new Date(req.scheduled_date);
                    // Default duration 1 hour if not specified, or use duration_hours
                    const endDate = new Date(startDate.getTime() + (req.duration_hours || 1) * 60 * 60 * 1000);
                    
                    return {
                        id: req.id,
                        title: `${req.subject} (${req.equipment?.name})`,
                        start: startDate,
                        end: endDate,
                        resource: req,
                        type: req.type,
                        status: req.status
                    };
                });
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Error loading calendar events", error);
        }
    };

    // Custom styling for events
    const eventStyleGetter = (event) => {
        let backgroundColor = '#3182ce'; // Default Blue
        let borderColor = '#2b6cb0';

        if (event.type === 'Corrective') {
            backgroundColor = '#e53e3e'; // Red for Breakdown
            borderColor = '#c53030';
        } else if (event.status === 'Repaired') {
            backgroundColor = '#38a169'; // Green for Done
            borderColor = '#2f855a';
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.85rem'
            }
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedRequest(event.resource);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
    };

    return (
        <Container className="mt-5" style={{ maxWidth: '1400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Maintenance Schedule</h2>
                    <p className="text-muted mb-0">Track upcoming preventive and corrective tasks</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" className="d-flex align-items-center gap-2">
                        <FaFilter size={12} /> Filter
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/requests/new')} className="d-flex align-items-center gap-2 shadow-sm">
                        <FaPlus size={12} /> Schedule New
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Card.Body className="p-4">
                    <div style={{ height: '700px' }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', fontFamily: 'Inter, sans-serif' }}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={handleSelectEvent}
                            views={['month', 'week', 'day', 'agenda']}
                            defaultView="month"
                            onView={setView}
                            popup
                            
                            components={{
                                toolbar: CustomToolbar
                            }}
                        />
                    </div>
                </Card.Body>
            </Card>

            {/* Request Details Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Request Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {selectedRequest && (
                        <div>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 className="mb-1 text-primary fw-bold">{selectedRequest.subject}</h5>
                                    <div className="text-muted small">ID: #{selectedRequest.id}</div>
                                </div>
                                <Badge bg={selectedRequest.status === 'Repaired' ? 'success' : selectedRequest.status === 'In Progress' ? 'warning' : 'info'}>
                                    {selectedRequest.status}
                                </Badge>
                            </div>

                            <div className="mb-3 p-3 bg-light rounded-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Equipment:</span>
                                    <span className="fw-medium">{selectedRequest.equipment?.name}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Serial Number:</span>
                                    <span className="fw-medium">{selectedRequest.equipment?.serial_number}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small">Location:</span>
                                    <span className="fw-medium">{selectedRequest.equipment?.location}</span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Type:</span>
                                    <span className="fw-medium">{selectedRequest.type}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Scheduled Date:</span>
                                    <span className="fw-medium">
                                        {selectedRequest.scheduled_date ? new Date(selectedRequest.scheduled_date).toLocaleString() : 'Not Scheduled'}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Assigned Team:</span>
                                    <span className="fw-medium">{selectedRequest.team?.name || 'Unassigned'}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Technician:</span>
                                    <span className="fw-medium">{selectedRequest.technician?.name || 'Unassigned'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

// Custom Toolbar to match our style
const CustomToolbar = (toolbar) => {
    const goToBack = () => {
        toolbar.date.setMonth(toolbar.date.getMonth() - 1);
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.date.setMonth(toolbar.date.getMonth() + 1);
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        const now = new Date();
        toolbar.date.setMonth(now.getMonth());
        toolbar.date.setYear(now.getFullYear());
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = moment(toolbar.date);
        return <span className="fw-bold h5 mb-0 text-dark">{date.format('MMMM YYYY')}</span>;
    };

    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
                <div className="btn-group shadow-sm">
                    <button className="btn btn-light border bg-white" onClick={goToBack}>&lt;</button>
                    <button className="btn btn-light border bg-white" onClick={goToCurrent}>Today</button>
                    <button className="btn btn-light border bg-white" onClick={goToNext}>&gt;</button>
                </div>
                {label()}
            </div>
            
            <div className="btn-group shadow-sm">
                {['month', 'week', 'day', 'agenda'].map(view => (
                    <button 
                        key={view}
                        className={`btn btn-light border bg-white text-capitalize ${toolbar.view === view ? 'active fw-bold text-primary' : ''}`}
                        onClick={() => toolbar.onView(view)}
                    >
                        {view}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CalendarView;