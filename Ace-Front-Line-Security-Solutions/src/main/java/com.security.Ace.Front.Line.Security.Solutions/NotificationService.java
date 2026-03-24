package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.NotificationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Get all notifications for the given user (personal + broadcast + role-based).
     */
    public List<Notification> getNotificationsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findForUser(user, user.getRole().name());
    }

    /**
     * Count unread notifications for the given user.
     */
    public long countUnread(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.countUnreadForUser(user, user.getRole().name());
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    /**
     * Mark all notifications for the current user as read.
     */
    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.markAllAsReadForUser(user, user.getRole().name());
    }

    /**
     * Send a notification to a specific user.
     */
    @Transactional
    public Notification notifyUser(Long userId, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Send a broadcast notification to all users.
     */
    @Transactional
    public Notification notifyAll(String message) {
        Notification notification = Notification.builder()
                .user(null)
                .targetRole(null)
                .message(message)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Send a notification to all users with a specific role (e.g. "ACCOUNT_EXECUTIVE").
     */
    @Transactional
    public Notification notifyRole(String role, String message) {
        Notification notification = Notification.builder()
                .user(null)
                .targetRole(role)
                .message(message)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }
}
