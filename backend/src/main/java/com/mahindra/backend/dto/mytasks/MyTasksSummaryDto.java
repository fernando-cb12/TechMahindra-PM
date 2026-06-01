package com.mahindra.backend.dto.mytasks;

public record MyTasksSummaryDto(
        long assigned,
        long open,
        long inProgress,
        long dueSoon,
        long overdue,
        long completed,
        long stale) {
}
