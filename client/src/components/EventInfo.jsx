import React from 'react';
import './EventInfo.css';

function EventInfo({ event, course, eventDate, startTime, timeRemaining, isWithin24Hours, hasStarted }) {
    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getCountdownDisplay = () => {
        if (hasStarted) {
            return <span className="countdown-ended">Event has started</span>;
        }

        if (timeRemaining === null) {
            return <span>Calculating...</span>;
        }

        const countdownClass = isWithin24Hours ? 'countdown-red' : 'countdown-green';

        if (timeRemaining > 24 * 60 * 60 * 1000) {
            const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
            return <span className={countdownClass}>{days === 1 ? '1 day' : `${days} days`}</span>;
        } else {
            const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            return (
                <span className={countdownClass}>
                    {`${hours}h ${minutes}m`}
                </span>
            );
        }
    };

    return (
        <div className="event-info">
            <h3>Event Information</h3>
            <div className="course-info">
                {course}
            </div>
            <div className="event-details">
                <h2 className="event-name">{event}</h2>
            </div>
            <div className="event-timing">
                <div>Event Date: {formatDate(eventDate)}</div>
                <div>Start Time: {startTime}</div>
                <div>Time till Lock: {getCountdownDisplay()}</div>
            </div>
        </div>
    );
}

export default EventInfo;