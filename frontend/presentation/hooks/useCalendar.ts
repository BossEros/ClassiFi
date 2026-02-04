/**
 * useCalendar Hook
 * 
 * Custom hook for managing calendar state and operations.
 * Handles event fetching, filtering, navigation, and modal state.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import * as calendarService from '@/business/services/calendarService';
import * as authService from '@/business/services/authService';
import type { CalendarEvent, ClassInfo } from '@/business/models/calendar/types';

/**
 * Return type for the useCalendar hook.
 */
export interface UseCalendarReturn {
    // State
    currentDate: Date;
    events: CalendarEvent[];
    filteredEvents: CalendarEvent[];
    selectedClasses: Set<number>;
    availableClasses: ClassInfo[];
    selectedEvent: CalendarEvent | null;
    isLoading: boolean;
    error: string | null;

    // Methods
    navigateMonth: (direction: 'prev' | 'next' | 'today') => void;
    toggleClassFilter: (classId: number) => void;
    selectAllClasses: () => void;
    deselectAllClasses: () => void;
    openEventDetails: (event: CalendarEvent) => void;
    closeEventDetails: () => void;
    refetchEvents: () => Promise<void>;
}

/**
 * Custom hook for calendar state management.
 * Manages calendar events, filtering, navigation, and modal state.
 * 
 * @returns Calendar state and methods
 */
export function useCalendar(): UseCalendarReturn {
    // State management
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());
    const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches calendar events for the current month.
     * Retrieves user info and fetches events based on role.
     */
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const user = authService.getCurrentUser();

            if (!user) {
                setError('User not authenticated');
                setEvents([]);
                return;
            }

            // Calculate date range for current month
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Fetch events and classes in parallel
            const [fetchedEvents, fetchedClasses] = await Promise.all([
                calendarService.getCalendarEvents(
                    startDate,
                    endDate,
                    parseInt(user.id),
                    user.role as 'student' | 'teacher'
                ),
                calendarService.getClassesForFilter(
                    parseInt(user.id),
                    user.role as 'student' | 'teacher'
                )
            ]);

            setEvents(fetchedEvents);
            setAvailableClasses(fetchedClasses);

            // Initialize selected classes with all classes if not already set
            if (selectedClasses.size === 0 && fetchedClasses.length > 0) {
                setSelectedClasses(new Set(fetchedClasses.map(cls => cls.id)));
            }
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            setError(err instanceof Error ? err.message : 'Failed to load calendar events');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, selectedClasses.size]);

    /**
     * Filters events based on selected classes.
     * Memoized to avoid unnecessary recalculations.
     */
    const filteredEvents = useMemo(() => {
        // If no classes are selected, show all events
        if (selectedClasses.size === 0) {
            return events;
        }

        // Filter events by selected classes
        return events.filter(event => selectedClasses.has(event.classId));
    }, [events, selectedClasses]);

    /**
     * Navigates to a different month or returns to today.
     * 
     * @param direction - Navigation direction ('prev', 'next', or 'today')
     */
    const navigateMonth = useCallback((direction: 'prev' | 'next' | 'today') => {
        setCurrentDate(prevDate => {
            if (direction === 'today') {
                return new Date();
            }

            const newDate = new Date(prevDate);

            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else if (direction === 'next') {
                newDate.setMonth(newDate.getMonth() + 1);
            }

            return newDate;
        });
    }, []);

    /**
     * Toggles a class in the filter selection.
     * 
     * @param classId - ID of the class to toggle
     */
    const toggleClassFilter = useCallback((classId: number) => {
        setSelectedClasses(prevSelected => {
            const newSelected = new Set(prevSelected);

            if (newSelected.has(classId)) {
                newSelected.delete(classId);
            } else {
                newSelected.add(classId);
            }

            return newSelected;
        });
    }, []);

    /**
     * Selects all available classes in the filter.
     */
    const selectAllClasses = useCallback(() => {
        setSelectedClasses(new Set(availableClasses.map(cls => cls.id)));
    }, [availableClasses]);

    /**
     * Deselects all classes in the filter.
     */
    const deselectAllClasses = useCallback(() => {
        setSelectedClasses(new Set());
    }, []);

    /**
     * Opens the event details modal for a specific event.
     * 
     * @param event - The calendar event to display details for
     */
    const openEventDetails = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
    }, []);

    /**
     * Closes the event details modal.
     */
    const closeEventDetails = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    /**
     * Manually refetches calendar events.
     * Useful for refreshing data after changes.
     */
    const refetchEvents = useCallback(async () => {
        await fetchEvents();
    }, [fetchEvents]);

    // Fetch events when currentDate changes
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        currentDate,
        events,
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
        refetchEvents,
    };
}
