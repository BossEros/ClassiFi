import { addMinutes } from "date-fns"
import type { DayLayoutFunction } from "react-big-calendar"
import type { CalendarEvent } from "@/business/models/calendar/types"

interface SlotRange {
  top: number
  height: number
  start: number
  end: number
  startDate: Date
  endDate: Date
}

interface SlotMetrics {
  getRange: (start: Date, end: Date) => SlotRange
}

interface EventAccessors<TEvent> {
  start: (event: TEvent) => Date
  end: (event: TEvent) => Date
}

interface PositionedEvent {
  event: CalendarEvent
  range: SlotRange
  startMinuteKey: number
  stackKey: string
  displayHeight: number
}

const DEFAULT_EVENT_DURATION_MINUTES = 30

/**
 * Stacks events that share the same start time vertically in week/day views.
 * This keeps deadline clusters readable without forcing side-by-side columns.
 *
 * @param params - React Big Calendar layout parameters
 * @returns Styled events for the time grid layout
 */
export const stackedDayLayoutAlgorithm: DayLayoutFunction<CalendarEvent> = ({
  events,
  slotMetrics,
  accessors,
}) => {
  const metrics = slotMetrics as SlotMetrics
  const eventAccessors = accessors as EventAccessors<CalendarEvent>

  const positionedEvents: PositionedEvent[] = events.map((event) => {
    const start = eventAccessors.start(event)
    const end = eventAccessors.end(event)
    const range = metrics.getRange(start, end)
    const defaultRange = metrics.getRange(
      start,
      addMinutes(start, DEFAULT_EVENT_DURATION_MINUTES),
    )
    const startMinuteKey = Math.floor(start.getTime() / 60000)
    const stackKey = `${event.assignment.assignmentId}-${event.classInfo.id}`
    const displayHeight = Math.max(range.height, defaultRange.height)

    return {
      event,
      range,
      startMinuteKey,
      stackKey,
      displayHeight,
    }
  })

  const groups = new Map<number, PositionedEvent[]>()
  for (const item of positionedEvents) {
    const existing = groups.get(item.startMinuteKey)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.startMinuteKey, [item])
    }
  }

  return positionedEvents.map((item) => {
    const group = groups.get(item.startMinuteKey)
    const baseStyle = {
      width: 100,
      xOffset: 0,
    }

    if (!group || group.length === 1) {
      return {
        event: item.event,
        style: {
          ...baseStyle,
          top: item.range.top,
          height: item.displayHeight,
        },
      }
    }

    const sortedGroup = [...group].sort((a, b) =>
      a.stackKey.localeCompare(b.stackKey),
    )
    const index = sortedGroup.findIndex(
      (entry) => entry.stackKey === item.stackKey,
    )
    const baseTop = sortedGroup.reduce(
      (minTop, entry) => Math.min(minTop, entry.range.top),
      sortedGroup[0].range.top,
    )
    const groupHeight = sortedGroup[0].displayHeight
    const heightPerEvent = groupHeight / sortedGroup.length

    return {
      event: item.event,
      style: {
        ...baseStyle,
        top: baseTop + heightPerEvent * index,
        height: heightPerEvent,
      },
    }
  })
}
