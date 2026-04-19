package com.example.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationImportResponse {
    private String message;
    private boolean success;
    private long processedRows;
    private long totalLocations;
    private boolean skipped;
}
