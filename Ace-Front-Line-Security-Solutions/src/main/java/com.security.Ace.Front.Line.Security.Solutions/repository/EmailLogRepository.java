package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.EmailLog;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailType;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailStatus;
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
    List<EmailLog> findEmailsBySentDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT e FROM EmailLog e ORDER BY e.sentAt DESC LIMIT 100")
    List<EmailLog> findRecentEmails();

    @Query("SELECT COUNT(e) FROM EmailLog e WHERE DATE(e.sentAt) = CURRENT_DATE AND e.status = 'SENT'")
    long countEmailsSentToday();
}