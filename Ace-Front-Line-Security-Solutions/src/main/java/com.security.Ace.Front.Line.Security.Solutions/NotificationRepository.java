package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
/**
 * ADMIN FINANCE
 */

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Get notifications for a specific user:
     * - direct notifications (user = :user)
     * - broadcast notifications (user IS NULL AND targetRole IS NULL)
     * - role-based broadcasts (user IS NULL AND targetRole = :role)
     * Ordered by newest first.
     */
    @Query("SELECT n FROM Notification n WHERE " +
            "n.user = :user " +
            "OR (n.user IS NULL AND n.targetRole IS NULL) " +
            "OR (n.user IS NULL AND n.targetRole = :role) " +
            "ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("user") User user, @Param("role") String role);

    /**
     * Count unread notifications for a user.
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.read = false AND (" +
            "n.user = :user " +
            "OR (n.user IS NULL AND n.targetRole IS NULL) " +
            "OR (n.user IS NULL AND n.targetRole = :role))")
    long countUnreadForUser(@Param("user") User user, @Param("role") String role);

    /**
     * Mark a single notification as read.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);

    /**
     * Mark all notifications for a user as read.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE " +
            "n.read = false AND (" +
            "n.user = :user " +
            "OR (n.user IS NULL AND n.targetRole IS NULL) " +
            "OR (n.user IS NULL AND n.targetRole = :role))")
    void markAllAsReadForUser(@Param("user") User user, @Param("role") String role);
}
