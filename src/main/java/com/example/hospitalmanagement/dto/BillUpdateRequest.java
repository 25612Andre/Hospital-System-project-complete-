package com.example.hospitalmanagement.dto;

import lombok.Data;

@Data
public class BillUpdateRequest {
    private Double amount;
    private String status;
    private String paymentMethod;
}
