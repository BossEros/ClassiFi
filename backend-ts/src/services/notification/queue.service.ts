import { injectable, inject } from "tsyringe";
import type { NotificationDeliveryRepository } from "../../repositories/notification-delivery.repository.js";
import type { UserRepository } from "../../repositories/user.repository.js";
import type { IEmailService } from "../interfaces/email.interface.js";
import type { NotificationDelivery } from "../../models/index.js";
import { NOTIFICATION_TYPES } from "./types.js";

/**
 * Service for managing notification delivery queue and processing.
 * Handles asynchronous delivery of notifications through various channels.
 */
@injectable()
export class NotificationQueueService {
    constructor(
        @inject("NotificationDeliveryRepository")
        private deliveryRepo: NotificationDeliveryRepository,
        @inject("EmailService")
        private emailService: IEmailService,
        @inject("UserRepository")
        private userRepo: UserRepository
    ) { }

    /**
     * Enqueues a notification delivery.
     *
     * @param notificationId - The ID of the notification
     * @param channel - The delivery channel
     * @param data - Template data for rendering
     */
    async enqueueDelivery(
        notificationId: number,
        channel: "EMAIL" | "IN_APP",
        data: Record<string, any>
    ): Promise<void> {
        const delivery = await this.deliveryRepo.create({
            notificationId,
            channel,
            status: "PENDING",
            retryCount: 0,
        });

        // Process immediately (can be moved to background worker)
        await this.processDelivery(delivery.id, data);
    }

    /**
     * Processes a pending delivery.
     *
     * @param deliveryId - The ID of the delivery
     * @param data - Template data for rendering
     */
    async processDelivery(deliveryId: number, data: Record<string, any>): Promise<void> {
        const delivery = await this.deliveryRepo.findById(deliveryId);

        if (!delivery || delivery.status !== "PENDING") {
            return;
        }

        try {
            if (delivery.channel === "EMAIL") {
                await this.sendEmailNotification(delivery, data);
            }
            // IN_APP notifications are already created in the database

            await this.deliveryRepo.update(deliveryId, {
                status: "SENT",
                sentAt: new Date(),
            });
        } catch (error) {
            await this.handleDeliveryFailure(deliveryId, error);
        }
    }

    /**
     * Sends an email notification.
     *
     * @param delivery - The delivery record
     * @param data - Template data for rendering
     */
    private async sendEmailNotification(
        delivery: NotificationDelivery,
        data: Record<string, any>
    ): Promise<void> {
        const notification = await this.deliveryRepo.getNotification(delivery.notificationId);
        const user = await this.userRepo.findById(notification.userId);

        if (!user || !user.email) {
            throw new Error("User email not found");
        }

        const config = NOTIFICATION_TYPES[notification.type];
        const emailHtml = config.emailTemplate ? config.emailTemplate(data) : notification.message;

        await this.emailService.sendEmail({
            to: user.email,
            subject: notification.title,
            html: emailHtml,
        });
    }

    /**
     * Handles delivery failure with retry logic.
     *
     * @param deliveryId - The ID of the delivery
     * @param error - The error that occurred
     */
    private async handleDeliveryFailure(deliveryId: number, error: any): Promise<void> {
        const delivery = await this.deliveryRepo.findById(deliveryId);

        if (!delivery) {
            return;
        }

        const retryCount = delivery.retryCount + 1;
        const maxRetries = 3;

        if (retryCount < maxRetries) {
            await this.deliveryRepo.update(deliveryId, {
                status: "RETRYING",
                retryCount,
                errorMessage: error.message,
            });

            // Schedule retry (can use setTimeout or job queue)
            setTimeout(() => this.processDelivery(deliveryId, {}), 60000 * retryCount);
        } else {
            await this.deliveryRepo.update(deliveryId, {
                status: "FAILED",
                failedAt: new Date(),
                errorMessage: error.message,
            });
        }
    }
}
