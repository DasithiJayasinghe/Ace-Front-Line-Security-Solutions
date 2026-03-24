package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the currently authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            Authentication authentication) {
        List<Notification> notifications = notificationService.getNotificationsForUser(authentication.getName());
        List<NotificationResponse> response = notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", response));
    }

    /**
     * Get unread notification count for the currently authenticated user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        long count = notificationService.countUnread(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Unread count", count));
    }

    /**
     * Mark a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    /**
     * Mark all notifications as read for the current user.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    /**
     * Send a notification (used internally by other dashboards via API).
     * Accessible by any authenticated user.
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<NotificationResponse>> sendNotification(
            @RequestBody SendNotificationRequest request) {
        Notification notification;
        if (request.getUserId() != null) {
            notification = notificationService.notifyUser(request.getUserId(), request.getMessage());
        } else if (request.getTargetRole() != null) {
            notification = notificationService.notifyRole(request.getTargetRole(), request.getMessage());
        } else {
            notification = notificationService.notifyAll(request.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.success("Notification sent", toResponse(notification)));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .targetRole(n.getTargetRole())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
