package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record CreateUpdateRequest(
        String content,
        List<String> mentions,
        List<FileAttachmentInputDto> attachments) {
}

