import { eq, inArray, and } from "drizzle-orm"
import {
  notificationDeliveries,
  notifications,
  type NotificationDelivery,
  type NewNotificationDelivery,
  type Notification,
} from "../models/index.js"
import { BaseRepository } from "./base.repository.js"
import { injectable } from "tsyringe"
import { NotFoundError } from "../shared/errors.js"

/**
 * Repository for notification delivery-related database operations.
 * Provides methods for tracking notification delivery status.
 */
@injectable()
export class NotificationDeliveryRepository extends BaseRepository<
  typeof notificationDeliveries,
  NotificationDelivery,
  NewNotificationDelivery
> {
  constructor() {
    super(notificationDeliveries)
  }

  /**
   * Finds pending deliveries for processing.
   *
   * @param limit - Maximum number of deliveries to return
   * @returns Array of pending deliveries
   */
  async findPending(limit: number = 100): Promise<NotificationDelivery[]> {
    return await this.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.status, "PENDING"))
      .limit(limit)
  }

  /**
   * Atomically claims a delivery for processing by updating its status to PROCESSING.
   * Only succeeds if the delivery is in PENDING or RETRYING status.
   *
   * @param deliveryId - The ID of the delivery to claim
   * @returns True if the claim was successful (delivery was claimed), false otherwise
   */
  async claimDelivery(deliveryId: number): Promise<boolean> {
    const result = await this.db
      .update(notificationDeliveries)
      .set({
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationDeliveries.id, deliveryId),
          inArray(notificationDeliveries.status, ["PENDING", "RETRYING"]),
        ),
      )
      .returning()

    // If a row was updated, the claim was successful
    return result.length > 0
  }

  /**
   * Gets the notification associated with a delivery.
   *
   * @param notificationId - The ID of the notification
   * @returns The notification
   */
  async getNotification(notificationId: number): Promise<Notification> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)

    if (!result[0]) {
      throw new NotFoundError("Notification not found")
    }

    return result[0] as Notification
  }
}
