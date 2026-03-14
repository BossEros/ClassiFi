/** DTO for ModuleService.createModule */
export interface CreateModuleServiceDTO {
  classId: number
  teacherId: number
  name: string
}

/** DTO for ModuleService.renameModule */
export interface RenameModuleServiceDTO {
  moduleId: number
  teacherId: number
  name: string
}

/** DTO for ModuleService.toggleModulePublish */
export interface ToggleModulePublishServiceDTO {
  moduleId: number
  teacherId: number
  isPublished: boolean
}

/** DTO for ModuleService.deleteModule */
export interface DeleteModuleServiceDTO {
  moduleId: number
  teacherId: number
}
