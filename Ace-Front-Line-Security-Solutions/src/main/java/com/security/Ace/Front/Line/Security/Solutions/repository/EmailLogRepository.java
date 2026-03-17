package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.EmailLog;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Integer> {

    List<EmailLog> findByRecipientEmailOrderBySentAtDesc(String recipientEmail);

    List<EmailLog> findByEmailTypeOrderBySentAtDesc(EmailType emailType);

    List<EmailLog> findByStatusOrderBySentAtDesc(EmailStatus status);

    @Query("SELECT e FROM EmailLog e WHERE e.status = 'FAILED' ORDER BY e.sentAt DESC")
    List<EmailLog> findFailedEmails();

    @Query("SELECT e FROM EmailLog e WHERE e.sentAt BETWEEN :startDate AND :endDate ORDER BY e.sentAt DESC")
    List<EmailLog> findEmailsBySentDateRange(@Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    // Recent 100 emails — for admin email log view
    @Query(value = "SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100", nativeQuery = true)
    List<EmailLog> findRecentEmails();

    @Query("SELECT COUNT(e) FROM EmailLog e WHERE DATE(e.sentAt) = CURRENT_DATE AND e.status = 'SENT'")
    long countEmailsSentToday();
}