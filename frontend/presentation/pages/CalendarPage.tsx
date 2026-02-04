/**
 * Calendar Page
 * 
 * Main page component for the calendar feature.
 * Displays a month-view calendar with assignment deadlines and class information.
 * Integrates React Big Calendar with custom components and styling.
 */

import { Calendar, type View } from 'react-big-calendar';
import { useCalendar } from '@/presentation/hooks/useCalendar';
import { CustomEventComponent } from '@/presentation/components/calendar/CustomEventComponent';
import { CustomToolbar } from '@/presentation/components/calendar/CustomToolbar';
import { CalendarFilters } from '@/presentation/components/calendar/CalendarFilters';
import { EventDetailsModal } from '@/presentation/components/calendar/EventDetailsModal';
import { calendarLocalizer } from '@/shared/utils/calendarConfig';
import type { CalendarEvent } from '@/business/models/calendar/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';

/**
 * Calendar page component.
 * 
 * Displays a month-view calendar with:
 * - Assignment deadlines from enrolled/teaching classes
 * - Class-based filtering
 * - Color-coded events by class
 * - Event details modal
 * - Month navigation
 * 
 * @returns The calendar page UI
 */
export default function CalendarPage() {
  const {
    currentDate,
    filteredEvents,
    selectedClasses,
    availableClasses,
    selectedEvent,
    isLoading,
    error,
    navigateMonth,
    toggleClassFilter,
    selectAllClasses,
    deselectAllClasses,
    openEventDetails,
    closeEventDetails,
  } = useCalendar();

  /**
   * Handles navigation events from React Big Calendar.
   * 
   * @param _newDate - The new date to navigate to (unused, we use action instead)
   * @param _view - The calendar view (always 'month' for MVP)
   * @param action - The navigation action performed
   */
  const handleNavigate = (_newDate: Date, _view: View, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => {
    if (action === 'PREV') {
      navigateMonth('prev');
    } else if (action === 'NEXT') {
      navigateMonth('next');
    } else if (action === 'TODAY') {
      navigateMonth('today');
    }
  };

  /**
   * Handles event selection (click) from React Big Calendar.
   * 
   * @param event - The selected calendar event
   */
  const handleSelectEvent = (event: CalendarEvent) => {
    openEventDetails(event);
  };

  /**
   * Provides custom styling for events based on class color.
   * 
   * @param event - The calendar event to style
   * @returns Style object for the event
   */
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.classColor,
        borderLeft: `3px solid ${event.classColor}`,
        color: 'white',
      },
    };
  };

  /**
   * Provides custom styling for day cells.
   * Highlights the current day.
   * 
   * @param date - The date of the day cell
   * @returns Style object for the day cell
   */
  const dayStyleGetter = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return {
        className: 'rbc-today-highlight',
      };
    }

    return {};
  };

  /**
   * Handles class filter changes.
   * 
   * @param classId - The class ID to toggle
   */
  const handleFilterChange = (classId: number) => {
    toggleClassFilter(classId);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/95 backdrop-blur-xl px-6 py-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Calendar
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-6 p-6">
          {/* Sidebar - Class Filters */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <CalendarFilters
              classes={availableClasses}
              selectedClasses={selectedClasses}
              onFilterChange={handleFilterChange}
              onSelectAll={selectAllClasses}
              onDeselectAll={deselectAllClasses}
            />
          </aside>

          {/* Calendar Container */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Filters */}
            <div className="lg:hidden mb-4">
              <CalendarFilters
                classes={availableClasses}
                selectedClasses={selectedClasses}
                onFilterChange={handleFilterChange}
                onSelectAll={selectAllClasses}
                onDeselectAll={deselectAllClasses}
              />
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-sm">
                    Loading calendar events...
                  </p>
                </div>
              </div>
            )}

            {/* Calendar */}
            {!isLoading && (
              <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden calendar-container">
                <Calendar<CalendarEvent>
                  localizer={calendarLocalizer}
                  events={filteredEvents}
                  startAccessor="deadline"
                  endAccessor="deadline"
                  date={currentDate}
                  view="month"
                  views={['month']}
                  onNavigate={handleNavigate}
                  onSelectEvent={handleSelectEvent}
                  components={{
                    event: CustomEventComponent,
                    toolbar: CustomToolbar as any,
                  }}
                  eventPropGetter={eventStyleGetter}
                  dayPropGetter={dayStyleGetter}
                  style={{ height: '100%' }}
                  popup={false}
                  selectable={false}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={selectedEvent !== null}
        onClose={closeEventDetails}
        event={selectedEvent}
      />
    </div>
  );
}
