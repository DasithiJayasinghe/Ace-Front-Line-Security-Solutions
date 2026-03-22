package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftScheduleDTO {
    private Long id;
    private Long clientCompanyId;
    private String clientCompanyName;
    private Integer month;
    private Integer year;
    private ScheduleStatus status;
    private LocalDateTime submittedDate;
    private LocalDateTime approvedDate;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<ShiftDTO> shifts;
    private boolean editedByAreaManager;
    private LocalDateTime areaManagerEditedAt;
}
