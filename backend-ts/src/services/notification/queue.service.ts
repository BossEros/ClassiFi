import { injectable, inject } from "tsyringe"
import type { NotificationDeliveryRepository } from "../../repositories/notification-delivery.repository.js"
import type { UserRepository } from "../../repositories/user.repository.js"
import type { IEmailService } from "../interfaces/email.interface.js"
import type { NotificationDelivery } from "../../models/index.js"
import type { NotificationType } from "../../api/schemas/notification.schema.js"
import { NOTIFICATION_TYPES, type PayloadFor } from "./types.js"

/**
 * Type guard to check if a value is an Error instance.
 *
 * @param e - The value to check
 * @returns True if the value is an Error with a message property
 */
function isError(e: unknown): e is Error {
  return e instanceof Error && typeof (e as Error).message === "string"
}

/**
 * Service for managing notification delivery queue and processing.
 * Handles asynchronous delivery of notifications through various channels.
 */
@injectable()
export class NotificationQueueService {
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY_BASE_MS = 60000 // 1 minute

  constructor(
    @inject("NotificationDeliveryRepository")
    private deliveryRepo: NotificationDeliveryRepository,
    @inject("EmailService")
    private emailService: IEmailService,
    @inject("UserRepository")
    private userRepo: UserRepository,
  ) { }

  /**
   * Enqueues a notification delivery.
   *
   * @param notificationId - The ID of the notification
   * @param channel - The delivery channel
   * @param data - Template data for rendering
   */
  async enqueueDelivery<T extends NotificationType>(
    notificationId: number,
    channel: "EMAIL" | "IN_APP",
    data: PayloadFor<T>,
  ): Promise<void> {
    const delivery = await this.deliveryRepo.create({
      notificationId,
      channel,
      status: "PENDING",
      retryCount: 0,
      templateData: data as unknown as Record<string, unknown>,
    })

    // Process immediately (can be moved to background worker)
    await this.processDelivery(delivery.id, data)
  }

  /**
   * Checks if a delivery is in a processable state.
   *
   * @param delivery - The delivery record to check
   * @returns True if the delivery can be processed
   */
  private isDeliveryProcessable(
    delivery: NotificationDelivery | undefined,
  ): delivery is NotificationDelivery {
    return (
      delivery !== undefined &&
      (delivery.status === "PENDING" || delivery.status === "RETRYING")
    )
  }

  /**
   * Processes a pending or retrying delivery with atomic claiming.
   * Uses repository-level atomic claim to ensure only one worker processes the delivery.
   *
   * @param deliveryId - The ID of the delivery
   * @param data - Template data for rendering (optional, will use persisted data if not provided)
   */
  async processDelivery<T extends NotificationType>(
    deliveryId: number,
    data?: PayloadFor<T>,
  ): Promise<void> {
    const delivery = await this.deliveryRepo.findById(deliveryId)

    if (!this.isDeliveryProcessable(delivery)) {
      return
    }

    // Atomically claim the delivery for processing
    const claimed = await this.deliveryRepo.claimDelivery(deliveryId)

    if (!claimed) {
      // Another worker already claimed this delivery
      return
    }

    const templateData = data ?? (delivery.templateData as PayloadFor<T>)

    if (!templateData) {
      // Revert status back to original state on error
      await this.deliveryRepo.update(deliveryId, {
        status: delivery.status,
      })
      throw new Error("No template data available for delivery processing")
    }

    try {
      if (delivery.channel === "EMAIL") {
        await this.sendEmailNotification(delivery, templateData)
      }

      await this.deliveryRepo.update(deliveryId, {
        status: "SENT",
        sentAt: new Date(),
      })
    } catch (error) {
      await this.handleDeliveryFailure(deliveryId, error, templateData)
    }
  }

  /**
   * Sends an email notification.
   *
   * @param delivery - The delivery record
   * @param data - Template data for rendering
   */
  private async sendEmailNotification<T extends NotificationType>(
    delivery: NotificationDelivery,
    data: PayloadFor<T>,
  ): Promise<void> {
    const notification = await this.deliveryRepo.getNotification(
      delivery.notificationId,
    )

    if (!notification) {
      throw new Error(
        `Notification not found for delivery ${delivery.id} (notificationId: ${delivery.notificationId})`,
      )
    }

    const config = NOTIFICATION_TYPES[notification.type as T]

    if (!config) {
      throw new Error(
        `Unknown notification type "${notification.type}" for notification ${notification.id} (delivery: ${delivery.id})`,
      )
    }

    const user = await this.userRepo.findById(notification.userId)

    if (!user || !user.email) {
      throw new Error(
        `User email not found for notification ${notification.id} (userId: ${notification.userId}, delivery: ${delivery.id})`,
      )
    }

    const emailHtml = config.emailTemplate
      ? config.emailTemplate(data)
      : notification.message

    await this.emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: emailHtml,
    })
  }

  /**
   * Handles delivery failure with retry logic.
   *
   * @param deliveryId - The ID of the delivery
   * @param error - The error that occurred
   * @param data - Template data to persist for retries
   */
  private async handleDeliveryFailure<T extends NotificationType>(
    deliveryId: number,
    error: unknown,
    data: PayloadFor<T>,
  ): Promise<void> {
    const delivery = await this.deliveryRepo.findById(deliveryId)

    if (!delivery) {
      return
    }

    const retryCount = delivery.retryCount + 1
    const errorMessage = isError(error) ? error.message : String(error)

    if (retryCount < NotificationQueueService.MAX_RETRIES) {
      await this.deliveryRepo.update(deliveryId, {
        status: "RETRYING",
        retryCount,
        errorMessage,
        templateData: data as unknown as Record<string, unknown>,
      })

      const delayMs = NotificationQueueService.RETRY_DELAY_BASE_MS * retryCount
      setTimeout(() => this.processDelivery(deliveryId), delayMs)
    } else {
      await this.deliveryRepo.update(deliveryId, {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage,
      })
    }
  }
}
