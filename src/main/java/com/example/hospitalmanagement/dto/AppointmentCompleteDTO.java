package com.example.hospitalmanagement.dto;

import com.example.hospitalmanagement.model.enums.AppointmentStatus;

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
public class AppointmentCompleteDTO {

    private double medicationCost;
    private AppointmentStatus status;
}
