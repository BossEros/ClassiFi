import React from "react"
import { LogOut, BookOpen, Trash2, Edit } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import { InstructorInfo } from "./InstructorInfo"
import { ScheduleInfo } from "./ScheduleInfo"
import { ClassCodeBadge } from "./ClassCodeBadge"

interface ClassHeaderProps {
    className?: string
    classCode: string
    classNameTitle: string
    instructorName: string
    schedule: {
        days: string[]
        startTime: string
        endTime: string
    }
    studentCount: number
    isTeacher: boolean
    onEditClass?: () => void
    onDeleteClass?: () => void
    onLeaveClass?: () => void
    onViewGradebook?: () => void
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
    className = "",
    classCode,
    classNameTitle,
    instructorName,
    schedule,
    // studentCount, // Unused for now, but part of interface
    isTeacher,
    onEditClass,
    onDeleteClass,
    onLeaveClass,
    onViewGradebook,
}) => {
    return (
        <div className={`p-6 bg-slate-900 border-b border-white/10 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Left Side: Class Info */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {classNameTitle}
                        </h1>
                        <ClassCodeBadge classCode={classCode} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <InstructorInfo instructorName={instructorName} />
                        <ScheduleInfo
                            days={schedule.days}
                            startTime={schedule.startTime}
                            endTime={schedule.endTime}
                        />
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-3">
                    {isTeacher ? (
                        <>
                            <Button
                                variant="secondary"
                                className="gap-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
                                onClick={onViewGradebook}
                            >
                                <BookOpen className="w-4 h-4" />
                                Gradebook
                            </Button>

                            <DropdownMenu
                                items={[
                                    {
                                        id: "edit",
                                        label: "Edit Class",
                                        icon: Edit,
                                        onClick: onEditClass || (() => { }),
                                    },
                                    {
                                        id: "delete",
                                        label: "Delete Class",
                                        icon: Trash2,
                                        variant: "danger",
                                        onClick: onDeleteClass || (() => { }),
                                    },
                                ]}
                                triggerLabel="Class actions"
                                className="text-slate-400 hover:text-white"
                            />
                        </>
                    ) : (
                        <Button
                            variant="danger"
                            className="gap-2"
                            onClick={onLeaveClass}
                        >
                            <LogOut className="w-4 h-4" />
                            Leave Class
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
